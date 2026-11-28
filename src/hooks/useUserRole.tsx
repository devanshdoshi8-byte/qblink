import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { primaryRole } from "@/lib/auth/roles";

export type AppRole = "customer" | "business" | "admin" | null;

/**
 * Loads every role the signed-in account holds. An account can be both a
 * customer and a business owner, so callers should check `roles.includes(...)`
 * rather than comparing a single value.
 */
export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setRoles([]);
        } else {
          setRoles((data ?? []).map((r) => r.role as string));
        }
        setLoading(false);
      }, () => {
        if (cancelled) return;
        setRoles([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  return { role: primaryRole(roles) as AppRole, roles, loading: loading || authLoading };
};
