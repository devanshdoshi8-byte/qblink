import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonPageHeader, SkeletonStatGrid, SkeletonChartCard } from "@/components/skeletons/DashboardSkeletons";
import { format, startOfDay, subDays } from "date-fns";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";
import { CHART_COLORS, CHART_SERIES } from "@/lib/chartPalette";
import { analyticsPeriodStart } from "@/lib/queueAnalytics";
import {
  collectSupabaseErrors,
  computeWaitMinutes,
  medianWaitMinutes,
  normalizeCategoryName,
  visitorIdentityKey,
} from "@/lib/adminAnalytics";

interface VisitorRow {
  queue_id: string;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  visitor_name: string | null;
  phone: string | null;
  customer_user_id: string | null;
}

interface BusinessRow {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

interface QueueRow {
  id: string;
  business_id: string;
  status: string;
}

interface CustomerProfileRow {
  user_id: string;
  created_at: string;
}

const formatHour = (h: string | number) => {
  const num = Number(h);
  if (num === 0) return "12 AM";
  if (num < 12) return `${num} AM`;
  if (num === 12) return "12 PM";
  return `${num - 12} PM`;
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
};

const AdminAnalytics = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [category, setCategory] = useState("All");
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [customers, setCustomers] = useState<CustomerProfileRow[]>([]);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const since = analyticsPeriodStart(days).toISOString();

    const [v, b, q, c] = await Promise.all([
      supabase
        .from("queue_visitors")
        .select("queue_id, status, joined_at, called_at, served_at, visitor_name, phone, customer_user_id")
        .gte("joined_at", since),
      supabase.from("businesses").select("id, name, category, created_at"),
      supabase.from("queues").select("id, business_id, status"),
      supabase.from("customer_profiles").select("user_id, created_at"),
    ]);

    const errors = collectSupabaseErrors([
      { source: "queue_visitors", error: v.error },
      { source: "businesses", error: b.error },
      { source: "queues", error: q.error },
      { source: "customer_profiles", error: c.error },
    ]);

    setQueryErrors(errors);
    if (!v.error) setVisitors((v.data as VisitorRow[]) || []);
    if (!b.error) setBusinesses((b.data as BusinessRow[]) || []);
    if (!q.error) setQueues((q.data as QueueRow[]) || []);
    if (!c.error) setCustomers((c.data as CustomerProfileRow[]) || []);
    if (errors.length === 0) setLastSyncedAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [range]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-analytics")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const queueBiz = useMemo(() => new Map(queues.map((q) => [q.id, q.business_id])), [queues]);
  const bizCat = useMemo(
    () => new Map(businesses.map((b) => [b.id, normalizeCategoryName(b.category)])),
    [businesses],
  );

  const scopedBusinesses = useMemo(
    () =>
      category === "All"
        ? businesses
        : businesses.filter((b) => normalizeCategoryName(b.category) === category),
    [businesses, category],
  );

  const scopedQueues = useMemo(
    () =>
      category === "All"
        ? queues
        : queues.filter((q) => bizCat.get(q.business_id) === category),
    [queues, category, bizCat],
  );

  const scoped = useMemo(() => {
    if (category === "All") return visitors;
    return visitors.filter((v) => bizCat.get(queueBiz.get(v.queue_id) || "") === category);
  }, [visitors, category, queueBiz, bizCat]);

  const today0 = startOfDay(new Date()).getTime();
  const vToday = scoped.filter((v) => new Date(v.joined_at).getTime() >= today0);
  const served = scoped.filter((v) => v.status === "served");
  const dropped = scoped.filter(
    (v) => v.status === "skipped" || v.status === "removed" || v.status === "no_show",
  );
  const waitSamples = served
    .map(computeWaitMinutes)
    .filter((n): n is number => n !== null);
  const medianWait = medianWaitMinutes(served);
  const completion = scoped.length ? Math.round((served.length / scoped.length) * 100) : 0;
  const dropOff = scoped.length ? +((dropped.length / scoped.length) * 100).toFixed(1) : 0;

  const activeBizInRange = new Set(scoped.map((v) => queueBiz.get(v.queue_id)).filter(Boolean));
  const todayBiz = new Set(vToday.map((v) => queueBiz.get(v.queue_id)).filter(Boolean));
  const todayVisitors = new Set(
    vToday.map(visitorIdentityKey).filter((k): k is string => Boolean(k)),
  );

  const identityCounts: Record<string, number> = {};
  scoped.forEach((v) => {
    const key = visitorIdentityKey(v);
    if (!key) return;
    identityCounts[key] = (identityCounts[key] || 0) + 1;
  });
  const repeaters = Object.values(identityCounts).filter((n) => n > 1).length;
  const uniques = Object.keys(identityCounts).length;
  const repeatPct = uniques ? Math.round((repeaters / uniques) * 100) : 0;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const rangeLabel = range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days";
  const buckets = range === "7d" ? 7 : range === "30d" ? 6 : 12;
  const bucketDays = days / buckets;

  const growth = useMemo(() => {
    return Array.from({ length: buckets }, (_, i) => {
      const startDate = startOfDay(subDays(new Date(), Math.round(days - i * bucketDays)));
      const endDate =
        i === buckets - 1
          ? new Date()
          : startOfDay(subDays(new Date(), Math.round(days - (i + 1) * bucketDays)));
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      const label = range === "7d" ? format(startDate, "EEE d") : format(startDate, "MMM d");
      const fullDate =
        range === "7d"
          ? format(startDate, "EEEE, MMM d")
          : `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`;

      const bizCount = scopedBusinesses.filter((b) => new Date(b.created_at).getTime() <= endMs).length;
      const custCount = customers.filter((c) => new Date(c.created_at).getTime() <= endMs).length;
      const visitCount = scoped.filter((v) => {
        const t = new Date(v.joined_at).getTime();
        return t >= startMs && t <= endMs;
      }).length;

      return {
        label,
        fullDate,
        businesses: bizCount,
        customers: custCount,
        visits: visitCount,
      };
    });
  }, [buckets, days, bucketDays, range, scopedBusinesses, customers, scoped]);

  const dailyWindow = range === "7d" ? 7 : range === "30d" ? 14 : 30;
  const dailyActivity = useMemo(() => {
    const dailyMap: Record<string, { label: string; fullDate: string; queues: Set<string>; served: number }> = {};
    for (let i = dailyWindow - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, "yyyy-MM-dd");
      dailyMap[dateKey] = {
        label: format(d, dailyWindow <= 7 ? "EEE d" : "MMM d"),
        fullDate: format(d, "EEEE, MMM d"),
        queues: new Set(),
        served: 0,
      };
    }
    const cutoff = startOfDay(subDays(new Date(), dailyWindow - 1)).getTime();
    scoped
      .filter((v) => new Date(v.joined_at).getTime() >= cutoff)
      .forEach((v) => {
        const dateKey = format(new Date(v.joined_at), "yyyy-MM-dd");
        if (!dailyMap[dateKey]) return;
        dailyMap[dateKey].queues.add(v.queue_id);
        if (v.status === "served") dailyMap[dateKey].served++;
      });
    return Object.values(dailyMap).map((x) => ({
      day: x.label,
      fullDate: x.fullDate,
      queues: x.queues.size,
      served: x.served,
    }));
  }, [dailyWindow, scoped]);

  const hourly = useMemo(() => {
    const hourMap: Record<number, number> = {};
    for (let h = 8; h <= 22; h++) hourMap[h] = 0;
    scoped.forEach((v) => {
      const h = new Date(v.joined_at).getHours();
      if (hourMap[h] !== undefined) hourMap[h]++;
    });
    return Object.entries(hourMap).map(([hour, count]) => ({ hour, visitors: count }));
  }, [scoped]);

  const categories = useMemo(() => {
    const catMap: Record<string, number> = {};
    businesses.forEach((b) => {
      const cat = normalizeCategoryName(b.category);
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [businesses]);

  const retention = useMemo(() => {
    const sliceCount = Math.min(7, buckets);
    return Array.from({ length: sliceCount }, (_, i) => {
      const startDate = startOfDay(subDays(new Date(), Math.round(days - i * bucketDays)));
      const endDate =
        i === sliceCount - 1
          ? new Date()
          : startOfDay(subDays(new Date(), Math.round(days - (i + 1) * bucketDays)));
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      const slice = scoped.filter((v) => {
        const t = new Date(v.joined_at).getTime();
        return t >= startMs && t <= endMs;
      });
      const cMap: Record<string, number> = {};
      slice.forEach((v) => {
        const k = visitorIdentityKey(v);
        if (k) cMap[k] = (cMap[k] || 0) + 1;
      });
      const u = Object.keys(cMap).length;
      const r = Object.values(cMap).filter((n) => n > 1).length;
      return {
        label: range === "7d" ? format(startDate, "EEE d") : format(startDate, "MMM d"),
        rate: u ? Math.round((r / u) * 100) : 0,
      };
    });
  }, [buckets, days, bucketDays, range, scoped]);

  const waiting = scoped.filter((v) => v.status === "waiting" || v.status === "called").length;
  const servedVsWaiting = [
    { name: "Served", value: served.length },
    { name: "Waiting / Called", value: waiting },
    { name: "Dropped / Skipped", value: dropped.length },
  ];

  const allCategories = useMemo(
    () => Array.from(new Set(businesses.map((b) => normalizeCategoryName(b.category)))).sort(),
    [businesses],
  );

  if (loading) {
    return (
      <AdminLayout>
        <SkeletonPageHeader />
        <SkeletonStatGrid count={8} className="mb-6 md:grid-cols-4" />
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <SkeletonChartCard wide />
          <SkeletonChartCard height={260} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonChartCard height={240} />
          <SkeletonChartCard height={240} />
        </div>
      </AdminLayout>
    );
  }

  const activeQueuesInScope = scopedQueues.filter((q) => q.status === "active").length;

  return (
    <AdminLayout>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live database metrics across {businesses.length} businesses &amp; {customers.length} customer accounts
            {lastSyncedAt ? ` · Synced ${format(lastSyncedAt, "h:mm a")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-sm"
          >
            <option value="All">All Categories ({businesses.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-1 bg-card rounded-xl p-1 card-shadow">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "7d" ? "Week" : r === "30d" ? "Month" : "90 days"}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

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
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-card text-xs font-semibold border border-border shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {queryErrors.length === 0 && scoped.length === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2.5 text-sm">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">
                No queue tickets recorded for {category === "All" ? "the platform" : category} in the last {rangeLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Database connected: {scopedBusinesses.length} registered{" "}
                {category === "All" ? "business(es)" : `${category} business(es)`} and {activeQueuesInScope} active queue(s).
                {range === "7d" ? " Switch to Month or 90 days to inspect earlier sessions." : ""}
              </p>
            </div>
          </div>
          {range !== "90d" && (
            <button
              onClick={() => setRange("90d")}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0"
            >
              View 90 days
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Queue Tickets" value={scoped.length.toLocaleString()} sub={`In last ${rangeLabel}`} />
        <Stat label="Visits Served" value={served.length.toLocaleString()} sub={`${completion}% completion`} />
        <Stat
          label="Median Wait Time"
          value={`${medianWait}m`}
          sub={waitSamples.length ? `From ${waitSamples.length} served (≤3h)` : "No served wait samples"}
        />
        <Stat
          label="Active Businesses"
          value={activeBizInRange.size.toString()}
          sub={`${todayBiz.size} today · ${scopedBusinesses.length} registered`}
        />
        <Stat
          label="Unique Visitors"
          value={uniques.toLocaleString()}
          sub={`${todayVisitors.size} today${category === "All" ? ` · ${customers.length} accounts` : ""}`}
        />
        <Stat label="Completion Rate" value={`${completion}%`} sub={`${served.length} of ${scoped.length} tickets`} />
        <Stat label="Drop-off Rate" value={`${dropOff}%`} sub={`${dropped.length} skipped / left`} />
        <Stat label="Repeat Usage" value={`${repeatPct}%`} sub={`${repeaters} of ${uniques} unique visitors`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card
          title={category === "All" ? "Growth Over Time" : `${category} Growth & Ticket Activity`}
          subtitle={
            category === "All"
              ? "Cumulative registered customer accounts and businesses"
              : `Registered ${category} businesses vs tickets in period (excludes unrelated categories)`
          }
          wide
        >
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.primary }} />
              {category === "All" ? "Customer Accounts" : `${category} Visits`}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS.secondary }} />
              {category === "All" ? "Businesses" : `${category} Businesses`}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="agPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="agSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || _}
              />
              <Area
                type="monotone"
                dataKey={category === "All" ? "customers" : "visits"}
                name={category === "All" ? "Customer Accounts" : `${category} Visits`}
                stroke={CHART_COLORS.primary}
                fill="url(#agPrimary)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="businesses"
                name={category === "All" ? "Businesses" : `${category} Businesses`}
                stroke={CHART_COLORS.secondary}
                fill="url(#agSecondary)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Ticket Outcomes" subtitle={`Breakdown across last ${rangeLabel}`}>
          {scoped.length === 0 ? (
            <EmptyState message={`No tickets in last ${rangeLabel}`} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={servedVsWaiting} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {servedVsWaiting.map((_, i) => (
                      <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3 text-xs">
                {servedVsWaiting.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CHART_SERIES[i % CHART_SERIES.length] }}
                      />{" "}
                      {s.name}
                    </span>
                    <span className="font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Daily Queue Activity" subtitle={`Active queues & served per day (last ${dailyWindow} days)`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || _}
              />
              <Bar dataKey="served" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} name="Served" />
              <Bar dataKey="queues" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} name="Active Queues" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Peak Hours" subtitle={`Visitors by hour of day (last ${rangeLabel})`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatHour} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label) => `${formatHour(label)} (${label}:00)`}
              />
              <Bar dataKey="visitors" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Business Categories" subtitle={`All ${businesses.length} registered businesses by category`}>
          {categories.length === 0 ? (
            <EmptyState message="No businesses registered yet" />
          ) : (
            <div className="grid sm:grid-cols-2 items-center gap-4">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-xs">
                {categories.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted-foreground truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: CHART_SERIES[i % CHART_SERIES.length] }}
                      />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-semibold text-foreground shrink-0">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Customer Retention" subtitle="Returning visitor share per period (%)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={retention}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [`${val}%`, "Returning Rate"]} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={CHART_COLORS.positive}
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AdminLayout>
  );
};

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
    {sub && <p className="text-[11px] text-primary mt-0.5">{sub}</p>}
  </div>
);

const Card = ({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className={`bg-card rounded-2xl p-5 card-shadow ${wide ? "lg:col-span-2" : ""}`}>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
    {children}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
    {message}
  </div>
);

export default AdminAnalytics;
