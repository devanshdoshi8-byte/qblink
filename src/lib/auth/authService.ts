/**
 * Auth abstraction layer.
 *
 * One account may hold several roles (customer AND business), so signing up
 * as a business with an account that is already a customer simply adds the
 * business role instead of being blocked.
 */
import { supabase } from "@/integrations/supabase/client";
import { clearPending, getPending, setPending } from "./pendingAuth";
import { destinationFor } from "./roles";

export type AuthRole = "customer" | "business";
export type AuthIntent = AuthRole | "auto";

async function getRoles(userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
}

async function addRole(userId: string, role: AuthRole): Promise<void> {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  // 23505 = already has this role; that's fine.
  if (error && error.code !== "23505") throw error;
}

async function ensureCustomerProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const { data } = await supabase.from("customer_profiles").select("id").eq("user_id", user.id).limit(1);
  if (data && data.length > 0) return;
  const { error } = await supabase.from("customer_profiles").insert({
    user_id: user.id,
    full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Customer",
  });
  if (error && error.code !== "23505") throw error;
}

function readIntent(): AuthIntent {
  const v = getPending("role");
  return v === "business" || v === "customer" ? v : "auto";
}

/**
 * Idempotently make sure the signed-in account has the role it asked for.
 * - "customer"/"business": add that role if missing (keeps existing roles).
 * - "auto": only give a brand-new account the customer role.
 */
export async function ensureRoleAndProfile(intent: AuthIntent = readIntent()): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  const roles = await getRoles(user.id);
  const wanted: AuthRole | null =
    intent === "auto" ? (roles.length === 0 ? "customer" : null) : intent;

  if (wanted && !roles.includes(wanted)) await addRole(user.id, wanted);
  if (wanted === "customer" || roles.includes("customer")) await ensureCustomerProfile(user);
}

/** Creates the stashed business draft for the signed-in owner, if any. */
export async function createPendingBusiness(): Promise<boolean> {
  const raw = getPending("business");
  if (!raw) return false;
  let draft: Record<string, any> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      draft = parsed;
    }
  } catch {
    clearPending("business");
    return false;
  }
  if (!draft || typeof draft.name !== "string" || !draft.name.trim()) {
    clearPending("business");
    return false;
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: existing } = await supabase
    .from("businesses").select("id").eq("owner_id", data.user.id).limit(1);
  if (!existing || existing.length === 0) {
    const { error } = await supabase.from("businesses").insert({
      owner_id: data.user.id,
      name: draft.name,
      category: draft.category,
      description: draft.description || null,
      address: draft.address || null,
      default_settings: draft.default_settings,
    });
    if (error) throw error;
  }
  await addRole(data.user.id, "business");
  clearPending("business");
  return true;
}

/** Stash a business draft for the next post-auth step. */
export function stashPendingBusiness(draft: Record<string, unknown>): void {
  setPending("business", JSON.stringify(draft));
}

/**
 * Runs once a session exists: provisions roles/profile, creates any stashed
 * business, and returns where the user should land.
 */
export async function completePostAuth(intentOverride?: AuthIntent): Promise<string | null> {
  const intent = intentOverride ?? readIntent();
  const hasBusinessDraft = Boolean(getPending("business"));
  const effective: AuthIntent = hasBusinessDraft ? "business" : intent;

  await ensureRoleAndProfile(effective);
  await createPendingBusiness();

  const next = getPending("next");
  clearPending("next");
  clearPending("role");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  const roles = await getRoles(data.user.id);
  return destinationFor(roles, effective, Boolean(isAdmin));
}

/* --------------------- Verification-state helpers ---------------------- */

export interface VerificationStatus {
  signedIn: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  phone: string | null;
  primaryEmail: string | null;
}

/**
 * Read verification flags from the auth server. Only server-confirmed
 * timestamps are trusted — client-set metadata is never treated as proof.
 */
export async function getVerificationStatus(): Promise<VerificationStatus> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) {
    return { signedIn: false, phoneVerified: false, emailVerified: false, phone: null, primaryEmail: null };
  }
  return {
    signedIn: true,
    phoneVerified: Boolean(u.phone_confirmed_at),
    emailVerified: Boolean(u.email_confirmed_at),
    phone: u.phone ?? null,
    primaryEmail: u.email ?? null,
  };
}

export async function isPhoneVerified(): Promise<boolean> {
  return (await getVerificationStatus()).phoneVerified;
}

export async function isEmailVerified(): Promise<boolean> {
  return (await getVerificationStatus()).emailVerified;
}
