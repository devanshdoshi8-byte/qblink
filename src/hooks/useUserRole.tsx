import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureRoleAndProfile } from "@/lib/auth/authService";
import { useAuth } from "./useAuth";

export type AppRole = "customer" | "business" | "admin" | null;

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data?.role) {
        setRole(data.role as AppRole);
        setLoading(false);
        return;
      }

      // Provision role/profile for first-time Google OAuth sign-ins
      await ensureRoleAndProfile();
      const { data: provisioned } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setRole((provisioned?.role as AppRole) ?? null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  return { role, loading: loading || authLoading };
};
