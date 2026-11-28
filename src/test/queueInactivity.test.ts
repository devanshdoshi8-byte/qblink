import { describe, it, expect } from "vitest";
import {
  INACTIVITY_PAUSE_MS,
  computeActiveAvgWaitMinutes,
  getLastQueueActivityMs,
  isQueueInactiveForPause,
  shouldCancelAvgWait,
  filterRowsAfterInactivityGap,
} from "@/lib/queueInactivity";

describe("queueInactivity", () => {
  const now = new Date("2026-11-27T12:00:00.000Z").getTime();

  it("uses 60 minutes as the inactivity threshold", () => {
    expect(INACTIVITY_PAUSE_MS).toBe(60 * 60 * 1000);
  });

  it("finds latest activity across queue updated_at and visitor timestamps", () => {
    const queue = {
      status: "active",
      updated_at: "2026-11-27T10:30:00.000Z",
    };
    const visitors = [
      {
        status: "served",
        joined_at: "2026-11-27T10:40:00.000Z",
        served_at: "2026-11-27T11:10:00.000Z",
      },
    ];
    expect(getLastQueueActivityMs(queue, visitors)).toBe(
      new Date("2026-11-27T11:10:00.000Z").getTime()
    );
  });

  it("flags active queues inactive for more than 60 minutes", () => {
    const staleQueue = {
      status: "active",
      updated_at: new Date(now - 61 * 60 * 1000).toISOString(),
    };
    const freshQueue = {
      status: "active",
      updated_at: new Date(now - 45 * 60 * 1000).toISOString(),
    };
    expect(isQueueInactiveForPause(staleQueue, [], now)).toBe(true);
    expect(isQueueInactiveForPause(freshQueue, [], now)).toBe(false);
    expect(
      isQueueInactiveForPause({ ...staleQueue, status: "paused" }, [], now)
    ).toBe(false);
  });

  it("cancels avg wait calculation when paused, closed, or inactive > 60 mins", () => {
    expect(shouldCancelAvgWait({ status: "paused" }, [], now)).toBe(true);
    expect(shouldCancelAvgWait({ status: "closed" }, [], now)).toBe(true);
    expect(
      shouldCancelAvgWait(
        { status: "active", updated_at: new Date(now - 65 * 60 * 1000).toISOString() },
        [],
        now
      )
    ).toBe(true);
    expect(
      shouldCancelAvgWait(
        { status: "active", updated_at: new Date(now - 10 * 60 * 1000).toISOString() },
        [],
        now
      )
    ).toBe(false);
  });

  it("voids visitor data prior to a >60 min inactivity gap even after reactivation", () => {
    const queue = {
      status: "active",
      updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
    };
    const oldSessionRow = {
      id: "old",
      status: "served",
      joined_at: new Date(now - 150 * 60 * 1000).toISOString(),
      served_at: new Date(now - 120 * 60 * 1000).toISOString(),
    };
    const currentSessionRow = {
      id: "new",
      status: "served",
      joined_at: new Date(now - 10 * 60 * 1000).toISOString(),
      served_at: new Date(now - 2 * 60 * 1000).toISOString(),
    };

    const filtered = filterRowsAfterInactivityGap(
      [oldSessionRow, currentSessionRow],
      queue,
      now
    );
    expect(filtered).toEqual([currentSessionRow]);

    // If queue just reactivated and only old pre-inactivity rows exist, void all of them
    expect(filterRowsAfterInactivityGap([oldSessionRow], queue, now)).toEqual([]);
  });

  it("excludes inactive-span wait durations (>60m) from computeActiveAvgWaitMinutes", () => {
    const now = Date.now();
    const rows = [
      {
        status: "served",
        joined_at: new Date(now - 10 * 60 * 1000).toISOString(),
        served_at: new Date(now).toISOString(), // 10m
      },
      {
        status: "served",
        joined_at: new Date(now - 300 * 60 * 1000).toISOString(),
        served_at: new Date(now).toISOString(), // 300m (inactive span) -> excluded
      },
    ];
    expect(computeActiveAvgWaitMinutes(rows)).toBe(10);
  });
});
