import { supabase } from "@/integrations/supabase/client";

export type SmsEventType = "TOKEN_ISSUED" | "TURN_NEAR" | "NOW_SERVING" | "TEST";

export interface SendSmsParams {
  businessId: string;
  tokenId?: string;
  phone: string;
  eventType: SmsEventType;
  clinicName?: string;
  tokenNumber?: number;
  etaMinutes?: number;
}

export interface SendSmsResponse {
  success: boolean;
  status?: "sent" | "simulated" | "deduplicated" | "rate_limited" | "failed";
  provider?: string;
  phoneMasked?: string;
  message?: string;
  reason?: string;
}

/**
 * Fires an SMS dispatch non-blockingly in the background.
 * Any network failures or API key issues are safely swallowed and logged
 * so they NEVER block queuing, calling, or serving a patient.
 */
export function sendQueueSmsNonBlocking(params: SendSmsParams): void {
  try {
    if (!params.phone || !params.businessId) return;
    supabase.functions
      .invoke("send-queue-sms", { body: params })
      .then(({ data, error }) => {
        if (error) {
          console.warn("[Qblink SMS] Background dispatch warning:", error);
        } else if (data?.status === "simulated") {
          console.info("[Qblink SMS] Simulated SMS recorded in dry_run mode:", data.phoneMasked);
        }
      })
      .catch((err) => {
        console.warn("[Qblink SMS] Non-blocking dispatch caught exception:", err);
      });
  } catch (err) {
    console.warn("[Qblink SMS] Trigger caught exception:", err);
  }
}

/**
 * Explicit test SMS caller used by clinic onboarding in Settings.
 */
export async function sendTestSms(businessId: string, phone: string, clinicName: string): Promise<SendSmsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("send-queue-sms", {
      body: {
        businessId,
        phone,
        eventType: "TEST",
        clinicName,
      },
    });

    if (error) {
      return { success: false, reason: error.message || "Failed to trigger Edge Function" };
    }
    return data as SendSmsResponse;
  } catch (err: any) {
    return { success: false, reason: err?.message || "Network error" };
  }
}
