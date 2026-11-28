import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeActiveAvgWaitMinutes } from "@/lib/queueInactivity";
import { CHART_COLORS } from "@/lib/chartPalette";
import { SkeletonStatGrid, SkeletonChartCard } from "@/components/skeletons/DashboardSkeletons";
import { Clock, CheckCircle2, MapPin, Ticket } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
  const [loading, setLoading] = useState(true);

  const fetchCustomerAnalytics = useCallback(async () => {
    setLoading(true);
    const days = range === "week" ? 7 : range === "month" ? 30 : 90;
    const since = startOfDay(subDays(new Date(), days)).toISOString();

    const { data: visitors } = await (supabase as any)
      .from("queue_visitors")
      .select("queue_id, status, joined_at, served_at")
      .eq("customer_user_id", userId)
      .gte("joined_at", since);

    const all = (visitors || []) as VisitorRow[];
    if (all.length === 0) {
      setStats({ total: 0, served: 0, avgWait: 0, uniquePlaces: 0, activeNow: 0 });
      setWeekly([]);
      setHourly([]);
      setLoading(false);
      return;
    }

    const queueIds = Array.from(new Set(all.map((v) => v.queue_id)));
    const { data: queues } = await supabase
      .from("queues")
      .select("id, business_id")
      .in("id", queueIds);

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

    const hourBuckets: Record<string, number> = {};
    for (let h = 9; h <= 20; h++) hourBuckets[`${h}:00`] = 0;
    all.forEach((v) => {
      const h = new Date(v.joined_at).getHours();
      const key = `${h}:00`;
      if (hourBuckets[key] !== undefined) hourBuckets[key]++;
    });
    setHourly(Object.entries(hourBuckets).map(([hour, visitorsCount]) => ({ hour, visitors: visitorsCount })));

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

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonStatGrid count={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonChartCard height={190} />
          <SkeletonChartCard height={190} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 min-w-0" aria-label="Your queue analytics">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Your Activity
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Personal visits, wait times, and peak hours
          </p>
        </div>
        <div className="inline-flex gap-1 bg-card rounded-xl p-1 card-shadow">
          {(["week", "month", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "week" ? "7d" : r === "month" ? "30d" : "90d"}
            </button>
          ))}
        </div>
      </div>

      {/* 4-tile bold Bento KPI row (matches Admin UI) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BentoStat
          icon={<Ticket className="w-4 h-4 text-primary" />}
          label="Visits"
          value={stats.total}
          sub="Joined"
        />
        <BentoStat
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          label="Served"
          value={stats.served}
          sub={`${completionPct}% rate`}
        />
        <BentoStat
          icon={<Clock className="w-4 h-4 text-warning" />}
          label="Avg Wait"
          value={`${stats.avgWait}m`}
          sub="Active avg"
        />
        <BentoStat
          icon={<MapPin className="w-4 h-4 text-primary" />}
          label={stats.activeNow > 0 ? "Active Now" : "Places"}
          value={stats.activeNow > 0 ? stats.activeNow : stats.uniquePlaces}
          sub={stats.activeNow > 0 ? `${stats.uniquePlaces} venues` : "Venues"}
          highlight={stats.activeNow > 0}
        />
      </div>

      {stats.total === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-5 text-sm text-muted-foreground">
          No queue visits in this window yet. Join a queue to see your wait times and visit trends.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-5 card-shadow min-w-0">
            <div className="mb-4">
              <h3 className="font-bold text-foreground">Weekly Visits</h3>
              <p className="text-xs text-muted-foreground">Served vs skipped (last 7 days)</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="served" name="Served" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="skipped" name="Skipped" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl p-5 card-shadow min-w-0">
            <div className="mb-4">
              <h3 className="font-bold text-foreground">Hourly Pattern</h3>
              <p className="text-xs text-muted-foreground">When you usually join queues</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="visitors" name="Visits" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const BentoStat = ({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl p-5 card-shadow flex flex-col justify-between gap-2 min-w-0 ${
      highlight ? "bg-primary/10 border border-primary/30" : "bg-card"
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </span>
    </div>
    <div>
      <p className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  </div>
);

export default CustomerAnalyticsBento;
