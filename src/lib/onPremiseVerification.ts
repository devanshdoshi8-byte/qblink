import { supabase } from "@/integrations/supabase/client";

export interface OnPremiseConfig {
  enabled: boolean;
  radius_meters: number;
  latitude: number | null;
  longitude: number | null;
  counter_code: string | null;
  counter_code_updated_at?: string | null;
}

export const DEFAULT_RADIUS_METERS = 250;

/** Calculate straight-line distance in meters using the Haversine formula */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export type LocationResult =
  | { ok: true; coords: { latitude: number; longitude: number; accuracy: number } }
  | {
      ok: false;
      error: "denied" | "timeout" | "unavailable" | "unsupported" | "inaccurate";
      message: string;
    };

/** Request a single one-time location snapshot with a strict timeout */
export function getLocationSnapshot(
  options: { timeoutMs?: number; highAccuracy?: boolean; maxAcceptableAccuracyMeters?: number } = {}
): Promise<LocationResult> {
  const { timeoutMs = 8000, highAccuracy = true, maxAcceptableAccuracyMeters = 500 } = options;

  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve({
      ok: false,
      error: "unsupported",
      message: "Location is not supported on this device/browser.",
    });
  }

  return new Promise((resolve) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve({
          ok: false,
          error: "timeout",
          message: "Location check took too long. Please use the counter code.",
        });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        const { latitude, longitude, accuracy } = pos.coords;

        // If GPS accuracy is worse than allowable threshold (e.g. coarse cell-tower estimate)
        if (accuracy > maxAcceptableAccuracyMeters) {
          resolve({
            ok: false,
            error: "inaccurate",
            message: `Location accuracy is too low (±${Math.round(accuracy)}m). Please enter the counter code.`,
          });
          return;
        }

        resolve({
          ok: true,
          coords: { latitude, longitude, accuracy },
        });
      },
      (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        let errorType: "denied" | "timeout" | "unavailable" = "unavailable";
        let msg = "Location unavailable. Please use the counter code.";

        if (err.code === err.PERMISSION_DENIED) {
          errorType = "denied";
          msg = "Location permission denied. Please enter the counter code displayed at reception.";
        } else if (err.code === err.TIMEOUT) {
          errorType = "timeout";
          msg = "Location request timed out. Please enter the counter code.";
        }

        resolve({
          ok: false,
          error: errorType,
          message: msg,
        });
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 30000, // 30s cache acceptable for instant check
      }
    );
  });
}

/** Generate a clean random 4-digit numeric code */
export function generateCounterCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const STORAGE_KEY_CODE_ATTEMPTS = "qb_counter_code_failures";
const MAX_FAILED_ATTEMPTS = 4;
const ATTEMPT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

/** Check if counter code entry is currently rate-limited due to repeated wrong entries */
export function getCounterCodeRateLimitStatus(): {
  isBlocked: boolean;
  remainingSeconds: number;
} {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CODE_ATTEMPTS);
    if (!raw) return { isBlocked: false, remainingSeconds: 0 };
    const data = JSON.parse(raw);
    if (data.count >= MAX_FAILED_ATTEMPTS) {
      const elapsed = Date.now() - data.lastFailedAt;
      if (elapsed < ATTEMPT_COOLDOWN_MS) {
        return {
          isBlocked: true,
          remainingSeconds: Math.ceil((ATTEMPT_COOLDOWN_MS - elapsed) / 1000),
        };
      } else {
        sessionStorage.removeItem(STORAGE_KEY_CODE_ATTEMPTS);
      }
    }
  } catch {}
  return { isBlocked: false, remainingSeconds: 0 };
}

/** Record an invalid counter code attempt */
export function recordFailedCounterCodeAttempt(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CODE_ATTEMPTS);
    const data = raw ? JSON.parse(raw) : { count: 0, lastFailedAt: Date.now() };
    data.count += 1;
    data.lastFailedAt = Date.now();
    sessionStorage.setItem(STORAGE_KEY_CODE_ATTEMPTS, JSON.stringify(data));
  } catch {}
}

/** Clear failed counter code attempts on success */
export function clearCounterCodeAttempts(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_CODE_ATTEMPTS);
  } catch {}
}

export interface VerificationResponse {
  allowed: boolean;
  reason?: string;
  verified_by?: "counter_code" | "geofence" | "remote_allowed";
  distance_meters?: number;
  radius_meters?: number;
  message?: string;
}

/**
 * Validate on-premise entry using server RPC (or client-side calculation fallback)
 * Never stores or retains client GPS coordinates in the database.
 */
export async function verifyOnPremiseEntry(params: {
  queueId: string;
  latitude?: number | null;
  longitude?: number | null;
  counterCode?: string | null;
  clientFallbackConfig?: OnPremiseConfig | null;
  remoteJoiningEnabled?: boolean;
}): Promise<VerificationResponse> {
  const { queueId, latitude, longitude, counterCode, clientFallbackConfig, remoteJoiningEnabled } = params;

  // If remote joining is ON, always bypass
  if (remoteJoiningEnabled) {
    return { allowed: true, reason: "remote_allowed", verified_by: "remote_allowed" };
  }

  // 1. Try server RPC verification first
  try {
    const { data, error } = await supabase.rpc("verify_on_premise_entry" as any, {
      p_queue_id: queueId,
      p_latitude: latitude ?? null,
      p_longitude: longitude ?? null,
      p_counter_code: counterCode?.trim() || null,
    });

    if (!error && data) {
      const resp = data as VerificationResponse;
      if (resp.verified_by === "counter_code") {
        clearCounterCodeAttempts();
      } else if (resp.reason === "invalid_counter_code") {
        recordFailedCounterCodeAttempt();
      }
      return resp;
    }
  } catch (err) {
    console.warn("Server on-premise RPC verification unavailable, checking fallback:", err);
  }

  // 2. Client-side math fallback if RPC is pending or offline
  if (clientFallbackConfig && clientFallbackConfig.enabled) {
    // If Counter Code provided
    if (counterCode && counterCode.trim()) {
      const target = (clientFallbackConfig.counter_code || "").trim().toLowerCase();
      const entered = counterCode.trim().toLowerCase();
      if (target && entered === target) {
        clearCounterCodeAttempts();
        return { allowed: true, verified_by: "counter_code" };
      } else {
        recordFailedCounterCodeAttempt();
        return {
          allowed: false,
          reason: "invalid_counter_code",
          message: "Incorrect counter code. Please check the screen at reception.",
        };
      }
    }

    // If GPS coordinates provided
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      typeof clientFallbackConfig.latitude === "number" &&
      typeof clientFallbackConfig.longitude === "number"
    ) {
      const dist = haversineDistanceMeters(
        latitude,
        longitude,
        clientFallbackConfig.latitude,
        clientFallbackConfig.longitude
      );
      const radius = clientFallbackConfig.radius_meters || DEFAULT_RADIUS_METERS;

      if (dist <= radius) {
        return { allowed: true, verified_by: "geofence", distance_meters: dist, radius_meters: radius };
      } else {
        return {
          allowed: false,
          reason: "outside_radius",
          distance_meters: dist,
          radius_meters: radius,
          message: `You appear to be ${dist}m away (allowed: ${radius}m). If you are inside, please enter the counter code.`,
        };
      }
    }

    return { allowed: false, reason: "verification_required", message: "On-site verification required." };
  }

  // If no on-premise config, treat as remote disabled
  return { allowed: false, reason: "remote_disabled", message: "Remote joining is currently disabled." };
}
