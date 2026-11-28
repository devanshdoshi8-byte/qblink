export interface DailyResetConfig {
  enabled: boolean;
  time: string; // "00:00" (24h format)
  timezone: string; // IANA timezone, e.g. "Asia/Kolkata"
  only_if_active?: boolean;
}

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST)", offset: "UTC+5:30", region: "India" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)", offset: "UTC+4:00", region: "Middle East" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)", offset: "UTC+8:00", region: "Asia Pacific" },
  { value: "Asia/Bangkok", label: "Indochina Time (ICT)", offset: "UTC+7:00", region: "Asia Pacific" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)", offset: "UTC+9:00", region: "Asia Pacific" },
  { value: "Europe/London", label: "Greenwich / British Time (GMT/BST)", offset: "UTC+0/1", region: "Europe" },
  { value: "Europe/Paris", label: "Central European Time (CET/CEST)", offset: "UTC+1/2", region: "Europe" },
  { value: "America/New_York", label: "US Eastern Time (EST/EDT)", offset: "UTC-5/4", region: "Americas" },
  { value: "America/Chicago", label: "US Central Time (CST/CDT)", offset: "UTC-6/5", region: "Americas" },
  { value: "America/Denver", label: "US Mountain Time (MST/MDT)", offset: "UTC-7/6", region: "Americas" },
  { value: "America/Los_Angeles", label: "US Pacific Time (PST/PDT)", offset: "UTC-8/7", region: "Americas" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST/AEDT)", offset: "UTC+10/11", region: "Oceania" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)", offset: "UTC+0:00", region: "Global" },
];

export const RESET_TIME_PRESETS = [
  { value: "00:00", label: "12:00 AM (Midnight) — Default for next-day queues" },
  { value: "23:00", label: "11:00 PM — End of evening" },
  { value: "23:30", label: "11:30 PM — Late evening" },
  { value: "01:00", label: "1:00 AM — Late night" },
  { value: "02:00", label: "2:00 AM — Post midnight" },
  { value: "03:00", label: "3:00 AM — Late cafes / nightlife" },
  { value: "04:00", label: "4:00 AM — Early morning before opening" },
];

export const defaultDailyResetConfig = (): DailyResetConfig => {
  let detectedTz = "Asia/Kolkata";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === "string") detectedTz = tz;
  } catch {
    // Keep fallback
  }

  return {
    enabled: true,
    time: "00:00",
    timezone: detectedTz,
    only_if_active: true,
  };
};

export const normalizeDailyResetConfig = (raw: unknown): DailyResetConfig => {
  const defaults = defaultDailyResetConfig();
  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Record<string, unknown>;
  const rawDaily = (obj.daily_reset && typeof obj.daily_reset === "object" ? obj.daily_reset : obj) as Record<string, unknown>;

  const enabled = typeof rawDaily.enabled === "boolean" ? rawDaily.enabled : defaults.enabled;
  const time = typeof rawDaily.time === "string" && /^\d{2}:\d{2}$/.test(rawDaily.time) ? rawDaily.time : defaults.time;
  const timezone = typeof rawDaily.timezone === "string" && rawDaily.timezone.trim() ? rawDaily.timezone.trim() : defaults.timezone;
  const only_if_active = typeof rawDaily.only_if_active === "boolean" ? rawDaily.only_if_active : defaults.only_if_active;

  return { enabled, time, timezone, only_if_active };
};

export const formatResetTimeLabel = (timeStr: string): string => {
  const [hStr, mStr] = (timeStr || "00:00").split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh}:00 ${suffix}` : `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatTimezoneShort = (tz: string): string => {
  const match = POPULAR_TIMEZONES.find(t => t.value === tz);
  if (match) return `${tz.split("/").pop()?.replace(/_/g, " ")} (${match.offset})`;
  return tz.split("/").pop()?.replace(/_/g, " ") || tz;
};

/**
 * Checks if a queue is overdue for daily reset based on last_reset_at, timezone and target time.
 */
export const isQueueDueForReset = (
  lastResetAt: string | null | undefined,
  config: DailyResetConfig,
  now: Date = new Date()
): boolean => {
  if (!config.enabled) return false;
  if (!lastResetAt) return true;

  const lastReset = new Date(lastResetAt);
  if (!Number.isFinite(lastReset.getTime())) return true;

  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const partsNow = dtf.formatToParts(now);
    const partsLast = dtf.formatToParts(lastReset);

    const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
      parseInt(parts.find(p => p.type === type)?.value || "0", 10);

    const yNow = getPart(partsNow, "year");
    const mNow = getPart(partsNow, "month");
    const dNow = getPart(partsNow, "day");
    const hrNow = getPart(partsNow, "hour");
    const minNow = getPart(partsNow, "minute");

    const yLast = getPart(partsLast, "year");
    const mLast = getPart(partsLast, "month");
    const dLast = getPart(partsLast, "day");

    const [tHourStr, tMinStr] = (config.time || "00:00").split(":");
    const tHour = parseInt(tHourStr, 10) || 0;
    const tMin = parseInt(tMinStr, 10) || 0;

    const dateNowVal = yNow * 10000 + mNow * 100 + dNow;
    const dateLastVal = yLast * 10000 + mLast * 100 + dLast;

    // If day has changed
    if (dateNowVal > dateLastVal) {
      // If current time is past the target reset time
      if (hrNow > tHour || (hrNow === tHour && minNow >= tMin)) {
        return true;
      }
      // If last reset was more than 1 day ago (e.g. 2 days ago), reset anyway
      if (dateNowVal - dateLastVal >= 2) {
        return true;
      }
    }

    return false;
  } catch {
    // If timezone parsing fails, fallback to 24h delta check
    return now.getTime() - lastReset.getTime() >= 24 * 60 * 60 * 1000;
  }
};
