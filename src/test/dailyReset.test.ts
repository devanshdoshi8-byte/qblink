import { describe, it, expect } from "vitest";
import {
  defaultDailyResetConfig,
  normalizeDailyResetConfig,
  formatResetTimeLabel,
  formatTimezoneShort,
  isQueueDueForReset,
  POPULAR_TIMEZONES,
  RESET_TIME_PRESETS,
} from "@/lib/dailyReset";

describe("Daily Queue Reset configuration & helpers", () => {
  it("provides sensible defaults", () => {
    const def = defaultDailyResetConfig();
    expect(def.enabled).toBe(true);
    expect(def.time).toBe("00:00");
    expect(typeof def.timezone).toBe("string");
    expect(def.only_if_active).toBe(true);
  });

  it("normalizes missing or malformed settings safely", () => {
    expect(normalizeDailyResetConfig(null)).toEqual(expect.objectContaining({ enabled: true, time: "00:00" }));
    expect(normalizeDailyResetConfig({})).toEqual(expect.objectContaining({ enabled: true, time: "00:00" }));
    expect(normalizeDailyResetConfig({ daily_reset: { enabled: false, time: "03:00", timezone: "America/New_York" } })).toEqual({
      enabled: false,
      time: "03:00",
      timezone: "America/New_York",
      only_if_active: true,
    });
    // Rejects invalid time format and falls back
    expect(normalizeDailyResetConfig({ daily_reset: { time: "invalid-time" } }).time).toBe("00:00");
  });

  it("formats 24-hour time strings into business-friendly 12-hour labels", () => {
    expect(formatResetTimeLabel("00:00")).toBe("12:00 AM");
    expect(formatResetTimeLabel("01:30")).toBe("1:30 AM");
    expect(formatResetTimeLabel("12:00")).toBe("12:00 PM");
    expect(formatResetTimeLabel("23:00")).toBe("11:00 PM");
    expect(formatResetTimeLabel("23:45")).toBe("11:45 PM");
  });

  it("formats timezone names with friendly offsets", () => {
    expect(formatTimezoneShort("Asia/Kolkata")).toContain("Kolkata");
    expect(formatTimezoneShort("Asia/Kolkata")).toContain("UTC+5:30");
    expect(formatTimezoneShort("America/New_York")).toContain("New York");
    expect(formatTimezoneShort("Europe/London")).toContain("London");
  });

  it("includes popular business timezones and reset presets", () => {
    expect(POPULAR_TIMEZONES.length).toBeGreaterThanOrEqual(10);
    expect(RESET_TIME_PRESETS.some(p => p.value === "00:00")).toBe(true);
  });

  describe("isQueueDueForReset trigger logic", () => {
    it("returns false if auto-reset is disabled", () => {
      const config = { enabled: false, time: "00:00", timezone: "UTC" };
      expect(isQueueDueForReset("2026-11-01T00:00:00Z", config)).toBe(false);
    });

    it("returns true if queue has never been reset", () => {
      const config = { enabled: true, time: "00:00", timezone: "UTC" };
      expect(isQueueDueForReset(null, config)).toBe(true);
      expect(isQueueDueForReset(undefined, config)).toBe(true);
      expect(isQueueDueForReset("invalid-date", config)).toBe(true);
    });

    it("returns false if already reset today in the business timezone", () => {
      const config = { enabled: true, time: "00:00", timezone: "UTC" };
      const now = new Date("2026-11-18T14:00:00Z");
      // Last reset happened earlier today at 00:05 UTC
      const lastReset = "2026-11-18T00:05:00Z";
      expect(isQueueDueForReset(lastReset, config, now)).toBe(false);
    });

    it("returns true if last reset was yesterday and current time has passed scheduled time", () => {
      const config = { enabled: true, time: "00:00", timezone: "UTC" };
      const now = new Date("2026-11-18T02:00:00Z"); // 2 AM today
      const lastReset = "2026-11-17T00:05:00Z"; // Yesterday 00:05
      expect(isQueueDueForReset(lastReset, config, now)).toBe(true);
    });

    it("correctly evaluates across timezones (e.g. IST vs UTC)", () => {
      // At 2026-11-18 19:00:00 UTC, in Asia/Kolkata (UTC+5:30) it is 2026-11-19 00:30:00 AM (past midnight!)
      const config = { enabled: true, time: "00:00", timezone: "Asia/Kolkata" };
      const now = new Date("2026-11-18T19:00:00Z"); // 12:30 AM IST on Nov 19
      const lastReset = "2026-11-17T19:00:00Z"; // 12:30 AM IST on Nov 18
      expect(isQueueDueForReset(lastReset, config, now)).toBe(true);
    });
  });
});
