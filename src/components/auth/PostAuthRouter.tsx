import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { completePostAuth } from "@/lib/auth/authService";
import { getPending } from "@/lib/auth/pendingAuth";

/**
 * Ensures a signed-in account is provisioned with required profile/role
 * and routed appropriately.
 */
const PostAuthRouter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const handledFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || handledFor.current === user.id) return;
    handledFor.current = user.id;

    (async () => {
      const pendingRole = getPending("role");
      const pendingBusiness = getPending("business");
      const pendingNext = getPending("next");
      const hasPending = Boolean(pendingRole || pendingBusiness || pendingNext);
      let hadRoles = false;
      if (!hasPending) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).limit(1);
        hadRoles = Boolean(data && data.length > 0);
        if (hadRoles) return; // already set up, nothing to do
      }
      const dest = await completePostAuth();
      if (dest && (hasPending || !hadRoles)) navigate(dest, { replace: true });
    })().catch(() => {
      handledFor.current = null;
      toast.error("Couldn't finish setting up your account. Please try again.");
    });

  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) handledFor.current = null;
  }, [user]);

  return null;
};

export default PostAuthRouter;
