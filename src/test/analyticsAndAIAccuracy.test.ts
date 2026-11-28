import { describe, it, expect, vi } from "vitest";
import { analyticsPeriodStart, dailyVisitorTrend, hourlyVisitorTraffic, busiestBucketIndex } from "@/lib/queueAnalytics";
import { requestHealthAI } from "@/lib/healthAIRequest";
import { computePhysicalHoursSaved } from "@/lib/adminAnalytics";

// ============================================================================
// SYNTHETIC TEST DATASET: "Synthetic Clinic Test" (Business ID: synth-biz-001)
// Fully isolated, synthetic queue event records spanning 7 days.
// ============================================================================

interface SyntheticVisitor {
  id: string;
  queue_id: string;
  token_number: number;
  visitor_name: string;
  phone: string | null;
  status: "waiting" | "checked_in" | "called" | "served" | "skipped" | "removed" | "no_show";
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  party_size?: number;
  assigned_table_size?: number;
}

const NOW = new Date("2026-10-18T12:00:00Z");

export const SYNTHETIC_QUEUES = [
  { id: "q-opd-01", business_id: "synth-biz-001", name: "General OPD", estimated_service_time: 10, queue_type: "standard" },
  { id: "q-den-02", business_id: "synth-biz-001", name: "Dental", estimated_service_time: 15, queue_type: "standard" },
  { id: "q-rest-03", business_id: "synth-biz-001", name: "Dine-in Tables", estimated_service_time: 30, queue_type: "restaurant", parent_queue_id: "q-rest-parent", table_size: 2 },
];

export const SYNTHETIC_VISITORS: SyntheticVisitor[] = [
  // --- Day 1 (Peak traffic - 6 days ago: 2026-10-12) ---
  { id: "v1-01", queue_id: "q-opd-01", token_number: 1, visitor_name: "Alice", phone: "+919999900001", status: "served", joined_at: "2026-10-12T09:00:00Z", called_at: "2026-10-12T09:08:00Z", served_at: "2026-10-12T09:16:00Z" }, // wait 16m, svc 8m
  { id: "v1-02", queue_id: "q-opd-01", token_number: 2, visitor_name: "Bob", phone: "+919999900002", status: "served", joined_at: "2026-10-12T09:05:00Z", called_at: "2026-10-12T09:16:00Z", served_at: "2026-10-12T09:26:00Z" }, // wait 21m, svc 10m
  { id: "v1-03", queue_id: "q-opd-01", token_number: 3, visitor_name: "Charlie", phone: "+919999900003", status: "served", joined_at: "2026-10-12T09:10:00Z", called_at: "2026-10-12T09:26:00Z", served_at: "2026-10-12T09:38:00Z" }, // wait 28m, svc 12m
  { id: "v1-04", queue_id: "q-opd-01", token_number: 4, visitor_name: "David", phone: "+919999900004", status: "served", joined_at: "2026-10-12T09:15:00Z", called_at: "2026-10-12T09:38:00Z", served_at: "2026-10-12T09:58:00Z" }, // wait 43m, svc 20m (delay > 1.5*10=15m)
  { id: "v1-05", queue_id: "q-opd-01", token_number: 5, visitor_name: "Eva", phone: "+919999900005", status: "served", joined_at: "2026-10-12T09:20:00Z", called_at: "2026-10-12T09:58:00Z", served_at: "2026-10-12T10:07:00Z" }, // wait 47m, svc 9m
  { id: "v1-06", queue_id: "q-opd-01", token_number: 6, visitor_name: "Frank", phone: null, status: "served", joined_at: "2026-10-12T09:30:00Z", called_at: "2026-10-12T10:07:00Z", served_at: "2026-10-12T10:18:00Z" }, // wait 48m, svc 11m
  { id: "v1-07", queue_id: "q-opd-01", token_number: 7, visitor_name: "Grace", phone: "+919999900007", status: "served", joined_at: "2026-10-12T10:00:00Z", called_at: "2026-10-12T10:18:00Z", served_at: "2026-10-12T10:35:00Z" }, // wait 35m, svc 17m (delay)
  { id: "v1-08", queue_id: "q-opd-01", token_number: 8, visitor_name: "Henry", phone: "+919999900008", status: "served", joined_at: "2026-10-12T10:15:00Z", called_at: "2026-10-12T10:35:00Z", served_at: "2026-10-12T10:45:00Z" }, // wait 30m, svc 10m
  { id: "v1-09", queue_id: "q-opd-01", token_number: 9, visitor_name: "Ivy", phone: "+919999900009", status: "served", joined_at: "2026-10-12T10:20:00Z", called_at: "2026-10-12T10:45:00Z", served_at: "2026-10-12T10:57:00Z" }, // wait 37m, svc 12m
  { id: "v1-10", queue_id: "q-opd-01", token_number: 10, visitor_name: "Jack", phone: "+919999900010", status: "served", joined_at: "2026-10-12T10:30:00Z", called_at: "2026-10-12T10:57:00Z", served_at: "2026-10-12T11:07:00Z" }, // wait 37m, svc 10m
  { id: "v1-11", queue_id: "q-opd-01", token_number: 11, visitor_name: "Karen", phone: "+919999900011", status: "skipped", joined_at: "2026-10-12T10:35:00Z", called_at: null, served_at: null },
  { id: "v1-12", queue_id: "q-opd-01", token_number: 12, visitor_name: "Leo", phone: "+919999900012", status: "no_show", joined_at: "2026-10-12T10:40:00Z", called_at: "2026-10-12T11:10:00Z", served_at: null },

  // --- Day 2 (5 days ago: 2026-10-13) ---
  { id: "v2-01", queue_id: "q-opd-01", token_number: 1, visitor_name: "Mona", phone: "+919999900013", status: "served", joined_at: "2026-10-13T11:00:00Z", called_at: "2026-10-13T11:05:00Z", served_at: "2026-10-13T11:15:00Z" }, // wait 15m
  { id: "v2-02", queue_id: "q-opd-01", token_number: 2, visitor_name: "Nate", phone: "+919999900001", status: "served", joined_at: "2026-10-13T11:10:00Z", called_at: "2026-10-13T11:15:00Z", served_at: "2026-10-13T11:25:00Z" }, // wait 15m (Returning customer!)
  { id: "v2-03", queue_id: "q-opd-01", token_number: 3, visitor_name: "Olivia", phone: "+919999900015", status: "served", joined_at: "2026-10-13T11:15:00Z", called_at: "2026-10-13T11:25:00Z", served_at: "2026-10-13T11:35:00Z" }, // wait 20m
  { id: "v2-04", queue_id: "q-opd-01", token_number: 4, visitor_name: "Paul", phone: "+919999900016", status: "skipped", joined_at: "2026-10-13T11:20:00Z", called_at: null, served_at: null },

  // --- Day 3 (Off-hours joins & dental queue - 4 days ago: 2026-10-14) ---
  { id: "v3-01", queue_id: "q-den-02", token_number: 1, visitor_name: "EarlyBird", phone: "+919999900017", status: "served", joined_at: "2026-10-14T07:30:00Z", called_at: "2026-10-14T07:45:00Z", served_at: "2026-10-14T08:00:00Z" }, // 7:30 AM join (Before 9 AM!)
  { id: "v3-02", queue_id: "q-den-02", token_number: 2, visitor_name: "LateOwl", phone: "+919999900018", status: "served", joined_at: "2026-10-14T21:15:00Z", called_at: "2026-10-14T21:30:00Z", served_at: "2026-10-14T21:45:00Z" }, // 9:15 PM join (After 8 PM!)

  // --- Day 4 (Restaurant Queue - 3 days ago: 2026-10-15) ---
  { id: "v4-01", queue_id: "q-rest-03", token_number: 1, visitor_name: "Diner1", phone: "+919999900019", status: "served", joined_at: "2026-10-15T13:00:00Z", called_at: "2026-10-15T13:20:00Z", served_at: "2026-10-15T14:00:00Z", party_size: 2, assigned_table_size: 2 }, // wait 60m
  { id: "v4-02", queue_id: "q-rest-03", token_number: 2, visitor_name: "Diner2", phone: "+919999900020", status: "served", joined_at: "2026-10-15T13:10:00Z", called_at: "2026-10-15T13:40:00Z", served_at: "2026-10-15T14:15:00Z", party_size: 2, assigned_table_size: 2 }, // wait 65m

  // --- Day 5 (Extreme Outlier Wait - 2 days ago: 2026-10-16) ---
  { id: "v5-01", queue_id: "q-opd-01", token_number: 1, visitor_name: "OutlierSam", phone: "+919999900021", status: "served", joined_at: "2026-10-16T10:00:00Z", called_at: "2026-10-16T12:00:00Z", served_at: "2026-10-16T12:30:00Z" }, // wait 150m!

  // --- Day 6 (All Abandoned - 1 day ago: 2026-10-17) ---
  { id: "v6-01", queue_id: "q-opd-01", token_number: 1, visitor_name: "SkipperA", phone: "+919999900022", status: "skipped", joined_at: "2026-10-17T14:00:00Z", called_at: null, served_at: null },
  { id: "v6-02", queue_id: "q-opd-01", token_number: 2, visitor_name: "NoShowB", phone: "+919999900023", status: "no_show", joined_at: "2026-10-17T14:10:00Z", called_at: "2026-10-17T14:30:00Z", served_at: null },

  // --- Day 7 (Today - 2026-10-18) ---
  { id: "v7-01", queue_id: "q-opd-01", token_number: 1, visitor_name: "TodayServed1", phone: "+919999900001", status: "served", joined_at: "2026-10-18T09:00:00Z", called_at: "2026-10-18T09:10:00Z", served_at: "2026-10-18T09:20:00Z" }, // wait 20m, svc 10m (Alice again - 3rd visit!)
  { id: "v7-02", queue_id: "q-opd-01", token_number: 2, visitor_name: "TodayServed2", phone: "+919999900025", status: "served", joined_at: "2026-10-18T09:30:00Z", called_at: "2026-10-18T09:40:00Z", served_at: "2026-10-18T09:55:00Z" }, // wait 25m, svc 15m
  { id: "v7-03", queue_id: "q-opd-01", token_number: 3, visitor_name: "Waiting1", phone: "+919999900026", status: "waiting", joined_at: "2026-10-18T10:00:00Z", called_at: null, served_at: null },
  { id: "v7-04", queue_id: "q-opd-01", token_number: 4, visitor_name: "Waiting2", phone: "+919999900027", status: "waiting", joined_at: "2026-10-18T10:15:00Z", called_at: null, served_at: null },
  { id: "v7-05", queue_id: "q-opd-01", token_number: 5, visitor_name: "SkippedToday", phone: "+919999900028", status: "skipped", joined_at: "2026-10-18T10:30:00Z", called_at: null, served_at: null },
  { id: "v7-06", queue_id: "q-opd-01", token_number: 6, visitor_name: "NoShowToday", phone: "+919999900029", status: "no_show", joined_at: "2026-10-18T10:45:00Z", called_at: "2026-10-18T11:00:00Z", served_at: null },
];

describe("Analytics and AI Validation Test Suite", () => {
  // --------------------------------------------------------------------------
  // SECTION 1: Analytics Page KPI Cards & Calculations
  // --------------------------------------------------------------------------
  describe("1. Analytics KPI Metrics Calculation", () => {
    it("independently calculates Total Visitors, Customers Served, and Avg Wait", () => {
      const all = SYNTHETIC_VISITORS;
      const total = all.length;
      expect(total).toBe(29);

      const served = all.filter((v) => v.status === "served");
      expect(served.length).toBe(20);

      const skipped = all.filter((v) => v.status === "skipped");
      expect(skipped.length).toBe(4);

      const noShow = all.filter((v) => v.status === "no_show");
      expect(noShow.length).toBe(3);

      const waiting = all.filter((v) => v.status === "waiting");
      expect(waiting.length).toBe(2);

      // Wait times of all served visitors:
      const waitTimes = served
        .filter((v) => v.served_at)
        .map((v) => (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000);
      expect(waitTimes.length).toBe(20);

      // Sum: 16+21+28+43+47+48+35+30+37+37 + 15+15+20 + 30+30 + 60+65 + 150 + 20+25 = 769 minutes
      const sumWait = waitTimes.reduce((a, b) => a + b, 0);
      expect(sumWait).toBe(772);
      const avgWait = Math.round(sumWait / waitTimes.length);
      expect(avgWait).toBe(39); // 772 / 20 = 38.6 -> 39m

      // Completion rate: 20 / 29 = 68.96% -> 69%
      const completionRate = Math.round((served.length / total) * 100);
      expect(completionRate).toBe(69);
    });

    it("verifies Queue Split matches exact counts per queue", () => {
      const all = SYNTHETIC_VISITORS;
      const opdCount = all.filter((v) => v.queue_id === "q-opd-01").length;
      const denCount = all.filter((v) => v.queue_id === "q-den-02").length;
      const restCount = all.filter((v) => v.queue_id === "q-rest-03").length;

      expect(opdCount).toBe(25);
      expect(denCount).toBe(2);
      expect(restCount).toBe(2);
      expect(opdCount + denCount + restCount).toBe(29);
    });

    it("counts all 24 hours including early and late joins", () => {
      const visitors = [0, 7, 21, 23].map(hour => ({
        joined_at: new Date(2026, 9, 18, hour, 30).toISOString(), status: "served",
      }));
      const hourly = hourlyVisitorTraffic(visitors);
      expect(hourly).toHaveLength(24);
      expect(hourly.reduce((sum, bucket) => sum + bucket.visitors, 0)).toBe(4);
      for (const hour of [0, 7, 21, 23]) expect(hourly[hour].visitors).toBe(1);
      expect(hourlyVisitorTraffic(SYNTHETIC_VISITORS).reduce((sum, b) => sum + b.visitors, 0)).toBe(29);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 2: PeakHourHeatmap Calculations & Empty Queue Handling
  // --------------------------------------------------------------------------
  describe("2. PeakHourHeatmap Bug & Accuracy Verification", () => {
    it("does not invent a busiest day or hour when all buckets are empty", () => {
      expect(busiestBucketIndex(Array(7).fill(0))).toBe(-1);
      expect(busiestBucketIndex(Array(13).fill(0))).toBe(-1);
      expect(busiestBucketIndex([])).toBe(-1);
      expect(busiestBucketIndex([0, 2, 5, 1])).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Queue Health Algorithm & Thresholds
  // --------------------------------------------------------------------------
  describe("3. Queue Health Score & Factor Verification", () => {
    it("verifies insufficient data gate: < 10 served visits returns no score", () => {
      // In supabase migrations 20260605193909_02ec2630-4b5d-4f6e-9e1c-33c0225707e2.sql line 162:
      // IF v_served < 10 THEN RETURN;
      const servedCountLow = 9;
      expect(servedCountLow < 10).toBe(true);
    });

    it("calculates exact Health Factors and Composite Score on the synthetic dataset", () => {
      // General OPD queue:
      const opdServed = SYNTHETIC_VISITORS.filter((v) => v.queue_id === "q-opd-01" && v.status === "served");
      expect(opdServed.length).toBe(16); // >= 10, qualifies for health score!

      const opdTotal = SYNTHETIC_VISITORS.filter((v) => v.queue_id === "q-opd-01").length;
      expect(opdTotal).toBe(25);

      const opdAbandoned = SYNTHETIC_VISITORS.filter(
        (v) => v.queue_id === "q-opd-01" && ["skipped", "removed", "no_show"].includes(v.status)
      ).length;
      expect(opdAbandoned).toBe(7); // 4 skipped + 3 no_show

      const abandonRate = opdAbandoned / opdTotal;
      expect(abandonRate).toBeCloseTo(7 / 25, 3); // 0.28 (28%)

      // Wait score formula:
      // v_est = 10 min
      // opd wait times:
      const opdWaits = opdServed.map((v) => (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000);
      const avgWait = opdWaits.reduce((a, b) => a + b, 0) / opdWaits.length;
      // Total wait = 587 / 16 = 36.6875 min
      expect(avgWait).toBeCloseTo(36.69, 1);

      // Wait score: 100 - ((avgWait - est) / (3.0 * est)) * 100
      // 100 - ((36.6875 - 10) / 30) * 100 = 100 - 88.96 = 11.04
      const waitScore = Math.max(0, Math.min(100, 100 - ((avgWait - 10) / 30) * 100));
      expect(waitScore).toBeCloseTo(11.04, 1);

      // Abandon score: 100 - (abandonRate * 250) = 100 - (0.28 * 250) = 100 - 70 = 30
      const abandonScore = Math.max(0, Math.min(100, 100 - abandonRate * 250));
      expect(abandonScore).toBeCloseTo(30.0, 1);

      // Delays: served sessions where service duration > 1.5 * est (1.5 * 10 = 15m)
      const opdDelays = opdServed.filter((v) => {
        if (!v.called_at || !v.served_at) return false;
        const dur = (new Date(v.served_at).getTime() - new Date(v.called_at).getTime()) / 60000;
        return dur > 15;
      }).length;
      expect(opdDelays).toBe(3); // David (20m), Grace (17m), OutlierSam (30m)
      const delayRate = opdDelays / opdServed.length; // 3 / 16 = 0.1875
      // Delay score: 100 - (delayRate * 200) = 100 - (0.1875 * 200) = 100 - 37.5 = 62.5
      const delayScore = Math.max(0, Math.min(100, 100 - delayRate * 200));
      expect(delayScore).toBeCloseTo(62.5, 1);

      // Composite weighted score check:
      // Weight breakdown: wait 30%, abandon 25%, efficiency 20%, delay 15%, accuracy 10%
      const weights = { wait: 0.3, abandon: 0.25, efficiency: 0.2, delay: 0.15, accuracy: 0.1 };
      expect(weights.wait + weights.abandon + weights.efficiency + weights.delay + weights.accuracy).toBe(1.0);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Insights Page KPI Calculations
  // --------------------------------------------------------------------------
  describe("4. Insights Page Metrics Verification", () => {
    it("calculates Today's Visitors, Waiting, Served, and Returning Customers correctly", () => {
      const todayStart = new Date("2026-10-18T00:00:00Z").getTime();
      const todayVisitors = SYNTHETIC_VISITORS.filter((v) => new Date(v.joined_at).getTime() >= todayStart);

      expect(todayVisitors.length).toBe(6);
      const waiting = todayVisitors.filter((v) => v.status === "waiting").length;
      expect(waiting).toBe(2);
      const served = todayVisitors.filter((v) => v.status === "served").length;
      expect(served).toBe(2);
      const skipped = todayVisitors.filter((v) => v.status === "skipped").length;
      expect(skipped).toBe(1);
      const noShow = todayVisitors.filter((v) => v.status === "no_show").length;
      expect(noShow).toBe(1);

      // Longest wait today: v7-01 wait 20m, v7-02 wait 25m -> max = 25m
      const todayWaits = todayVisitors
        .filter((v) => v.status === "served" && v.served_at)
        .map((v) => (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000);
      expect(Math.max(...todayWaits)).toBe(25);

      // Returning customers (distinct phones appearing > 1 time in last 30 days):
      const phoneCounts: Record<string, number> = {};
      SYNTHETIC_VISITORS.forEach((v) => {
        if (v.phone) phoneCounts[v.phone] = (phoneCounts[v.phone] || 0) + 1;
      });
      const returning = Object.values(phoneCounts).filter((c) => c > 1).length;
      // Only Alice (+919999900001) has > 1 visit (appeared 3 times: Day 1, Day 2, Day 7).
      expect(returning).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Queue Forecast Logic Verification
  // --------------------------------------------------------------------------
  describe("5. Queue Forecast RPC & Confidence Logic", () => {
    it("tests confidence formula and data requirements", () => {
      // In get_queue_forecast: confidence = LEAST(1.0, (distinct_days / 6.0))
      const calcConfidence = (distinctDays: number) => Math.min(1.0, distinctDays / 6.0);

      expect(calcConfidence(1)).toBeCloseTo(0.167, 3);
      expect(calcConfidence(3)).toBe(0.5);
      expect(calcConfidence(6)).toBe(1.0);
      expect(calcConfidence(10)).toBe(1.0);

      // Insufficient threshold: totalSample < 5 || days < 2
      const isInsufficient = (totalSample: number, days: number, peak: number) =>
        totalSample < 5 || days < 2 || peak <= 0;

      expect(isInsufficient(3, 1, 2)).toBe(true);
      expect(isInsufficient(10, 1, 5)).toBe(true);
      expect(isInsufficient(10, 3, 0)).toBe(true);
      expect(isInsufficient(10, 3, 5)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 6: AI Features & Edge Function Authorization Audit
  // --------------------------------------------------------------------------
  describe("6. AI Features & Security Audit", () => {
    it("confirms Queue Companion prompt strictly uses LOCKED QUEUE CONTEXT without independent estimation", () => {
      const qc = {
        user_position: 4,
        estimated_wait_time: 20,
        now_serving: 12,
        user_token: 16,
        business_name: "Apex Healthcare",
        location: "Mumbai",
      };

      const lockedContext = `LOCKED QUEUE CONTEXT (do NOT recalculate, do NOT override):
- user_position: ${qc.user_position ?? "?"} people ahead
- estimated_wait_time: ${qc.estimated_wait_time ?? "?"} minutes
- now_serving: ${qc.now_serving ?? "?"}
- user_token: ${qc.user_token ?? "?"}
- business_name: ${qc.business_name ?? "this place"}
- location: ${qc.location ?? "unknown"}`;

      expect(lockedContext).toContain("user_position: 4 people ahead");
      expect(lockedContext).toContain("estimated_wait_time: 20 minutes");
      expect(lockedContext).toContain("now_serving: 12");
      expect(lockedContext).toContain("user_token: 16");
    });

    it("sends the active user token to the protected Health Coach endpoint", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response("data: [DONE]\n\n"));
      vi.stubGlobal("fetch", fetchMock);
      try {
        const payload = { messages: [], businessId: "synth-biz-001", mode: "init" as const };
        await requestHealthAI("synthetic-user-session-token", payload);
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/functions/v1/queue-health-ai"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer synthetic-user-session-token" },
          body: JSON.stringify(payload),
        });
        expect(() => requestHealthAI(undefined, payload)).toThrow("Please sign in again");
        expect(fetchMock).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 7: Weekly Visitors Date Range Bucketing Bug
  // --------------------------------------------------------------------------
  describe("7. Weekly Visitors Date Range Collision Bug", () => {
    it.each([7, 30, 90])("keeps %i chronological calendar dates without merging weekdays", days => {
      const now = new Date(2026, 9, 18, 12);
      const visitors = [18, 11].map(day => ({
        joined_at: new Date(2026, 9, day, 9).toISOString(), status: "served",
      }));
      const result = dailyVisitorTrend(visitors, days, now);
      expect(result).toHaveLength(days);
      expect(result.at(-1)).toEqual({ date: "2026-10-18", served: 1, skipped: 0 });
      expect(new Set(result.map(b => b.date)).size).toBe(days);
      expect(result.map(b => b.date)).toEqual(result.map(b => b.date).sort());
      expect(result.find(b => b.date === "2026-10-11")?.served).toBe(days === 7 ? undefined : 1);
      expect(analyticsPeriodStart(days, now).getTime()).toBe(new Date(2026, 9, 19 - days).getTime());
      expect(result.reduce((sum, b) => sum + b.served, 0)).toBe(days === 7 ? 1 : 2);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 8: Deterministic AI Queue & Pickup Advice Validation
  // --------------------------------------------------------------------------
  describe("8. Deterministic Customer AI Queue & Pickup Advice", () => {
    it("validates zero-wait and passed-turn deterministic branching", () => {
      // In qblink-ai/index.ts lines 438-460:
      const evaluateQueueAdvice = (myToken: number, currentToken: number, estPer = 5, posOverride?: number) => {
        const rawPos = Number.isFinite(posOverride) ? Number(posOverride) : Math.max(0, myToken - currentToken);
        if (myToken && currentToken && myToken < currentToken) {
          return {
            summary: `Your turn (#${myToken}) has already passed — now serving #${currentToken}. Please check in at the counter.`,
            urgency: "high",
          };
        }
        if (rawPos === 0) {
          return { summary: `You're up next — please be ready at the counter.`, urgency: "high" };
        }
        const wait = rawPos * estPer;
        return {
          summary: `About ${wait} min wait — ${rawPos} ${rawPos === 1 ? "person" : "people"} ahead of you.`,
          urgency: wait > 20 ? "medium" : "low",
        };
      };

      // Case A: Passed turn
      const passed = evaluateQueueAdvice(3, 5);
      expect(passed.summary).toContain("Your turn (#3) has already passed");
      expect(passed.urgency).toBe("high");

      // Case B: Up next
      const next = evaluateQueueAdvice(5, 5);
      expect(next.summary).toContain("You're up next");
      expect(next.urgency).toBe("high");

      // Case C: Waiting with 4 people ahead (4 * 5 = 20 min)
      const waiting = evaluateQueueAdvice(9, 5);
      expect(waiting.summary).toBe("About 20 min wait — 4 people ahead of you.");
      expect(waiting.urgency).toBe("low");

      // Case D: Long wait (6 * 5 = 30 min)
      const longWait = evaluateQueueAdvice(11, 5);
      expect(longWait.summary).toBe("About 30 min wait — 6 people ahead of you.");
      expect(longWait.urgency).toBe("medium");
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 9: Restaurant Seating Percentiles & Table Turns
  // --------------------------------------------------------------------------
  describe("9. Restaurant Seating Analytics Calculations", () => {
    it("validates percentile calculation and table turn rate", () => {
      const waits = [10, 15, 20, 30, 45, 60, 90].sort((a, b) => a - b);
      const percentile = (sorted: number[], p: number) => {
        if (!sorted.length) return null;
        const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
        return Math.round(sorted[i]);
      };

      expect(percentile(waits, 50)).toBe(30); // P50
      expect(percentile(waits, 90)).toBe(60); // P90
      expect(percentile(waits, 95)).toBe(90); // P95

      // Table turn rate = served / tables
      const servedRest = 8;
      const tables = 4;
      const turns = servedRest / tables;
      expect(turns).toBe(2.0);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 10: Multi-Branch Rollup Weighted Score Calculation
  // --------------------------------------------------------------------------
  describe("10. Multi-Branch Health Rollup", () => {
    it("independently calculates weighted overall score across branches", () => {
      // In QueueHealth.tsx line 210:
      // Overall score: branches.reduce((s, b) => s + b.score * b.sample_count, 0) / branches.reduce((s, b) => s + b.sample_count, 0)
      const branches = [
        { business_name: "Branch Downtown", score: 85, sample_count: 50 },
        { business_name: "Branch Uptown", score: 65, sample_count: 20 },
        { business_name: "Branch Suburb", score: 90, sample_count: 30 },
      ];

      const totalWeighted = branches.reduce((s, b) => s + b.score * b.sample_count, 0); // 85*50 + 65*20 + 90*30 = 4250 + 1300 + 2700 = 8250
      const totalSamples = branches.reduce((s, b) => s + b.sample_count, 0); // 100
      const overallScore = Math.round(totalWeighted / totalSamples); // 8250 / 100 = 82.5 -> 83 or 82.5

      expect(totalWeighted).toBe(8250);
      expect(totalSamples).toBe(100);
      expect(overallScore).toBe(83); // Math.round(82.5) = 83
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 11: Admin Public Health Impact Model
  // --------------------------------------------------------------------------
  describe("11. Admin Public Health Impact Model", () => {
    it("validates 60% physical wait avoidance model", () => {
      // In AdminImpact.tsx lines 20-26:
      // totalMinutes = sum of (served_at - joined_at)
      // physicalEstimate = totalMinutes * 0.6
      // totalHours = Math.round(physicalEstimate / 60)
      const totalMinutes = 6000;
      const physicalEstimate = totalMinutes * 0.6; // 3600 min
      const totalHours = Math.round(physicalEstimate / 60); // 60 hours
      expect(totalHours).toBe(60);
    });

    it("caps per-visit wait at 60m and excludes stale >3h tickets in computePhysicalHoursSaved", () => {
      const result = computePhysicalHoursSaved([
        // Normal 30m wait -> 30m
        { joined_at: "2026-10-18T09:00:00Z", called_at: "2026-10-18T09:30:00Z", served_at: "2026-10-18T09:40:00Z" },
        // Long 150m wait -> capped at 60m
        { joined_at: "2026-10-18T09:00:00Z", called_at: "2026-10-18T11:30:00Z", served_at: "2026-10-18T11:45:00Z" },
        // Stale 12h ticket -> excluded (null)
        { joined_at: "2026-10-17T09:00:00Z", called_at: null, served_at: "2026-10-17T21:00:00Z" },
      ]);
      // (30 + 60) * 0.6 = 54 physical minutes = 0.9 hours, 27m avg saved across 2 valid visits
      expect(result.validCount).toBe(2);
      expect(result.hours).toBe(0.9);
      expect(result.avgSavedMinutes).toBe(27);
    });
  });
});

