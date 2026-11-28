export const MAX_VALID_WAIT_MINUTES = 180;
export const MAX_PHYSICAL_WAIT_MINUTES_PER_VISIT = 60;
export const PHYSICAL_WAIT_AVOIDANCE_FACTOR = 0.6;

const GENERIC_NAMES = new Set(["guest", "customer", "visitor", "walk-in", "walk in", "anonymous", "user"]);

export interface WaitSampleVisitor {
  joined_at: string;
  called_at?: string | null;
  served_at?: string | null;
}

export interface IdentityVisitor {
  customer_user_id?: string | null;
  user_id?: string | null;
  phone?: string | null;
  visitor_name?: string | null;
}

/**
 * Computes actual customer wait time in minutes using called_at (when available)
 * with served_at fallback, rejecting negative values and stale unclosed tickets (> 3h).
 */
export function computeWaitMinutes(visitor: WaitSampleVisitor): number | null {
  const endIso = visitor.called_at || visitor.served_at;
  if (!visitor.joined_at || !endIso) return null;
  const start = new Date(visitor.joined_at).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const mins = (end - start) / 60000;
  if (mins < 0 || mins > MAX_VALID_WAIT_MINUTES) return null;
  return mins;
}

/**
 * Computes median wait time in rounded minutes to prevent isolated outliers
 * from skewing queue or platform wait metrics.
 */
export function medianWaitMinutes(visitors: WaitSampleVisitor[]): number {
  const valid = visitors
    .map(computeWaitMinutes)
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);
  if (valid.length === 0) return 0;
  const mid = Math.floor(valid.length / 2);
  const median = valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  return Math.round(median);
}

/**
 * Estimates total hours of physical waiting avoided across served visits.
 * Excludes stale >3h tickets via computeWaitMinutes, caps each visit at 60m
 * so forgotten test/demo tickets cannot inflate impact, and applies the
 * 60% remote-wait avoidance factor.
 */
export function computePhysicalHoursSaved(visitors: WaitSampleVisitor[]): {
  hours: number;
  avgSavedMinutes: number;
  validCount: number;
} {
  let totalCappedMinutes = 0;
  let validCount = 0;
  for (const v of visitors) {
    const mins = computeWaitMinutes(v);
    if (mins === null) continue;
    totalCappedMinutes += Math.min(mins, MAX_PHYSICAL_WAIT_MINUTES_PER_VISIT);
    validCount += 1;
  }
  const physicalMinutes = totalCappedMinutes * PHYSICAL_WAIT_AVOIDANCE_FACTOR;
  const rawHours = physicalMinutes / 60;
  const hours = rawHours < 10 ? Math.round(rawHours * 10) / 10 : Math.round(rawHours);
  const avgSavedMinutes = validCount > 0 ? Math.round(physicalMinutes / validCount) : 0;
  return { hours, avgSavedMinutes, validCount };
}

/**
 * Derives a stable visitor identity key preferring customer_user_id, then normalized phone,
 * then non-generic visitor name.
 */
export function visitorIdentityKey(visitor: IdentityVisitor): string | null {
  const uid = visitor.customer_user_id || visitor.user_id;
  if (uid) return `u:${uid}`;
  const rawPhone = (visitor.phone || "").trim();
  if (rawPhone) {
    const digits = rawPhone.replace(/\D/g, "");
    return `p:${digits.length >= 7 ? digits.slice(-10) : rawPhone}`;
  }
  const name = (visitor.visitor_name || "").trim().toLowerCase();
  if (!name || GENERIC_NAMES.has(name)) return null;
  return `n:${name}`;
}

export function normalizeCategoryName(category?: string | null): string {
  const trimmed = (category || "").trim();
  return trimmed || "Other";
}

export function collectSupabaseErrors(
  checks: Array<{ source: string; error?: { message?: string } | null }>,
): string[] {
  return checks
    .filter((c) => Boolean(c.error))
    .map((c) => `${c.source}: ${c.error?.message || "Query failed"}`);
}
