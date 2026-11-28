import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  businessId: string;
  tokenId?: string;
  phone: string;
  eventType: "TOKEN_ISSUED" | "TURN_NEAR" | "NOW_SERVING" | "TEST";
  clinicName?: string;
  tokenNumber?: number;
  etaMinutes?: number;
}

/**
 * Normalizes Indian phone numbers to +91XXXXXXXXXX format.
 * Returns null if the number is not a valid 10-digit Indian mobile number.
 */
function normalizeIndianPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // E.g. 9876543210 (10 digits)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  // E.g. 09876543210 (11 digits with leading 0)
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }
  // E.g. 919876543210 (12 digits with leading 91)
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 5) return clean;
  const last4 = clean.slice(-4);
  return `+91 ••••• •${last4}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, reason: "Missing Authorization Bearer token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller) {
      return new Response(
        JSON.stringify({ success: false, reason: "Invalid or expired session token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body = (await req.json()) as SendSmsRequest;
    const { businessId, tokenId, phone, eventType, clinicName, tokenNumber, etaMinutes } = body;

    if (!businessId || !phone || !eventType) {
      return new Response(
        JSON.stringify({ success: false, reason: "Missing required fields (businessId, phone, eventType)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify caller owns the business or is an admin
    const { data: bizRow } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .maybeSingle();

    if (!bizRow) {
      return new Response(
        JSON.stringify({ success: false, reason: "Business not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (bizRow.owner_id !== caller.id) {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!adminRole) {
        return new Response(
          JSON.stringify({ success: false, reason: "Forbidden: caller does not own this business" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    // 1. Normalize Indian Phone Number
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, reason: "Invalid Indian mobile phone number (must be 10 digits)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const maskedPhone = maskPhone(normalizedPhone);
    const orgName = clinicName?.trim() || "Qblink Clinic";
    const tokenDisplay = tokenNumber ? `#${tokenNumber}` : "Token";

    // 2. Deduplication check (never send the same event twice for a token)
    if (tokenId && eventType !== "TEST") {
      const { data: existing } = await supabase
        .from("sms_logs")
        .select("id, status")
        .eq("token_id", tokenId)
        .eq("event_type", eventType)
        .in("status", ["sent", "simulated"])
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            status: "deduplicated",
            message: `SMS for event ${eventType} already sent to token ${tokenId}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // 3. Enforce per-business daily safety cap (default 200)
    const dailyCap = parseInt(Deno.env.get("DAILY_SMS_CAP") || "200", 10);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const { count: dailyCount } = await supabase
      .from("sms_logs")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", todayMidnight.toISOString())
      .in("status", ["sent", "simulated"]);

    if ((dailyCount || 0) >= dailyCap) {
      await supabase.from("sms_logs").insert({
        business_id: businessId,
        token_id: tokenId || null,
        phone_masked: maskedPhone,
        event_type: eventType,
        provider: "rate_limited",
        status: "rate_limited",
        payload: { phone: maskedPhone, eventType, tokenDisplay },
        error: `Daily SMS limit of ${dailyCap} reached for this business`,
      });

      return new Response(
        JSON.stringify({
          success: false,
          status: "rate_limited",
          reason: `Daily SMS limit of ${dailyCap} messages reached.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 4. Construct SMS message copy (DLT compliant)
    let messageText = "";
    if (eventType === "TOKEN_ISSUED") {
      messageText = `Your token for ${orgName} is ${tokenDisplay}.${etaMinutes ? ` Est wait: ~${etaMinutes} mins.` : ""} Track live on Qblink: zero app needed.`;
    } else if (eventType === "TURN_NEAR") {
      messageText = `Turn Alert: Your turn is approaching for ${orgName} (${tokenDisplay}). Please be near the waiting area.`;
    } else if (eventType === "NOW_SERVING") {
      messageText = `Now Serving: ${orgName} is now calling ${tokenDisplay}. Please proceed to the room/counter.`;
    } else {
      messageText = `Test SMS from Qblink: Notifications are active for ${orgName}.`;
    }

    // 5. Provider selection & dispatch
    const envProvider = (Deno.env.get("SMS_PROVIDER") || "dry_run").toLowerCase();
    const msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY");
    const fast2smsApiKey = Deno.env.get("FAST2SMS_API_KEY");

    let providerUsed = "dry_run";
    let sendStatus = "simulated";
    let providerError: string | null = null;

    if (envProvider === "msg91" && msg91AuthKey) {
      providerUsed = "msg91";
      try {
        const templateId = eventType === "TOKEN_ISSUED"
          ? (Deno.env.get("MSG91_TEMPLATE_ID_JOIN") || "")
          : (Deno.env.get("MSG91_TEMPLATE_ID_TURN") || "");

        const rawPhone10 = normalizedPhone.replace(/^\+91/, "");
        const res = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authkey": msg91AuthKey,
          },
          body: JSON.stringify({
            template_id: templateId,
            sender: Deno.env.get("MSG91_SENDER_ID") || "QBLINK",
            short_url: "0",
            recipients: [
              {
                mobiles: `91${rawPhone10}`,
                clinic_name: orgName,
                token_num: tokenDisplay,
                eta_mins: etaMinutes ? String(etaMinutes) : "5",
              },
            ],
          }),
        });

        if (res.ok) {
          sendStatus = "sent";
        } else {
          providerError = `MSG91 status ${res.status}: ${await res.text()}`;
          sendStatus = "failed";
        }
      } catch (err: unknown) {
        providerError = err instanceof Error ? err.message : String(err);
        sendStatus = "failed";
      }
    } else if (envProvider === "fast2sms" && fast2smsApiKey) {
      providerUsed = "fast2sms";
      try {
        const rawPhone10 = normalizedPhone.replace(/^\+91/, "");
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authorization": fast2smsApiKey,
          },
          body: JSON.stringify({
            route: "q",
            message: messageText,
            language: "english",
            flash: 0,
            numbers: rawPhone10,
          }),
        });

        if (res.ok) {
          sendStatus = "sent";
        } else {
          providerError = `Fast2SMS status ${res.status}: ${await res.text()}`;
          sendStatus = "failed";
        }
      } catch (err: unknown) {
        providerError = err instanceof Error ? err.message : String(err);
        sendStatus = "failed";
      }
    } else {
      // Default: dry_run simulation (grant-safe, demo-ready, 0 cost)
      providerUsed = "dry_run";
      sendStatus = "simulated";
    }

    // 6. Record in audit log
    await supabase.from("sms_logs").insert({
      business_id: businessId,
      token_id: tokenId || null,
      phone_masked: maskedPhone,
      event_type: eventType,
      provider: providerUsed,
      status: sendStatus,
      payload: {
        to: maskedPhone,
        eventType,
        token: tokenDisplay,
        message: messageText,
      },
      error: providerError,
    });

    return new Response(
      JSON.stringify({
        success: sendStatus === "sent" || sendStatus === "simulated",
        status: sendStatus,
        provider: providerUsed,
        phoneMasked: maskedPhone,
        message: messageText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ success: false, reason: error instanceof Error ? error.message : "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
