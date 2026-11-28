import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOnboardingChecklist from "@/components/admin/AdminOnboardingChecklist";
import {
  Building2, Users, Activity, UserCheck, Ticket, Clock, CheckCircle,
  TrendingDown, Zap, Flame, Award, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { CHART_COLORS, CHART_SERIES } from "@/lib/chartPalette";
import { collectSupabaseErrors, computeWaitMinutes, medianWaitMinutes, normalizeCategoryName } from "@/lib/adminAnalytics";

interface Totals {
  businesses: number; customers: number; activeQueues: number;
  visitorsToday: number; tokensToday: number; avgWait: number;
  servedToday: number; dropOffRate: number;
}
interface Insights {
  mostActive?: { name: string; count: number };
  highestWait?: { name: string; wait: number };
  fastestQueue?: { name: string; wait: number };
  topCategory?: { name: string; share: number };
  topDropOff?: { name: string; rate: number };
}

const ZERO: Totals = {
  businesses: 0, customers: 0, activeQueues: 0,
  visitorsToday: 0, tokensToday: 0, avgWait: 0, servedToday: 0, dropOffRate: 0,
};

const formatHour = (h: string | number) => {
  const num = Number(h);
  if (num === 0) return "12 AM";
  if (num < 12) return `${num} AM`;
  if (num === 12) return "12 PM";
  return `${num - 12} PM`;
};

const AdminOverview = () => {
  const [totals, setTotals] = useState<Totals>(ZERO);
  const [insights, setInsights] = useState<Insights>({});
  const [growth, setGrowth] = useState<{ week: string; businesses: number; customers: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number }[]>([]);
  const [daily, setDaily] = useState<{ day: string; served: number; queues: number }[]>([]);
  const [hourly, setHourly] = useState<{ hour: string; visitors: number }[]>([]);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);

  const load = async () => {
    const today0 = startOfDay(new Date()).toISOString();
    const last90 = subDays(new Date(), 90).toISOString();
    const [
      bizCountRes,
      custCountRes,
      queuesRes,
      visitorsTodayRes,
      visitors90Res,
      bizAllRes,
      custAllRes,
    ] = await Promise.all([
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase.from("customer_profiles").select("*", { count: "exact", head: true }),
      supabase.from("queues").select("id, name, status, business_id"),
      supabase.from("queue_visitors").select("queue_id, status, joined_at, called_at, served_at").gte("joined_at", today0),
      supabase.from("queue_visitors").select("queue_id, status, joined_at, called_at, served_at").gte("joined_at", last90),
      supabase.from("businesses").select("id, name, category, created_at"),
      supabase.from("customer_profiles").select("created_at"),
    ]);

    const errors = collectSupabaseErrors([
      { source: "businesses(count)", error: bizCountRes.error },
      { source: "customer_profiles(count)", error: custCountRes.error },
      { source: "queues", error: queuesRes.error },
      { source: "queue_visitors(today)", error: visitorsTodayRes.error },
      { source: "queue_visitors(90d)", error: visitors90Res.error },
      { source: "businesses", error: bizAllRes.error },
      { source: "customer_profiles", error: custAllRes.error },
    ]);
    setQueryErrors(errors);

    const bizCount = bizCountRes.count;
    const custCount = custCountRes.count;
    const qs = queuesRes.data || [];
    const vToday = visitorsTodayRes.data || [];
    const v90 = visitors90Res.data || [];
    const bizAll = bizAllRes.data || [];
    const custAll = custAllRes.data || [];
    const bizMap = new Map<string, { name: string }>(
      bizAll.map((b) => [String(b.id), { name: String(b.name) }] as [string, { name: string }]),
    );
    const queueBiz = new Map<string, string>(
      qs.map((q) => [String(q.id), String(q.business_id)] as [string, string]),
    );
    const queueName = new Map<string, string>(
      qs.map((q) => [String(q.id), String(q.name)] as [string, string]),
    );

    const active = qs.filter(q => q.status === "active").length;
    const servedRows = vToday.filter(v => v.status === "served");
    const served = servedRows.length;
    const total = vToday.length;
    const dropped = vToday.filter(v => v.status === "skipped" || v.status === "removed" || v.status === "no_show").length;
    const avgWait = medianWaitMinutes(servedRows);

    setTotals({
      businesses: bizCount ?? bizAll.length,
      customers: custCount ?? custAll.length,
      activeQueues: active,
      visitorsToday: total,
      tokensToday: total,
      avgWait,
      servedToday: served,
      dropOffRate: total ? Math.round((dropped / total) * 1000) / 10 : 0,
    });

    // Insights
    const tokensByBiz: Record<string, number> = {};
    vToday.forEach(v => {
      const bId = queueBiz.get(v.queue_id);
      if (bId) tokensByBiz[bId] = (tokensByBiz[bId] || 0) + 1;
    });
    const mostActiveEntry = Object.entries(tokensByBiz).sort((a, b) => b[1] - a[1])[0];

    const waitByQueue: Record<string, number[]> = {};
    servedRows.forEach(v => {
      const mins = computeWaitMinutes(v);
      if (mins !== null) {
        (waitByQueue[v.queue_id] = waitByQueue[v.queue_id] || []).push(mins);
      }
    });
    const queueAvgs = Object.entries(waitByQueue).map(([qid, arr]) => ({
      qid, avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    })).sort((a, b) => b.avg - a.avg);
    const slowest = queueAvgs[0];
    const fastest = queueAvgs[queueAvgs.length - 1];

    const catCount: Record<string, number> = {};
    bizAll.forEach(b => {
      const c = normalizeCategoryName(b.category);
      catCount[c] = (catCount[c] || 0) + 1;
    });
    const catTotal = Object.values(catCount).reduce((a, b) => a + b, 0) || 1;
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

    const dropByBiz: Record<string, { total: number; dropped: number }> = {};
    vToday.forEach(v => {
      const bId = queueBiz.get(v.queue_id);
      if (!bId) return;
      const e = dropByBiz[bId] = dropByBiz[bId] || { total: 0, dropped: 0 };
      e.total++;
      if (v.status === "skipped" || v.status === "removed" || v.status === "no_show") e.dropped++;
    });
    const dropRanked = Object.entries(dropByBiz)
      .filter(([, x]) => x.total >= 3)
      .map(([bId, x]) => ({ bId, rate: (x.dropped / x.total) * 100 }))
      .sort((a, b) => b.rate - a.rate)[0];

    setInsights({
      mostActive: mostActiveEntry ? { name: bizMap.get(mostActiveEntry[0])?.name || "—", count: mostActiveEntry[1] } : undefined,
      highestWait: slowest ? { name: queueName.get(slowest.qid) || "—", wait: Math.round(slowest.avg) } : undefined,
      fastestQueue: fastest && fastest !== slowest ? { name: queueName.get(fastest.qid) || "—", wait: Math.round(fastest.avg) } : undefined,
      topCategory: topCat ? { name: topCat[0], share: Math.round((topCat[1] / catTotal) * 100) } : undefined,
      topDropOff: dropRanked ? { name: bizMap.get(dropRanked.bId)?.name || "—", rate: Math.round(dropRanked.rate * 10) / 10 } : undefined,
    });

    // Growth — last 7 weeks of cumulative businesses + customers
    const weeks: { week: string; businesses: number; customers: number; weekStart: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const weekEnd = i === 0 ? new Date() : startOfDay(subDays(new Date(), i * 7));
      const bCount = bizAll.filter(b => new Date(b.created_at) <= weekEnd).length;
      const cCount = custAll.filter(c => new Date(c.created_at) <= weekEnd).length;
      weeks.push({ week: format(weekEnd, "MMM d"), businesses: bCount, customers: cCount, weekStart: weekEnd });
    }
    setGrowth(weeks);

    // Industry distribution (percent share)
    setCategories(Object.entries(catCount).map(([name, count]) => ({
      name, value: Math.round((count / catTotal) * 100),
    })).sort((a, b) => b.value - a.value));

    // Daily activity — last 7 days, from v90
    const dayBuckets: Record<string, { label: string; fullDate: string; served: number; queues: Set<string> }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, "yyyy-MM-dd");
      dayBuckets[dateKey] = {
        label: format(d, "EEE d"), // e.g. "Thu 26", "Wed 25"
        fullDate: format(d, "EEEE, MMM d"), // e.g. "Thursday, Nov 26"
        served: 0,
        queues: new Set(),
      };
    }
    const cutoff7 = startOfDay(subDays(new Date(), 6)).getTime();
    v90.filter(v => new Date(v.joined_at).getTime() >= cutoff7).forEach(v => {
      const dateKey = format(new Date(v.joined_at), "yyyy-MM-dd");
      if (!dayBuckets[dateKey]) return;
      if (v.status === "served") dayBuckets[dateKey].served++;
      dayBuckets[dateKey].queues.add(v.queue_id);
    });
    setDaily(Object.values(dayBuckets).map(x => ({
      day: x.label,
      fullDate: x.fullDate,
      served: x.served,
      queues: x.queues.size,
    })));

    // Hourly peak (last 90 days)
    const hourBuckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourBuckets[h] = 0;
    v90.forEach(v => { hourBuckets[new Date(v.joined_at).getHours()]++; });
    setHourly(Object.entries(hourBuckets)
      .filter(([h]) => Number(h) >= 8 && Number(h) <= 22)
      .map(([h, v]) => ({ hour: h, visitors: v })));
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time picture of everything happening on Qblink</p>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-full card-shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
        </span>
      </div>

      <AdminOnboardingChecklist />

      {queryErrors.length > 0 && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-4 mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Database query issue detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {queryErrors.join(" · ")}. Ensure you are signed in with an authorized admin account.
              </p>
            </div>
          </div>
          <button onClick={load} className="px-3 py-1.5 rounded-lg bg-card text-xs font-semibold border border-border shrink-0">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi icon={<Building2 className="w-4 h-4 text-primary" />} label="Total Businesses" value={totals.businesses} />
        <Kpi icon={<Users className="w-4 h-4 text-primary" />} label="Total Customers" value={totals.customers.toLocaleString()} sub="Registered accounts" />
        <Kpi icon={<Activity className="w-4 h-4 text-success" />} label="Active Queues" value={totals.activeQueues} sub="Live now" />
        <Kpi icon={<UserCheck className="w-4 h-4 text-primary" />} label="Visitors Today" value={totals.visitorsToday} sub="Queue joins today" />
        <Kpi icon={<Ticket className="w-4 h-4 text-primary" />} label="Tokens Generated" value={totals.tokensToday} />
        <Kpi icon={<Clock className="w-4 h-4 text-warning" />} label="Median Wait Time" value={`${totals.avgWait}m`} sub="Called/served today (≤3h)" />
        <Kpi icon={<CheckCircle className="w-4 h-4 text-success" />} label="Served Today" value={totals.servedToday} />
        <Kpi icon={<TrendingDown className="w-4 h-4 text-danger" />} label="Drop-off Rate" value={`${totals.dropOffRate}%`} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Insight icon={<Flame className="w-4 h-4 text-warning" />} title="Most active business" value={insights.mostActive?.name} sub={insights.mostActive ? `${insights.mostActive.count} tokens today` : "No tokens yet"} />
        <Insight icon={<Clock className="w-4 h-4 text-danger" />} title="Highest wait time" value={insights.highestWait?.name} sub={insights.highestWait ? `${insights.highestWait.wait}m average` : "—"} />
        <Insight icon={<Zap className="w-4 h-4 text-success" />} title="Fastest queue" value={insights.fastestQueue?.name} sub={insights.fastestQueue ? `${insights.fastestQueue.wait}m average` : "—"} />
        <Insight icon={<Award className="w-4 h-4 text-primary" />} title="Top category" value={insights.topCategory?.name} sub={insights.topCategory ? `${insights.topCategory.share}% of businesses` : "—"} />
        <Insight icon={<AlertTriangle className="w-4 h-4 text-warning" />} title="Highest drop-off" value={insights.topDropOff?.name} sub={insights.topDropOff ? `${insights.topDropOff.rate}% drop-off` : "Healthy"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Platform Growth" subtitle="Businesses and customers over the last 7 weeks" className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.primary }} /> Customers
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.secondary }} /> Businesses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="customers" stroke={CHART_COLORS.primary} fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="businesses" stroke={CHART_COLORS.secondary} fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Industry Distribution" subtitle="Where Qblink is used most">
          {categories.length === 0 ? <Empty /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {categories.map((_, i) => <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3 text-xs">
                {categories.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_SERIES[i % CHART_SERIES.length] }} /> {c.name}
                    </span>
                    <span className="font-semibold text-foreground">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Queue Activity" subtitle="Customers served per day (last 7 days)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || _}
                formatter={(val: number) => [`${val} served`, "Customers"]}
              />
              <Bar dataKey="served" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak Usage Hours" subtitle="Visitors by hour of day (last 90 days)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatHour}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }}
                labelFormatter={(label) => `${formatHour(label)} (${label}:00)`}
              />
              <Line type="monotone" dataKey="visitors" stroke={CHART_COLORS.secondary} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminLayout>
  );
};

const Kpi = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-[11px] text-success mt-1">{sub}</p>}
  </div>
);

const Insight = ({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value?: string; sub: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow">
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{title}</span></div>
    <p className="text-sm font-bold text-foreground truncate">{value || "—"}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
  </div>
);

const ChartCard = ({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-2xl p-5 card-shadow ${className}`}>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
    {children}
  </div>
);

const Empty = () => (
  <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
);

export default AdminOverview;
