import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMyQueueVisits() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["my-queue-visits", user?.id];
  const active = useQuery({
    queryKey: [...key, "active"], enabled: !!user, refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_queue_visits", { p_history: false });
      if (error) throw error;
      return data || [];
    },
  });
  const history = useInfiniteQuery({
    queryKey: [...key, "history"], enabled: !!user, initialPageParam: 0, refetchInterval: 10000,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_my_queue_visits", { p_history: true, p_offset: pageParam });
      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (page, pages) => page.length === 25 ? pages.length * 25 : undefined,
  });
  const refresh = () => client.invalidateQueries({ queryKey: key });

  useEffect(() => {
    if (!user) return;
    const invalidate = () => { void client.invalidateQueries({ queryKey: ["my-queue-visits", user.id] }); };
    const channel = supabase.channel(`my-visits-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, invalidate)
      .subscribe();
    window.addEventListener("online", invalidate);
    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("online", invalidate);
    };
  }, [user?.id, client]);

  return { active, history, refresh };
}