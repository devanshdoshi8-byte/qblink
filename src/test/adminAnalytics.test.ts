import { describe, expect, it } from "vitest";
import {
  collectSupabaseErrors,
  computeWaitMinutes,
  medianWaitMinutes,
  normalizeCategoryName,
  visitorIdentityKey,
} from "@/lib/adminAnalytics";

describe("adminAnalytics helpers", () => {
  it("prefers called_at over served_at and caps stale >3h closes", () => {
    expect(
      computeWaitMinutes({
        joined_at: "2026-11-27T10:00:00.000Z",
        called_at: "2026-11-27T10:12:00.000Z",
        served_at: "2026-11-27T10:25:00.000Z",
      }),
    ).toBe(12);

    // Falls back to served_at if called_at is null
    expect(
      computeWaitMinutes({
        joined_at: "2026-11-27T10:00:00.000Z",
        called_at: null,
        served_at: "2026-11-27T10:15:00.000Z",
      }),
    ).toBe(15);

    // Rejects stale next-day cleanup (>180 min)
    expect(
      computeWaitMinutes({
        joined_at: "2026-11-26T10:00:00.000Z",
        called_at: null,
        served_at: "2026-11-27T08:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("computes median wait safely across mixed samples", () => {
    const samples = [
      { joined_at: "2026-11-27T10:00:00.000Z", called_at: "2026-11-27T10:05:00.000Z" },
      { joined_at: "2026-11-27T10:00:00.000Z", called_at: "2026-11-27T10:11:00.000Z" },
      { joined_at: "2026-11-27T10:00:00.000Z", called_at: "2026-11-27T11:30:00.000Z" },
      { joined_at: "2026-11-26T10:00:00.000Z", served_at: "2026-11-27T09:00:00.000Z" }, // excluded outlier
    ];
    expect(medianWaitMinutes(samples)).toBe(11);
    expect(medianWaitMinutes([])).toBe(0);
  });

  it("identifies unique visitors without collapsing generic guest labels", () => {
    expect(visitorIdentityKey({ customer_user_id: "uid-1", phone: "9999999999", visitor_name: "Guest" })).toBe("u:uid-1");
    expect(visitorIdentityKey({ phone: "+91 98765 43210", visitor_name: "Asha" })).toBe("p:9876543210");
    expect(visitorIdentityKey({ visitor_name: "Guest" })).toBeNull();
    expect(visitorIdentityKey({ visitor_name: "Asha Patel" })).toBe("n:asha patel");
  });

  it("collects supabase query errors cleanly and normalizes categories", () => {
    expect(normalizeCategoryName("  Clinic  ")).toBe("Clinic");
    expect(normalizeCategoryName("")).toBe("Other");
    expect(
      collectSupabaseErrors([
        { source: "businesses", error: null },
        { source: "queue_visitors", error: { message: "permission denied" } },
      ]),
    ).toEqual(["queue_visitors: permission denied"]);
  });
});
