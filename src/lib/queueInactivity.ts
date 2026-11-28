export const INACTIVITY_PAUSE_MS = 60 * 60 * 1000;
export const DEFAULT_INACTIVITY_MINUTES = 60;
export const MIN_INACTIVITY_MINUTES = 15;
export const MAX_INACTIVITY_MINUTES = 240;

export function clampInactivityMinutes(minutes?: number | null): number {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return DEFAULT_INACTIVITY_MINUTES;
  }
  return Math.min(MAX_INACTIVITY_MINUTES, Math.max(MIN_INACTIVITY_MINUTES, Math.round(minutes)));
}

export function getInactivityThresholdMs(minutes?: number | null): number {
  return clampInactivityMinutes(minutes) * 60 * 1000;
}

export function readStoredInactivityMinutes(businessId?: string | null): number {
  if (!businessId || typeof window === "undefined") return DEFAULT_INACTIVITY_MINUTES;
  try {
    const raw = localStorage.getItem(`qblink:inactivity-minutes:${businessId}`);
    if (!raw) return DEFAULT_INACTIVITY_MINUTES;
    return clampInactivityMinutes(Number(raw));
  } catch {
    return DEFAULT_INACTIVITY_MINUTES;
  }
}

export function writeStoredInactivityMinutes(businessId: string, minutes: number): void {
  if (!businessId || typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `qblink:inactivity-minutes:${businessId}`,
      String(clampInactivityMinutes(minutes))
    );
  } catch {
    // ignore storage errors
  }
}

export interface ActivityQueueLike {
  status?: string | null;
  updated_at?: string | null;
}

export interface ActivityVisitorLike {
  status?: string | null;
  joined_at?: string | null;
  called_at?: string | null;
  served_at?: string | null;
}

function parseTimestampMs(value?: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Returns the most recent activity timestamp (ms) across the queue record
 * and its visitors (join, call, or serve events).
 */
export function getLastQueueActivityMs(
  queue: ActivityQueueLike | null | undefined,
  visitors: ActivityVisitorLike[] = []
): number | null {
  let latest = parseTimestampMs(queue?.updated_at);

  for (const v of visitors) {
    const candidates = [
      parseTimestampMs(v.joined_at),
      parseTimestampMs(v.called_at),
      parseTimestampMs(v.served_at),
    ];
    for (const ts of candidates) {
      if (ts !== null && (latest === null || ts > latest)) {
        latest = ts;
      }
    }
  }

  return latest;
}

/**
 * Returns true if an active queue has had no activity for more than 60 minutes.
 */
export function isQueueInactiveForPause(
  queue: ActivityQueueLike | null | undefined,
  visitors: ActivityVisitorLike[] = [],
  nowMs: number = Date.now(),
  thresholdMs: number = INACTIVITY_PAUSE_MS
): boolean {
  if (!queue || queue.status !== "active") return false;
  const lastMs = getLastQueueActivityMs(queue, visitors);
  if (lastMs === null) return false;
  return nowMs - lastMs > thresholdMs;
}

/**
 * Average wait data should be cancelled whenever a queue is paused, closed,
 * or has been inactive for more than 60 minutes.
 */
export function shouldCancelAvgWait(
  queue: ActivityQueueLike | null | undefined,
  visitors: ActivityVisitorLike[] = [],
  nowMs: number = Date.now(),
  thresholdMs: number = INACTIVITY_PAUSE_MS
): boolean {
  if (!queue) return false;
  if (queue.status === "paused" || queue.status === "closed") return true;
  return isQueueInactiveForPause(queue, visitors, nowMs, thresholdMs);
}

/**
 * Voids visitor records that occurred before any >60-minute inactivity gap,
 * returning only rows belonging to the current active session.
 */
export function filterRowsAfterInactivityGap<T extends ActivityVisitorLike>(
  rows: T[],
  queue?: ActivityQueueLike | null,
  nowMs: number = Date.now(),
  thresholdMs: number = INACTIVITY_PAUSE_MS
): T[] {
  if (!rows.length) return [];
  if (shouldCancelAvgWait(queue, rows, nowMs, thresholdMs)) return [];

  const withTime = rows
    .map((row) => {
      const ts =
        parseTimestampMs(row.served_at) ??
        parseTimestampMs(row.called_at) ??
        parseTimestampMs(row.joined_at) ??
        0;
      return { row, ts };
    })
    .sort((a, b) => b.ts - a.ts);

  // If even the newest row is older than thresholdMs (e.g., queue reactivated on QR scan),
  // void all previous pre-inactivity rows.
  if (withTime[0].ts > 0 && nowMs - withTime[0].ts > thresholdMs) {
    return [];
  }

  const kept: T[] = [withTime[0].row];
  for (let i = 1; i < withTime.length; i++) {
    const newerTs = withTime[i - 1].ts;
    const olderTs = withTime[i].ts;
    if (newerTs > 0 && olderTs > 0 && newerTs - olderTs > thresholdMs) {
      break;
    }
    kept.push(withTime[i].row);
  }
  return kept;
}

/**
 * Computes average wait time in minutes for served visitors, excluding stale
 * wait durations that exceed the inactivity threshold (default 60 minutes).
 */
export function computeActiveAvgWaitMinutes(
  rows: ActivityVisitorLike[],
  maxWaitMinutes: number = DEFAULT_INACTIVITY_MINUTES
): number {
  const waits = getActiveWaitMinutes(rows, maxWaitMinutes);
  return waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
}

/**
 * Returns individual wait durations (in minutes) for served visitors,
 * excluding negative values and durations exceeding maxWaitMinutes (inactive time).
 */
export function getActiveWaitMinutes(
  rows: ActivityVisitorLike[],
  maxWaitMinutes: number = DEFAULT_INACTIVITY_MINUTES
): number[] {
  return rows
    .filter((v) => v.status === "served" && v.served_at && v.joined_at)
    .map((v) => {
      const joined = parseTimestampMs(v.joined_at);
      const served = parseTimestampMs(v.served_at);
      if (joined === null || served === null) return NaN;
      return (served - joined) / 60000;
    })
    .filter((mins) => Number.isFinite(mins) && mins >= 0 && mins <= maxWaitMinutes);
}
