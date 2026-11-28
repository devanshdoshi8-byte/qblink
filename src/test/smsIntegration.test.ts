import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendQueueSmsNonBlocking, sendTestSms } from "@/lib/sms";
import { supabase } from "@/integrations/supabase/client";

// Normalize helper test matching edge function implementation
function normalizeIndianPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 5) return clean;
  const last4 = clean.slice(-4);
  return `+91 ••••• •${last4}`;
}

describe("India SMS Integration & Formatting", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes valid 10-digit Indian mobile numbers", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone(" 98765-43210 ")).toBe("+919876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
  });

  it("rejects invalid phone numbers safely without throwing", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("4567891234")).toBeNull(); // starts with 4
    expect(normalizeIndianPhone("")).toBeNull();
    expect(normalizeIndianPhone("abcdefghij")).toBeNull();
  });

  it("masks Indian phone numbers for DPDP compliance and audit logs", () => {
    expect(maskPhone("+919876543210")).toBe("+91 ••••• •3210");
    expect(maskPhone("9876543210")).toBe("+91 ••••• •3210");
  });

  it("sendQueueSmsNonBlocking safely catches and ignores errors without throwing", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network timeout"));
    vi.stubGlobal("fetch", fetchMock);

    try {
      expect(() => {
        sendQueueSmsNonBlocking({
          businessId: "biz-123",
          tokenId: "tok-456",
          phone: "9876543210",
          eventType: "TOKEN_ISSUED",
          clinicName: "Sterling Care Clinic",
        });
      }).not.toThrow();

      await new Promise((r) => setTimeout(r, 30));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("sendTestSms invokes edge function and returns result payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          status: "simulated",
          provider: "dry_run",
          phoneMasked: "+91 ••••• •3210",
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const res = await sendTestSms("biz-123", "9876543210", "Sterling Care Clinic");
      expect(res.success).toBe(true);
      expect(res.status).toBe("simulated");
      expect(res.provider).toBe("dry_run");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/send-queue-sms"),
        expect.objectContaining({ method: "POST" })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
