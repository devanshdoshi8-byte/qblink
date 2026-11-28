import { format, startOfDay, subDays } from "date-fns";

export interface AnalyticsVisitor {
  joined_at: string;
  status: string;
}

export function analyticsPeriodStart(days: number, now = new Date()) {
  return startOfDay(subDays(now, days - 1));
}

export function dailyVisitorTrend(visitors: AnalyticsVisitor[], days: number, now = new Date()) {
  const buckets = new Map<string, { date: string; served: number; skipped: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(now, i), "yyyy-MM-dd");
    buckets.set(date, { date, served: 0, skipped: 0 });
  }
  visitors.forEach(v => {
    const joined = new Date(v.joined_at);
    if (!Number.isFinite(joined.getTime())) return;
    const bucket = buckets.get(format(joined, "yyyy-MM-dd"));
    if (!bucket) return;
    if (v.status === "served") bucket.served++;
    if (v.status === "skipped") bucket.skipped++;
  });
  return Array.from(buckets.values());
}

export function hourlyVisitorTraffic(visitors: AnalyticsVisitor[]) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, visitors: 0 }));
  visitors.forEach(v => {
    const joined = new Date(v.joined_at);
    if (!Number.isFinite(joined.getTime())) return;
    const hour = joined.getHours();
    const bucket = buckets[hour];
    if (bucket) bucket.visitors++;
  });
  return buckets;
}

export function busiestBucketIndex(totals: number[]) {
  const peak = Math.max(0, ...totals);
  return peak > 0 ? totals.indexOf(peak) : -1;
}