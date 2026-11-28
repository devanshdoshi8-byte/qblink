import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MagicBento, { type MagicBentoCard } from "@/components/reactbits/MagicBento";
import { computeActiveAvgWaitMinutes } from "@/lib/queueInactivity";
import { CHART_COLORS, CHART_SERIES } from "@/lib/chartPalette";
import { SkeletonStatGrid, SkeletonChartCard } from "@/components/skeletons/DashboardSkeletons";
import { Clock, CheckCircle2, MapPin, Ticket } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = CHART_SERIES;

interface CustomerAnalyticsBentoProps {
  userId: string;
}

interface VisitorRow {
  queue_id: string;
  status: string;
  joined_at: string;
  served_at: string | null;
}

const CustomerAnalyticsBento = ({ userId }: CustomerAnalyticsBentoProps) => {
  const [range, setRange] = useState<"week" | "month" | "90d">("week");
  const [stats, setStats] = useState({
    total: 0,
    served: 0,
    avgWait: 0,
    uniquePlaces: 0,
    activeNow: 0,
  });
  const [weekly, setWeekly] = useState<{ day: string; served: number; skipped: number }[]>([]);
  const [hourly, setHourly] = useState<{ hour: string; visitors: number }[]>([]);
  const [byPlace, setByPlace] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerAnalytics = useCallback(async () => {
    setLoading(true);
    const days = range === "week" ? 7 : range === "month" ? 30 : 90;
    const since = startOfDay(subDays(new Date(), days)).toISOString();

    const { data: visitors } = await supabase
      .from("queue_visitors")
      .select("queue_id, status, joined_at, served_at")
      .eq("customer_user_id", userId)
      .gte("joined_at", since);

    const all = (visitors || []) as VisitorRow[];
    if (all.length === 0) {
      setStats({ total: 0, served: 0, avgWait: 0, uniquePlaces: 0, activeNow: 0 });
      setWeekly([]);
      setHourly([]);
      setByPlace([]);
      setLoading(false);
      return;
    }

    const queueIds = Array.from(new Set(all.map((v) => v.queue_id)));
    const { data: queues } = await supabase
      .from("queues")
      .select("id, business_id, name")
      .in("id", queueIds);

    const bizIds = Array.from(new Set((queues || []).map((q) => q.business_id)));
    const { data: businesses } = bizIds.length
      ? await supabase.from("businesses").select("id, name").in("id", bizIds)
      : { data: [] as { id: string; name: string }[] };

    const bizNameById = new Map((businesses || []).map((b) => [b.id, b.name]));
    const queueToBiz = new Map((queues || []).map((q) => [q.id, q.business_id]));

    const served = all.filter((v) => v.status === "served");
    const activeNow = all.filter((v) => v.status === "waiting" || v.status === "called").length;
    const avgWait = computeActiveAvgWaitMinutes(served);

    const visitedBizIds = new Set(
      all.map((v) => queueToBiz.get(v.queue_id)).filter((id): id is string => Boolean(id))
    );

    setStats({
      total: all.length,
      served: served.length,
      avgWait,
      uniquePlaces: visitedBizIds.size,
      activeNow,
    });

    // Weekly visits (last 7 days) — mirrors business Analytics.tsx
    const dayBuckets: Record<string, { served: number; skipped: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "EEE");
      dayBuckets[d] = { served: 0, skipped: 0 };
    }
    const cutoff7 = startOfDay(subDays(new Date(), 6)).getTime();
    all
      .filter((v) => new Date(v.joined_at).getTime() >= cutoff7)
      .forEach((v) => {
        const d = format(new Date(v.joined_at), "EEE");
        if (!dayBuckets[d]) return;
        if (v.status === "served") dayBuckets[d].served++;
        if (v.status === "skipped" || v.status === "removed" || v.status === "no_show") {
          dayBuckets[d].skipped++;
        }
      });
    setWeekly(Object.entries(dayBuckets).map(([day, val]) => ({ day, ...val })));

    // Hourly activity (9:00 - 20:00) — mirrors business Analytics.tsx
    const hourBuckets: Record<string, number> = {};
    for (let h = 9; h <= 20; h++) hourBuckets[`${h}:00`] = 0;
    all.forEach((v) => {
      const h = new Date(v.joined_at).getHours();
      const key = `${h}:00`;
      if (hourBuckets[key] !== undefined) hourBuckets[key]++;
    });
    setHourly(Object.entries(hourBuckets).map(([hour, visitorsCount]) => ({ hour, visitors: visitorsCount })));

    // Split by place visited
    const placeCounts: Record<string, number> = {};
    all.forEach((v) => {
      const bId = queueToBiz.get(v.queue_id);
      const label = (bId && bizNameById.get(bId)) || "Other";
      placeCounts[label] = (placeCounts[label] || 0) + 1;
    });
    setByPlace(
      Object.entries(placeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    );

    setLoading(false);
  }, [userId, range]);

  useEffect(() => {
    fetchCustomerAnalytics();
    const ch = supabase
      .channel(`customer-analytics-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, fetchCustomerAnalytics)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, fetchCustomerAnalytics]);

  const completionPct = stats.total ? Math.round((stats.served / stats.total) * 100) : 0;
  const rangeLabel = range === "week" ? "last 7 days" : range === "month" ? "last 30 days" : "last 90 days";

  const bentoCards: MagicBentoCard[] = [
    {
      id: "customer-total-visits",
      label: "Total Visits",
      title: "Queues joined",
      value: stats.total,
      description: `Across ${rangeLabel}`,
      icon: <Ticket className="w-4 h-4" />,
    },
    {
      id: "customer-completed-visits",
      label: "Completed",
      title: "Turns served",
      value: stats.served,
      description: `${completionPct}% completion rate`,
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: "customer-avg-wait",
      label: "Avg Wait Time",
      title: "Your wait time",
      value: `${stats.avgWait}m`,
      description: "Active queue average",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "customer-places-visited",
      label: stats.activeNow > 0 ? "Active Now" : "Places Visited",
      title: stats.activeNow > 0 ? "Live queues" : "Unique venues",
      value: stats.activeNow > 0 ? stats.activeNow : stats.uniquePlaces,
      description:
        stats.activeNow > 0
          ? `${stats.uniquePlaces} places visited in ${rangeLabel}`
          : `Visited in ${rangeLabel}`,
      accent: stats.activeNow > 0,
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  if (loading) {
    return (
      <section className="mb-8">
        <SkeletonStatGrid count={4} className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonChartCard wide />
          <SkeletonChartCard height={200} />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8" aria-label="Your queue analytics">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Your Queue Activity</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Personal wait times, completed visits, and peak hours
          </p>
        </div>
        <div className="flex gap-1 bg-card rounded-xl p-1 card-shadow">
          {(["week", "month", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`min-h-[36px] px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "week" ? "This Week" : r === "month" ? "This Month" : "Last 90 Days"}
            </button>
          ))}
        </div>
      </div>

      <MagicBento
        columns={4}
        rowHeight={140}
        gap={12}
        radius={18}
        enableBorderGlow={true}
        enableSpotlight={true}
        spotlightRadius={280}
        clickEffect={false}
        className="mb-4"
        cards={bentoCards}
      />

      {stats.total === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground">
          No queue visits recorded in this period yet. Join a queue below to track your wait times and visit history.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card rounded-2xl p-5 card-shadow min-w-0">
              <h3 className="font-semibold text-foreground">Weekly Visits</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Visits served vs skipped per day (last 7 days)
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="served"
                    name="Served"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="skipped"
                    name="Skipped"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-2xl p-5 card-shadow min-w-0">
              <h3 className="font-semibold text-foreground">Places Visited</h3>
              <p className="text-xs text-muted-foreground mb-4">Distribution by business</p>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={byPlace}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={4}
                  >
                    {byPlace.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3 text-xs">
                {byPlace.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="font-semibold text-foreground shrink-0">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5 card-shadow min-w-0">
            <h3 className="font-semibold text-foreground">Hourly Visit Pattern</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Hours of the day you most often join queues
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                />
                <Bar dataKey="visitors" name="Visits" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerAnalyticsBento;
