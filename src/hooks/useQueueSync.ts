import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SyncedQueue {
  id: string;
  business_id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  last_reset_at?: string | null;
  note: string | null;
  current_token: number | null;
  next_token: number | null;
  updated_at?: string;
  queue_type?: string | null;
  table_config?: Array<{ seats: number; count: number }> | null;
  seating_policy?: string | null;
  parent_queue_id?: string | null;
  table_size?: number | null;
}

export interface PublicQueueVisitor {
  id: string | null;
  queue_id: string | null;
  token_number: number | null;
  status: string | null;
  joined_at: string | null;
  called_at: string | null;
}

export interface DetailQueueVisitor {
  id: string;
  queue_id: string;
  token_number: number;
  visitor_name: string | null;
  phone: string | null;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  session_id: string | null;
  party_size?: number | null;
  assigned_table_size?: number | null;
}

export interface QueueStats {
  waiting: number;
  called: number;
  served: number;
  skipped: number;
  removed: number;
  avgWait: number;
}

type RealtimeStatus = "idle" | "connecting" | "connected" | "error" | "timed_out" | "closed";

interface UseQueueSyncOptions {
  businessId?: string;
  queueId?: string;
  allQueues?: boolean;
  includeDetails?: boolean;
  enabled?: boolean;
  source?: string;
}

const emptyStats: QueueStats = { waiting: 0, called: 0, served: 0, skipped: 0, removed: 0, avgWait: 0 };

const avgWaitFromDetails = (rows: DetailQueueVisitor[]) => {
  const waits = rows
    .filter((v) => v.status === "served" && v.served_at)
    .map((v) => (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000)
    .filter((n) => Number.isFinite(n) && n >= 0 && n < 600);
  return waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
};

const buildStats = (publicRows: PublicQueueVisitor[], detailRows: DetailQueueVisitor[]): QueueStats => {
  const rows = detailRows.length ? detailRows : publicRows;
  return {
    waiting: publicRows.filter((v) => v.status === "waiting").length,
    called: rows.filter((v) => v.status === "called").length,
    served: rows.filter((v) => v.status === "served").length,
    skipped: rows.filter((v) => v.status === "skipped").length,
    removed: rows.filter((v) => v.status === "removed").length,
    avgWait: detailRows.length ? avgWaitFromDetails(detailRows) : 0,
  };
};

export const useQueueSync = ({
  businessId,
  queueId,
  allQueues = false,
  includeDetails = false,
  enabled = true,
  source = "queue-sync",
}: UseQueueSyncOptions) => {
  const [queues, setQueues] = useState<SyncedQueue[]>([]);
  const [publicVisitors, setPublicVisitors] = useState<PublicQueueVisitor[]>([]);
  const [detailVisitors, setDetailVisitors] = useState<DetailQueueVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [lastRealtimeEventAt, setLastRealtimeEventAt] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [consistencyWarnings, setConsistencyWarnings] = useState<string[]>([]);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const retryCountRef = useRef(0);
  const queueIdsRef = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setRefreshing(true);
    setSyncError(null);
    try {
      if (businessId === "demo-clinic-business") {
        const queueRows: SyncedQueue[] = [
          {
            id: "demo-queue-dr-patange",
            business_id: "demo-clinic-business",
            name: "OPD Consultation Queue (Dr. Ambrish Patange)",
            status: "active",
            estimated_service_time: 12,
            note: "General Medicine & Diagnostics · Room 1",
            current_token: 14,
            next_token: 15,
            queue_type: "standard",
            updated_at: new Date().toISOString(),
          },
        ];
        queueIdsRef.current = ["demo-queue-dr-patange"];
        const detailRows: DetailQueueVisitor[] = [
          {
            id: "v-14",
            queue_id: "demo-queue-dr-patange",
            token_number: 14,
            visitor_name: "Kavita Rao",
            phone: "+91 98200 11223",
            status: "called",
            joined_at: new Date(Date.now() - 35 * 60000).toISOString(),
            called_at: new Date(Date.now() - 2 * 60000).toISOString(),
            served_at: null,
            session_id: null,
          },
          {
            id: "v-15",
            queue_id: "demo-queue-dr-patange",
            token_number: 15,
            visitor_name: "Rahul Sharma",
            phone: "+91 98200 54321",
            status: "waiting",
            joined_at: new Date(Date.now() - 20 * 60000).toISOString(),
            called_at: null,
            served_at: null,
            session_id: null,
          },
          {
            id: "v-16",
            queue_id: "demo-queue-dr-patange",
            token_number: 16,
            visitor_name: "Amit Deshmukh",
            phone: "+91 98200 77889",
            status: "waiting",
            joined_at: new Date(Date.now() - 15 * 60000).toISOString(),
            called_at: null,
            served_at: null,
            session_id: null,
          },
          {
            id: "v-17",
            queue_id: "demo-queue-dr-patange",
            token_number: 17,
            visitor_name: "Pooja Verma",
            phone: "+91 98200 99001",
            status: "waiting",
            joined_at: new Date(Date.now() - 8 * 60000).toISOString(),
            called_at: null,
            served_at: null,
            session_id: null,
          },
          {
            id: "v-13",
            queue_id: "demo-queue-dr-patange",
            token_number: 13,
            visitor_name: "Rajesh Kulkarni",
            phone: "+91 98200 44556",
            status: "served",
            joined_at: new Date(Date.now() - 55 * 60000).toISOString(),
            called_at: new Date(Date.now() - 22 * 60000).toISOString(),
            served_at: new Date(Date.now() - 5 * 60000).toISOString(),
            session_id: null,
          },
          {
            id: "v-12",
            queue_id: "demo-queue-dr-patange",
            token_number: 12,
            visitor_name: "Sneha Patel",
            phone: "+91 98200 33221",
            status: "served",
            joined_at: new Date(Date.now() - 75 * 60000).toISOString(),
            called_at: new Date(Date.now() - 40 * 60000).toISOString(),
            served_at: new Date(Date.now() - 25 * 60000).toISOString(),
            session_id: null,
          },
        ];
        const publicRows: PublicQueueVisitor[] = detailRows.map((v) => ({
          id: v.id,
          queue_id: v.queue_id,
          token_number: v.token_number,
          status: v.status,
          joined_at: v.joined_at,
          called_at: v.called_at,
        }));
        setQueues(queueRows);
        setDetailVisitors(detailRows);
        setPublicVisitors(publicRows);
        setLoading(false);
        setRefreshing(false);
        setRealtimeStatus("connected");
        setLastRefreshAt(new Date().toISOString());
        return;
      }
      let queueRows: SyncedQueue[] = [];
      const queueSelect = "id,business_id,name,status,estimated_service_time,last_reset_at,note,current_token,next_token,updated_at,queue_type,table_config,seating_policy,parent_queue_id,table_size";
      if (allQueues) {
        const { data, error } = await supabase.from("queues").select(queueSelect).order("updated_at", { ascending: false });
        if (error) throw error;
        queueRows = (data || []) as SyncedQueue[];
      } else if (businessId) {
        const { data, error } = await supabase.from("queues").select(queueSelect).eq("business_id", businessId).order("created_at", { ascending: false });
        if (error) throw error;
        queueRows = (data || []) as SyncedQueue[];
      } else if (queueId) {
        const { data, error } = await supabase.from("queues").select(queueSelect).eq("id", queueId).maybeSingle();
        if (error) throw error;
        queueRows = data ? [data as SyncedQueue] : [];
      }

      const ids = queueRows.map((q) => q.id);
      queueIdsRef.current = ids;
      setQueues(queueRows);

      let publicRows: PublicQueueVisitor[] = [];
      let detailRows: DetailQueueVisitor[] = [];
      let visitorErrorMessage: string | null = null;
      if (ids.length > 0) {
        try {
          const { data, error } = await (supabase as any)
            .from("queue_visitors_public")
            .select("id,queue_id,token_number,status,joined_at,called_at")
            .in("queue_id", ids)
            .order("token_number", { ascending: true });
          if (error) {
            visitorErrorMessage = error.message || "Failed to load public queue visitors";
          } else {
            publicRows = (data || []) as PublicQueueVisitor[];
          }
        } catch (err: any) {
          visitorErrorMessage = err?.message || "Failed to load public queue visitors";
        }

        if (includeDetails) {
          try {
            const { data: details, error: detailError } = await supabase
              .from("queue_visitors")
              .select("*")
              .in("queue_id", ids)
              .is("session_id", null)
              .order("token_number", { ascending: true });
            if (detailError) {
              visitorErrorMessage = detailError.message || "Failed to load queue visitors";
            } else {
              detailRows = (details || []) as DetailQueueVisitor[];
            }
          } catch (err: any) {
            visitorErrorMessage = err?.message || "Failed to load queue visitors";
          }
        }
      }

      if (visitorErrorMessage) {
        console.error("Qblink visitor sync warning", { source, message: visitorErrorMessage });
        setSyncError(visitorErrorMessage);
      }

      const warnings: string[] = [];
      if (includeDetails && publicRows.length > 0) {
        ids.forEach((id) => {
          const publicWaiting = publicRows.filter((v) => v.queue_id === id && v.status === "waiting").length;
          const detailWaiting = detailRows.filter((v) => v.queue_id === id && v.status === "waiting").length;
          if (publicWaiting !== detailWaiting) {
            warnings.push(`${source}: queue ${id} public waiting=${publicWaiting}, detail waiting=${detailWaiting}`);
          }
        });
      }

      if (warnings.length) console.warn("Qblink queue sync consistency warning", warnings);
      setConsistencyWarnings(warnings);
      setPublicVisitors(publicRows);
      setDetailVisitors(detailRows);
      setLastRefreshAt(new Date().toISOString());
    } catch (error: any) {
      const message = error?.message || (error instanceof Error ? error.message : "Queue sync failed");
      console.error("Qblink queue sync error", { source, message });
      setSyncError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allQueues, businessId, enabled, includeDetails, queueId, source]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || (!allQueues && !businessId && !queueId)) return;
    setRealtimeStatus("connecting");
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const refetchFromRealtime = (payload: any) => {
      const touchedQueueId = payload?.new?.queue_id || payload?.old?.queue_id || payload?.new?.id || payload?.old?.id;
      if (allQueues || !touchedQueueId || queueIdsRef.current.includes(touchedQueueId)) {
        setLastRealtimeEventAt(new Date().toISOString());
        refresh();
      }
    };

    let channel = supabase.channel(`qblink-sync-${source}-${businessId || queueId || "all"}-${subscriptionVersion}`);
    if (queueId) {
      channel = channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${queueId}` }, refetchFromRealtime)
        .on("postgres_changes", { event: "*", schema: "public", table: "queues", filter: `id=eq.${queueId}` }, refetchFromRealtime);
    } else {
      channel = channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, refetchFromRealtime)
        .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, refetchFromRealtime);
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        retryCountRef.current = 0;
        setRealtimeStatus("connected");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        const mapped = status === "TIMED_OUT" ? "timed_out" : status === "CLOSED" ? "closed" : "error";
        setRealtimeStatus(mapped);
        const delay = Math.min(30000, 1000 * 2 ** retryCountRef.current);
        retryCountRef.current += 1;
        retryTimer = setTimeout(() => setSubscriptionVersion((v) => v + 1), delay);
      }
    });

    const poll = setInterval(refresh, 15000);
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [allQueues, businessId, enabled, queueId, refresh, source, subscriptionVersion]);

  const statsByQueue = useMemo(() => {
    const map: Record<string, QueueStats> = {};
    queues.forEach((queue) => {
      const pub = publicVisitors.filter((v) => v.queue_id === queue.id);
      const det = detailVisitors.filter((v) => v.queue_id === queue.id);
      map[queue.id] = buildStats(pub, det);
    });
    return map;
  }, [detailVisitors, publicVisitors, queues]);

  const getQueueStats = useCallback((id?: string | null) => (id ? statsByQueue[id] || emptyStats : emptyStats), [statsByQueue]);
  const getPublicVisitors = useCallback((id?: string | null) => (id ? publicVisitors.filter((v) => v.queue_id === id) : []), [publicVisitors]);
  const getDetailVisitors = useCallback((id?: string | null) => (id ? detailVisitors.filter((v) => v.queue_id === id) : []), [detailVisitors]);

  return {
    queues,
    publicVisitors,
    detailVisitors,
    statsByQueue,
    getQueueStats,
    getPublicVisitors,
    getDetailVisitors,
    loading,
    refreshing,
    refresh,
    lastRefreshAt,
    lastRealtimeEventAt,
    realtimeStatus,
    syncError,
    consistencyWarnings,
  };
};