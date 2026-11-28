import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, Clock, CheckCircle, SkipForward, UserPlus, Phone, Trash2, QrCode, Monitor, BarChart3, Pause, Play, RefreshCw, Sunrise, Info, KeyRound, Sparkles, Printer, X, Smartphone, ExternalLink, Download, Bell, FlaskConical, UserX, Zap, ArrowUpRight } from "lucide-react";
import { publicUrl } from "@/lib/publicUrl";
import { QRCodeSVG } from "qrcode.react";
import { downloadStandeePNG } from "@/lib/standeeExport";
import { buildQRStandeeHtml } from "@/lib/qrStandee";
import BusinessLayout from "@/components/business/BusinessLayout";
import AIInsights from "@/components/AIInsights";
import BusinessBenchmark from "@/components/business/BusinessBenchmark";
import QueueForecast from "@/components/QueueForecast";
import HealthScoreCard from "@/components/health/HealthScoreCard";
import QueueHealthAlerts from "@/components/QueueHealthAlerts";
import QueueIntegrityPanel from "@/components/business/QueueIntegrityPanel";
import { useQueueSync } from "@/hooks/useQueueSync";
import RestaurantTableConfig, { TableSize, COMMON_PARTY_SIZES, PartySizeMode } from "@/components/business/RestaurantTableConfig";
import EmptyState from "@/components/EmptyState";
import InfoHint from "@/components/InfoHint";
import { hapticCopy, hapticRefresh, hapticSuccess } from "@/lib/haptics";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  DailyResetConfig,
  defaultDailyResetConfig,
  normalizeDailyResetConfig,
  formatResetTimeLabel,
  formatTimezoneShort,
  isQueueDueForReset
} from "@/lib/dailyReset";
import { isClinicIndustry } from "@/lib/industryDefaults";
import { sendQueueSmsNonBlocking } from "@/lib/sms";
import { playClinicChime } from "@/lib/audioChime";
import {
  ClinicCabinMiniMode,
  ClinicPulseStrip,
  ClinicTimerBadge,
  ClinicWrapModal,
  PAUSE_REASONS,
  VISIT_TYPE_META,
  VisitType,
} from "@/components/clinic/ClinicEnhancements";

interface Queue {
  id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  note: string | null;
  current_token: number | null;
  next_token: number | null;
  last_reset_at?: string | null;
}

interface Visitor {
  id: string;
  token_number: number;
  visitor_name: string | null;
  phone: string | null;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  party_size?: number | null;
  assigned_table_size?: number | null;
  visitType?: VisitType;
  isUrgent?: boolean;
}

const printQRStandee = (bizName: string, queueName: string, url: string, isClinic = false) => {
  const win = window.open("", "_blank");
  if (!win) return;
  const svgEl = document.getElementById("qr-standee-svg");
  const svgXml = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
  const svgDataUri = svgXml ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}` : "";

  win.document.write(buildQRStandeeHtml({ bizName, queueName, url, svgDataUri, isClinic }));
  win.document.close();
};

const Dashboard = () => {
  return (
    <BusinessLayout>
      {(business) => (
        <QueueManager
          businessId={business.id}
          businessName={business.name}
          businessCategory={business.category}
        />
      )}
    </BusinessLayout>
  );
};

const QueueManager = ({
  businessId,
  businessName,
  businessCategory,
}: {
  businessId: string;
  businessName: string;
  businessCategory?: string | null;
}) => {
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [showAIBanner, setShowAIBanner] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAddWalkin, setShowAddWalkin] = useState(false);
  const [newQueue, setNewQueue] = useState<{
    name: string;
    estimated_service_time: number;
    note: string;
    queue_type: "standard" | "appointment" | "restaurant";
    config_mode: "single" | "counters" | "seating" | "departments";
    table_config: TableSize[];
    seating_policy: "strict" | "flexible";
    party_sizes: number[];
    party_size_mode: PartySizeMode;
  }>({
    name: "",
    estimated_service_time: 5,
    note: "",
    queue_type: "standard",
    config_mode: "single",
    table_config: [
      { seats: 2, count: 1 },
      { seats: 4, count: 1 },
      { seats: 6, count: 1 },
      { seats: 8, count: 1 },
    ],
    seating_policy: "strict",
    party_sizes: [...COMMON_PARTY_SIZES],
    party_size_mode: "common",
  });
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinParty, setWalkinParty] = useState<number>(2);
  const [showReset, setShowReset] = useState(false);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [resetting, setResetting] = useState(false);
  const {
    queues,
    getDetailVisitors,
    getQueueStats,
    refresh,
    refreshing,
    lastRefreshAt,
    realtimeStatus,
    lastRealtimeEventAt,
    syncError,
    consistencyWarnings,
  } = useQueueSync({ businessId, includeDetails: true, source: "business-dashboard" });

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const [localDemoMode, setLocalDemoMode] = useState(false);
  const [localDemoDismissed, setLocalDemoDismissed] = useState(false);
  const isDemo = businessId === "demo-clinic-business" || (isLocalhost && localDemoMode);

  const buildInitialDemoVisitors = (): Visitor[] => [
    {
      id: "v-14",
      token_number: 14,
      visitor_name: "Kavita Rao",
      phone: "+91 98200 11223",
      status: "called",
      joined_at: new Date(Date.now() - 35 * 60000).toISOString(),
      called_at: new Date(Date.now() - 2 * 60000).toISOString(),
      served_at: null,
      visitType: "new",
    },
    {
      id: "v-15",
      token_number: 15,
      visitor_name: "Rahul Sharma",
      phone: "+91 98200 54321",
      status: "waiting",
      joined_at: new Date(Date.now() - 20 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      visitType: "followup",
    },
    {
      id: "v-16",
      token_number: 16,
      visitor_name: "Amit Deshmukh",
      phone: "+91 98200 77889",
      status: "waiting",
      joined_at: new Date(Date.now() - 15 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      visitType: "report",
    },
    {
      id: "v-17",
      token_number: 17,
      visitor_name: "Pooja Verma",
      phone: "+91 98200 99001",
      status: "waiting",
      joined_at: new Date(Date.now() - 8 * 60000).toISOString(),
      called_at: null,
      served_at: null,
      visitType: "new",
    },
  ];
  const [demoVisitors, setDemoVisitors] = useState<Visitor[]>(buildInitialDemoVisitors);
  const [demoNextTokenNum, setDemoNextTokenNum] = useState<number>(18);
  const [demoQueuePaused, setDemoQueuePaused] = useState(false);

  const resetDemoData = () => {
    setDemoVisitors(buildInitialDemoVisitors());
    setDemoNextTokenNum(18);
    setDemoQueuePaused(false);
    setPauseReason(null);
    setDelayMinutes(0);
    setLabHoldVisitors([]);
    setShowWrapModal(false);
    toast.success("Demo clinic queue reset");
  };

  // Clinic UX enhancements (shared across live & demo)
  const [miniMode, setMiniMode] = useState(false);
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const [showPausePicker, setShowPausePicker] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [labHoldVisitors, setLabHoldVisitors] = useState<Visitor[]>([]);
  const [showWrapModal, setShowWrapModal] = useState(false);
  const [walkinVisitType, setWalkinVisitType] = useState<VisitType>("new");
  const [walkinUrgent, setWalkinUrgent] = useState(false);
  const [visitorMeta, setVisitorMeta] = useState<Record<string, { visitType?: VisitType; isUrgent?: boolean }>>({});

  const rawSelectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0] || null;
  const selectedQueue = useMemo(() => {
    if (!isDemo || !rawSelectedQueue) return rawSelectedQueue;
    const activeCalled = demoVisitors.find((v) => v.status === "called");
    const firstWaiting = demoVisitors.find((v) => v.status === "waiting");
    return {
      ...rawSelectedQueue,
      current_token: activeCalled?.token_number ?? 0,
      next_token: firstWaiting?.token_number ?? demoNextTokenNum,
      status: demoQueuePaused ? "paused" : "active",
    };
  }, [isDemo, rawSelectedQueue, demoVisitors, demoNextTokenNum, demoQueuePaused]);

  const isClinic =
    isClinicIndustry(businessCategory) ||
    isClinicIndustry((selectedQueue as any)?.industry) ||
    isClinicIndustry((selectedQueue as any)?.category) ||
    /^(dr\b|doctor|clinic|opd|patient|healthcare|medical)/i.test(selectedQueue?.name || "");
  const rawVisitors: Visitor[] = getDetailVisitors(selectedQueue?.id);

  // On localhost only, auto-load sample clinic patients when the selected clinic queue is empty
  useEffect(() => {
    if (!isLocalhost || businessId === "demo-clinic-business" || !isClinic || localDemoDismissed) return;
    const hasRealActive = rawVisitors.some((v) => v.status === "waiting" || v.status === "called");
    if (!hasRealActive && rawSelectedQueue) {
      setLocalDemoMode(true);
    } else if (hasRealActive && localDemoMode) {
      setLocalDemoMode(false);
    }
  }, [isLocalhost, businessId, isClinic, localDemoDismissed, rawVisitors, rawSelectedQueue, localDemoMode]);
  const visitors: Visitor[] = useMemo(() => {
    const base = isDemo ? demoVisitors : rawVisitors;
    const labIds = new Set(labHoldVisitors.map((l) => l.id));
    return base
      .filter((v) => !labIds.has(v.id))
      .map((v) => ({
        ...v,
        visitType: v.visitType ?? visitorMeta[v.id]?.visitType,
        isUrgent: v.isUrgent ?? visitorMeta[v.id]?.isUrgent,
      }));
  }, [isDemo, demoVisitors, rawVisitors, labHoldVisitors, visitorMeta]);

  const rawStats = getQueueStats(selectedQueue?.id);
  const syncedStats = useMemo(() => {
    if (!isDemo) return rawStats;
    const waiting = visitors.filter((v) => v.status === "waiting").length;
    const called = visitors.filter((v) => v.status === "called").length;
    const served = visitors.filter((v) => v.status === "served").length + 12;
    const skipped = visitors.filter((v) => v.status === "no_show" || v.status === "skipped").length;
    return { waiting, called, served, skipped, removed: 0, avgWait: 9 + delayMinutes };
  }, [isDemo, rawStats, visitors, delayMinutes]);
  const showDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("qdebug") === "1";

  const [onPremiseCode, setOnPremiseCode] = useState<string | null>(null);
  const [dailyResetCfg, setDailyResetCfg] = useState<DailyResetConfig>(defaultDailyResetConfig());

  useEffect(() => {
    supabase
      .from("businesses")
      .select("remote_joining_enabled, settings")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if ((data as any).settings) {
            setDailyResetCfg(normalizeDailyResetConfig((data as any).settings));
          }
          if ((data as any).remote_joining_enabled === false) {
            const cfg = (data as any).settings?.on_premise_joining;
            if (cfg?.enabled && cfg?.counter_code) {
              setOnPremiseCode(cfg.counter_code);
              return;
            }
          }
        }
        setOnPremiseCode(null);
      });
  }, [businessId]);

  const handleRefresh = async () => {
    if (refreshing) return;
    hapticRefresh();
    await refresh();
  };

  const createQueue = async () => {
    if (!newQueue.name.trim()) return;
    const isRestaurant = newQueue.queue_type === "restaurant";
    if (isRestaurant && newQueue.table_config.length === 0) {
      toast.error("Add at least one table size");
      return;
    }
    const insertPayload: any = {
      business_id: businessId,
      name: newQueue.name,
      estimated_service_time: newQueue.estimated_service_time,
      note: newQueue.note || null,
      queue_type: newQueue.queue_type,
    };
    if (isRestaurant) {
      insertPayload.table_config = newQueue.table_config;
      insertPayload.seating_policy = newQueue.seating_policy;
      insertPayload.party_sizes = newQueue.party_sizes.length
        ? newQueue.party_sizes
        : [...COMMON_PARTY_SIZES];
      insertPayload.party_size_mode = newQueue.party_size_mode;
    }
    const { data, error } = await supabase.from("queues").insert(insertPayload).select().single();
    if (error) { toast.error(error.message || "Failed to create queue"); return; }
    toast.success("Queue created!");
    setShowCreate(false);
    setNewQueue({
      name: "",
      estimated_service_time: 5,
      note: "",
      queue_type: "standard",
      config_mode: "single",
      table_config: [
        { seats: 2, count: 1 },
        { seats: 4, count: 1 },
        { seats: 6, count: 1 },
        { seats: 8, count: 1 },
      ],
      seating_policy: "strict",
      party_sizes: [...COMMON_PARTY_SIZES],
      party_size_mode: "common",
    });
    if (data) {
      setSelectedQueueId(data.id);
      await refresh();
    }
  };

  const [callingNext, setCallingNext] = useState(false);

  const addWalkin = async () => {
    if (!selectedQueue) return;
    if (isDemo) {
      const tokenNum = demoNextTokenNum;
      const newVisitor: Visitor = {
        id: `v-${tokenNum}-${Date.now()}`,
        token_number: tokenNum,
        visitor_name: walkinName.trim() || `Walk-in Patient #${tokenNum}`,
        phone: walkinPhone.trim() || null,
        status: "waiting",
        joined_at: new Date().toISOString(),
        called_at: null,
        served_at: null,
        visitType: isClinic ? walkinVisitType : undefined,
        isUrgent: isClinic ? walkinUrgent : undefined,
      };
      setDemoVisitors((prev) => {
        if (isClinic && walkinUrgent) {
          const calledIdx = prev.findIndex((v) => v.status === "called");
          const firstWaitIdx = prev.findIndex((v) => v.status === "waiting");
          const insertIdx = firstWaitIdx !== -1 ? firstWaitIdx : calledIdx !== -1 ? calledIdx + 1 : prev.length;
          const next = [...prev];
          next.splice(insertIdx, 0, newVisitor);
          return next;
        }
        return [...prev, newVisitor];
      });
      setDemoNextTokenNum((n) => n + 1);
      hapticSuccess();
      toast.success(
        walkinUrgent && isClinic
          ? `⚡ Urgent Token #${tokenNum} placed Next Up`
          : `Token #${tokenNum} added for walk-in patient`
      );
      setShowAddWalkin(false);
      setWalkinName("");
      setWalkinPhone("");
      setWalkinVisitType("new");
      setWalkinUrgent(false);
      return;
    }
    const isRestaurant = (selectedQueue as any).queue_type === "restaurant";
    const rpcArgs: any = {
      p_queue_id: selectedQueue.id,
      p_visitor_name: walkinName || "Walk-in",
      p_phone: walkinPhone || null,
    };
    if (isRestaurant) rpcArgs.p_party_size = walkinParty;
    const { data, error } = await supabase.rpc("join_queue", rpcArgs);
    if (error) { toast.error(error.message || "Failed to add walk-in"); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.id && isClinic) {
      setVisitorMeta((prev) => ({
        ...prev,
        [row.id]: { visitType: walkinVisitType, isUrgent: walkinUrgent },
      }));
    }
    hapticSuccess();
    toast.success(`Token #${row?.token_number ?? ""} added`);
    setShowAddWalkin(false);
    setWalkinName("");
    setWalkinPhone("");
    setWalkinParty(2);
    setWalkinVisitType("new");
    setWalkinUrgent(false);
    refresh();
  };

  const callNext = async () => {
    if (!selectedQueue || callingNext) return;
    if (isDemo) {
      const currentCalled = visitors.find((v) => v.status === "called");
      const nextWaiting = visitors.find((v) => v.status === "waiting");
      if (!currentCalled && !nextWaiting) {
        toast.info("No patients waiting");
        return;
      }
      setCallingNext(true);
      setTimeout(() => {
        setCallingNext(false);
        const nowIso = new Date().toISOString();
        setDemoVisitors((prev) =>
          prev.map((v) => {
            if (currentCalled && v.id === currentCalled.id) {
              return { ...v, status: "served", served_at: nowIso };
            }
            if (nextWaiting && v.id === nextWaiting.id) {
              return { ...v, status: "called", called_at: nowIso };
            }
            return v;
          })
        );
        hapticSuccess();
        if (isClinic) playClinicChime(0.35);
        if (nextWaiting) {
          toast.success(
            currentCalled
              ? `Calling #${nextWaiting.token_number} ${nextWaiting.visitor_name || ""} (Token #${currentCalled.token_number} completed)`
              : `Calling #${nextWaiting.token_number} ${nextWaiting.visitor_name || ""}`
          );
        } else if (currentCalled) {
          toast.success(`Token #${currentCalled.token_number} consultation completed — OPD clear!`);
          if (isClinic) setShowWrapModal(true);
        }
      }, 220);
      return;
    }
    setCallingNext(true);
    const prevCalled = visitors.find((v) => v.status === "called");
    try {
      const { data, error } = await supabase.rpc("call_next", { p_queue_id: selectedQueue.id });
      if (error) { toast.error(error.message || "Call Next failed"); return; }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        if (prevCalled) {
          hapticSuccess();
          if (isClinic) {
            playClinicChime(0.35);
            setShowWrapModal(true);
          }
          toast.success(
            isClinic
              ? `Token #${prevCalled.token_number} consultation completed — no more patients waiting`
              : `Token #${prevCalled.token_number} served — queue is now empty`
          );
        } else {
          toast.info(isClinic ? "No patients waiting" : "No one waiting");
        }
      } else {
        hapticSuccess();
        if (isClinic) playClinicChime(0.35);
        toast.success(
          isClinic && prevCalled
            ? `Calling #${row.token_number} (Token #${prevCalled.token_number} completed)`
            : `Calling #${row.token_number}`
        );

        // Non-blocking SMS alert for the newly called patient/customer
        const calledVisitor = visitors.find((v) => v.id === row.id) || row;
        if (calledVisitor?.phone) {
          sendQueueSmsNonBlocking({
            businessId,
            tokenId: row.id,
            phone: calledVisitor.phone,
            eventType: "NOW_SERVING",
            clinicName: businessName,
            tokenNumber: row.token_number,
          });
        }

        // Check if there is someone approaching their turn (e.g. 2nd person in line)
        const waitingList = visitors.filter((v) => v.status === "waiting" && v.id !== row.id);
        const nearTurn = waitingList[1]; // 2 turns away
        if (nearTurn?.phone) {
          sendQueueSmsNonBlocking({
            businessId,
            tokenId: nearTurn.id,
            phone: nearTurn.phone,
            eventType: "TURN_NEAR",
            clinicName: businessName,
            tokenNumber: nearTurn.token_number,
            etaMinutes: (selectedQueue.estimated_service_time || 5) + delayMinutes,
          });
        }
      }
      refresh();
    } finally {
      setCallingNext(false);
    }
  };

  const serveTable = async (seats: number) => {
    if (!selectedQueue || callingNext) return;
    setCallingNext(true);
    try {
      const { data, error } = await supabase.rpc("serve_restaurant_next" as any, {
        p_queue_id: selectedQueue.id,
        p_table_size: seats,
      });
      if (error) { toast.error(error.message || "Could not serve next"); return; }
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) { toast.info(`No one waiting for a ${seats}-seat table`); }
      else { hapticSuccess(); toast.success(`Calling #${row.token_number} (party of ${row.party_size}) for ${row.assigned_table_size}-seat table`); }
      refresh();
    } finally {
      setCallingNext(false);
    }
  };

  const markServed = async (id: string, t: number) => {
    const waitingCountNow = visitors.filter((v) => v.status === "waiting").length;
    if (isDemo) {
      setDemoVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "served", served_at: new Date().toISOString() } : v))
      );
      hapticSuccess();
      if (isClinic) {
        playClinicChime(0.35);
        toast.success(`Token #${t} consultation completed`);
        if (waitingCountNow === 0) setShowWrapModal(true);
      } else {
        toast.success(`#${t} served`);
      }
      return;
    }
    await supabase.from("queue_visitors").update({ status: "served", served_at: new Date().toISOString() }).eq("id", id);
    hapticSuccess();
    if (isClinic) {
      playClinicChime(0.35);
      toast.success(`Token #${t} consultation completed`);
      if (waitingCountNow === 0) setShowWrapModal(true);
    } else {
      toast.success(`#${t} served`);
    }
    refresh();
  };
  const skipVisitor = async (id: string, t: number) => {
    if (isDemo) {
      setDemoVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "skipped" } : v)));
      toast.info(`#${t} skipped`);
      return;
    }
    const { error } = await (supabase as any).rpc("skip_visitor", { p_visitor_id: id });
    if (error) return toast.error(error.message || "Skip failed");
    toast.info(`#${t} skipped`);
    refresh();
  };
  const markNoShow = async (id: string, t: number) => {
    if (isDemo) {
      setDemoVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "no_show" } : v)));
      toast.info(`#${t} marked no-show`);
      return;
    }
    const { error } = await (supabase as any).rpc("mark_no_show", { p_visitor_id: id });
    if (error) return toast.error(error.message || "Could not mark no-show");
    toast.info(`#${t} marked no-show`);
    refresh();
  };
  const removeVisitor = async (id: string, t: number) => {
    if (isDemo) {
      setDemoVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status: "removed" } : v)));
      toast.info(`#${t} removed`);
      return;
    }
    await supabase.from("queue_visitors").update({ status: "removed" }).eq("id", id);
    toast.info(`#${t} removed`);
  };

  const recallCurrent = (v: Visitor) => {
    playClinicChime(0.5);
    hapticSuccess();
    toast.success(`🔔 Re-called Token #${v.token_number} (${v.visitor_name || "Patient"}) to cabin`);
  };

  const sendToLab = (v: Visitor) => {
    setLabHoldVisitors((prev) => [...prev, { ...v, status: "waiting" }]);
    if (isDemo) {
      setDemoVisitors((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, status: "waiting", called_at: null } : item))
      );
    }
    hapticSuccess();
    toast.info(`🧪 #${v.token_number} parked for Lab / Reports — won't lose their spot`);
  };

  const bringBackFromLab = (v: Visitor) => {
    setLabHoldVisitors((prev) => prev.filter((item) => item.id !== v.id));
    if (isDemo) {
      setDemoVisitors((prev) => {
        const rest = prev.filter((item) => item.id !== v.id);
        const firstWaitIdx = rest.findIndex((item) => item.status === "waiting");
        const insertIdx = firstWaitIdx !== -1 ? firstWaitIdx : rest.length;
        const next = [...rest];
        next.splice(insertIdx, 0, { ...v, status: "waiting", visitType: "report", isUrgent: true });
        return next;
      });
    }
    hapticSuccess();
    toast.success(`📄 #${v.token_number} returned with reports — placed Next Up`);
  };

  const applyPauseReason = async (reasonLabel: string) => {
    setPauseReason(reasonLabel);
    setShowPausePicker(false);
    if (isDemo) {
      setDemoQueuePaused(true);
      toast.info(`Queue paused · ${reasonLabel}`);
      return;
    }
    if (!selectedQueue) return;
    await supabase.from("queues").update({ status: "paused" }).eq("id", selectedQueue.id);
    toast.info(`Queue paused · ${reasonLabel}`);
    refresh();
  };

  const toggleDelay = () => {
    const next = delayMinutes === 0 ? 15 : 0;
    setDelayMinutes(next);
    if (next > 0) {
      toast.info("⏱ +15m delay alert active — patient ETAs updated");
    } else {
      toast.success("On-schedule pace restored");
    }
  };

  const toggleQueueStatus = async () => {
    if (!selectedQueue) return;
    if (selectedQueue.status === "active" && isClinic) {
      setShowPausePicker((v) => !v);
      return;
    }
    setPauseReason(null);
    setShowPausePicker(false);
    if (isDemo) {
      setDemoQueuePaused(!demoQueuePaused);
      toast.info(!demoQueuePaused ? "Queue paused" : "Queue resumed");
      return;
    }
    const newStatus = selectedQueue.status === "active" ? "paused" : "active";
    await supabase.from("queues").update({ status: newStatus }).eq("id", selectedQueue.id);
    toast.success(`Queue ${newStatus}`);
    refresh();
  };

  // Spacebar hotkey on live clinic dashboard (when no modal or input is focused)
  useEffect(() => {
    if (!isClinic) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      if (showAddWalkin || showCreate || showQR || showReset || showWrapModal) return;
      e.preventDefault();
      callNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const stopQueue = async () => {
    if (!selectedQueue) return;
    await supabase.from("queues").update({ status: "closed" }).eq("id", selectedQueue.id);
    toast.info("Queue stopped");
    refresh();
  };

  const startNewDay = async () => {
    if (!selectedQueue || resetting) return;
    setResetting(true);
    try {
      const { data, error } = await supabase.rpc("reset_queue_for_new_day", { p_queue_id: selectedQueue.id });
      if (error) {
        if (error.message?.includes("queue_visitors_status_check")) {
          toast.error("Database constraint needs updating: Run the 4-line SQL in Supabase SQL Editor to allow 'no_show' status.");
        } else {
          toast.error(error.message || "Could not start a new day");
        }
        return;
      }
      const s: any = Array.isArray(data) ? data[0] : data;
      hapticSuccess();
      toast.success(`New day started — ${s?.total_joined ?? 0} visitors archived`);
      setShowReset(false);
      await refresh();
    } finally {
      setResetting(false);
    }
  };

  // Automated Midnight Queue Reset: Triggers automatically past 12:00 AM
  const triggerAutoResetIfDue = async () => {
    if (!selectedQueue || resetting || isDemo) return;
    if (!dailyResetCfg.enabled) return;

    try {
      // 1. Check via RPC which evaluates business timezone and last_reset_at
      const { data, error } = await supabase.rpc("check_and_auto_reset_queue", {
        p_queue_id: selectedQueue.id,
      });

      if (!error && (data as any)?.reset === true) {
        toast.success("🌅 12:00 AM Midnight reached: New day started automatically! Queue reset to token #1.", {
          duration: 6000,
        });
        await refresh();
        return;
      }

      // 2. Client-side fallback check
      if (selectedQueue.last_reset_at && isQueueDueForReset(selectedQueue.last_reset_at, dailyResetCfg)) {
        await startNewDay();
      }
    } catch {
      // Ignore background auto-reset check exceptions
    }
  };

  // Run auto-reset check on mount/selection, every 30s, and when waking up / tab becomes visible
  useEffect(() => {
    if (!selectedQueue || isDemo) return;
    triggerAutoResetIfDue();

    const interval = setInterval(triggerAutoResetIfDue, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerAutoResetIfDue();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [selectedQueue?.id, isDemo, dailyResetCfg.enabled, dailyResetCfg.time, dailyResetCfg.timezone]);

  const waiting = visitors.filter(v => v.status === "waiting");
  const called = visitors.filter(v => v.status === "called");
  const served = visitors.filter(v => v.status === "served");
  const joinUrl = selectedQueue
    ? ((selectedQueue as any).parent_queue_id && (selectedQueue as any).table_size
        ? publicUrl(`/join/${(selectedQueue as any).parent_queue_id}?size=${(selectedQueue as any).table_size}`)
        : publicUrl(`/join/${selectedQueue.id}`))
    : "";
  const displayUrl = selectedQueue ? publicUrl(`/display/${selectedQueue.id}`) : "";

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Queue Manager</h1>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              Business POV
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isClinic
              ? "Doctor & Clinic OPD command center"
              : (selectedQueue as any)?.queue_type === "restaurant"
                ? "Table & guest flow command center"
                : "Manage your live queues and visitors"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={selectedQueue ? `/join/${selectedQueue.id}` : "/join/demo"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all shadow-md active:scale-[0.99]"
          >
            <Smartphone className="w-4 h-4 text-slate-950" />
            <span>Switch to Customer POV</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
        {selectedQueue && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              selectedQueue.status === "active" ? "bg-success-soft text-success" :
              selectedQueue.status === "paused" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"
            }`}>
              ● Queue {selectedQueue.status}
            </span>
            {dailyResetCfg.enabled && (
              <span
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-muted/60 border border-border text-foreground"
                title={`Queue automatically resets at ${formatResetTimeLabel(dailyResetCfg.time)} (${dailyResetCfg.timezone})`}
              >
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>Auto-reset: {formatResetTimeLabel(dailyResetCfg.time)} ({formatTimezoneShort(dailyResetCfg.timezone)})</span>
              </span>
            )}
            {onPremiseCode && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-primary/10 border border-primary/20 text-primary">
                <KeyRound className="w-3 h-3" />
                <span>Counter Code: <strong className="font-mono">{onPremiseCode}</strong></span>
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <QueueHealthAlerts businessId={businessId} />
          </div>
        )}
      </div>

      {showDebug && selectedQueue && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">Queue sync debug</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <span>Active queue: {selectedQueue.id}</span>
            <span>Selected queue: {selectedQueue.name}</span>
            <span>Waiting: {syncedStats.waiting}</span>
            <span>Called: {syncedStats.called}</span>
            <span>Realtime: {realtimeStatus}</span>
            <span>Last refresh: {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : "—"}</span>
            <span>Last event: {lastRealtimeEventAt ? new Date(lastRealtimeEventAt).toLocaleTimeString() : "—"}</span>
            <span>Warnings: {consistencyWarnings.length || "none"}</span>
          </div>
        </div>
      )}

      {syncError && !isDemo && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-xs font-medium flex items-center justify-between gap-3">
          <span>Queue sync notice: {syncError}</span>
          <button type="button" onClick={handleRefresh} className="underline font-bold shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Queue tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(() => {
          // Show parent queues, then group child (per-table-size) queues under them.
          const parents = queues.filter((q: any) => !q.parent_queue_id);
          const nodes: any[] = [];
          parents.forEach((q: any) => {
            const stats = getQueueStats(q.id);
            nodes.push(
              <button key={q.id} onClick={() => setSelectedQueueId(q.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedQueue?.id === q.id ? "gradient-bg text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted card-shadow"
                }`}>
                {q.name}
                {q.queue_type === "restaurant" && (
                  <span className="ml-1.5 text-[10px] opacity-70">· share link</span>
                )}
              </button>
            );
            const children = queues
              .filter((c: any) => c.parent_queue_id === q.id)
              .sort((a: any, b: any) => (a.table_size || 0) - (b.table_size || 0));
            children.forEach((c: any) => {
              const cStats = getQueueStats(c.id);
              nodes.push(
                <button key={c.id} onClick={() => setSelectedQueueId(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedQueue?.id === c.id
                      ? "gradient-bg text-primary-foreground border-transparent"
                      : "bg-card text-foreground/80 border-border hover:border-primary/40 card-shadow"
                  }`}>
                  {c.table_size}-seat
                  <span className="ml-1.5 opacity-70">· {cStats.waiting} waiting</span>
                </button>
              );
            });
          });
          return nodes;
        })()}
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> New Queue
        </button>
      </div>

      {selectedQueue ? (
        isClinic && miniMode ? (
          <ClinicCabinMiniMode
            queueName={selectedQueue.name}
            calledVisitor={called[0] || null}
            nextVisitor={waiting[0] || null}
            waitingCount={waiting.length}
            expectedMinutes={selectedQueue.estimated_service_time || 8}
            isPaused={selectedQueue.status === "paused"}
            pauseReason={pauseReason}
            delayMinutes={delayMinutes}
            callingNext={callingNext}
            onCallNext={callNext}
            onRecall={() => called[0] && recallCurrent(called[0])}
            onSendToLab={() => called[0] && sendToLab(called[0])}
            onNoShow={() => called[0] && markNoShow(called[0].id, called[0].token_number)}
            onTogglePause={toggleQueueStatus}
            onExitMiniMode={() => setMiniMode(false)}
          />
        ) : (
        <>
          {isLocalhost && businessId !== "demo-clinic-business" && isClinic && (
            localDemoMode ? (
              <div className="mb-4 px-4 py-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs flex items-center justify-between flex-wrap gap-2">
                <span>
                  🧪 <strong>Localhost Demo Data Active</strong> — sample patients loaded so you can test every clinic feature safely without touching your database.
                </span>
                <div className="flex items-center gap-3 font-semibold">
                  <button type="button" onClick={resetDemoData} className="underline hover:opacity-80">
                    Reset Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalDemoMode(false);
                      setLocalDemoDismissed(true);
                    }}
                    className="underline hover:opacity-80"
                  >
                    Use Real Empty Queue
                  </button>
                </div>
              </div>
            ) : (
              rawVisitors.filter((v) => v.status === "waiting" || v.status === "called").length === 0 && (
                <div className="mb-4 px-4 py-2 rounded-2xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>Real queue is empty right now.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalDemoDismissed(false);
                      setLocalDemoMode(true);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    🧪 Load Localhost Demo Patients
                  </button>
                </div>
              )
            )
          )}

          {isClinic && (
            <ClinicPulseStrip
              servedCount={syncedStats.served}
              calledVisitor={called[0] || null}
              waitingList={waiting}
              expectedMinutes={selectedQueue.estimated_service_time || 8}
              miniMode={miniMode}
              onToggleMiniMode={() => setMiniMode((v) => !v)}
            />
          )}

          {isClinic && (selectedQueue.status === "paused" || delayMinutes > 0) && (
            <div className="mb-5 flex flex-wrap gap-2">
              {selectedQueue.status === "paused" && (
                <div className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-warning-soft border border-warning/30 text-warning text-xs font-semibold flex items-center justify-between">
                  <span>⏸ Queue Paused{pauseReason ? ` · ${pauseReason}` : ""}</span>
                  <button type="button" onClick={toggleQueueStatus} className="underline font-bold">
                    Resume
                  </button>
                </div>
              )}
              {delayMinutes > 0 && (
                <div className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
                  <span>⏱ +{delayMinutes}m Delay Broadcast Active — patient ETAs adjusted</span>
                  <button type="button" onClick={toggleDelay} className="underline font-bold">
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
           <Stat
             icon={<Users className="w-4 h-4" />}
             label={isClinic ? "Patients Waiting" : "Waiting"}
             value={syncedStats.waiting}
             tip={{
               title: isClinic ? "Patients Waiting" : "Waiting",
               description: isClinic ? "Patients currently in queue — not yet called into consultation." : "People currently in line for this queue — not yet called.",
               example: isClinic ? "If 8 patients have registered and none called, this shows 8." : "If 8 customers have joined and none called, this shows 8.",
             }}
           />
           <Stat
             icon={<Phone className="w-4 h-4 text-primary" />}
             label={isClinic ? "In Consultation" : "Currently Serving"}
             value={selectedQueue.current_token ? `#${selectedQueue.current_token}` : "—"}
             accent
             tip={{
               title: isClinic ? "In Consultation" : "Currently Serving",
               description: isClinic ? "The patient token number currently with the doctor." : "The token number you're attending to right now.",
               example: isClinic ? "Shows #16 when patient 16 is in the consultation room." : "Shows #12 when token 12 has been called and not yet served.",
             }}
           />
           <Stat
             icon={<CheckCircle className="w-4 h-4 text-success" />}
             label={isClinic ? "Patients Consulted" : "Served Today"}
             value={syncedStats.served}
             tip={{
               title: isClinic ? "Patients Consulted" : "Served Today",
               description: isClinic ? "Total patients consulted and completed since midnight." : "Total customers marked as served since midnight.",
             }}
           />
           <Stat
             icon={<Clock className="w-4 h-4 text-warning" />}
             label="Avg Wait (min)"
             value={syncedStats.avgWait || "—"}
             tip={{
               title: "Average Wait",
               description: isClinic ? "Average minutes between check-in and consultation today." : "Average minutes between joining the queue and being served today.",
               example: "An 8-minute average means most guests wait about 8 minutes.",
             }}
           />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative">
              <button
                type="button"
                onClick={toggleQueueStatus}
                title={selectedQueue.status === "active" ? "Pause Queue" : "Resume Queue"}
                aria-label={selectedQueue.status === "active" ? "Pause Queue" : "Resume Queue"}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  selectedQueue.status === "active" ? "bg-warning-soft text-warning hover:bg-warning/20" : "bg-success-soft text-success hover:bg-success/20"
                }`}
              >
                {selectedQueue.status === "active" ? <><Pause className="w-4 h-4" /> Pause Queue</> : <><Play className="w-4 h-4" /> Resume Queue</>}
              </button>
              {isClinic && showPausePicker && selectedQueue.status === "active" && (
                <div className="absolute left-0 top-12 z-30 w-56 bg-card border border-border rounded-2xl p-2 card-shadow flex flex-col gap-1">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pause Reason (shown to patients)
                  </p>
                  {PAUSE_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyPauseReason(r.label)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isClinic && (
              <button
                type="button"
                onClick={toggleDelay}
                title="Broadcast a 15-minute delay to waiting patients"
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-[0.98] ${
                  delayMinutes > 0
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                <Clock className="w-4 h-4" /> {delayMinutes > 0 ? `+${delayMinutes}m Delay ON` : "+15m Delay"}
              </button>
            )}
            {!isClinic && (selectedQueue as any).queue_type === "restaurant" ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Serve table:</span>
                {(((selectedQueue as any).table_config as TableSize[] | null) || []).map((t) => (
                  <button
                    key={t.seats}
                    type="button"
                    onClick={() => serveTable(t.seats)}
                    disabled={callingNext}
                    title={`Serve ${t.seats}-seat table`}
                    aria-label={`Serve ${t.seats}-seat table`}
                    className="gradient-bg text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Phone className="w-3.5 h-3.5" /> {t.seats}-seat
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={callNext}
                disabled={callingNext || (selectedQueue.status !== "active" && waiting.length === 0) || (isClinic && waiting.length === 0 && called.length === 0)}
                title={
                  isClinic
                    ? waiting.length === 0 && called.length > 0
                      ? "Complete Consultation"
                      : "Call Next Patient"
                    : "Call Next"
                }
                aria-label={
                  isClinic
                    ? waiting.length === 0 && called.length > 0
                      ? "Complete Consultation"
                      : "Call Next Patient"
                    : "Call Next"
                }
                className="gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isClinic && waiting.length === 0 && called.length > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Complete Consultation
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> {isClinic ? (waiting.length === 0 ? "No Patients Waiting" : "Call Next Patient") : "Call Next"}
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={stopQueue}
              title="Stop Queue"
              aria-label="Stop Queue"
              className="bg-danger-soft text-danger hover:bg-danger/20 active:scale-[0.98] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Stop Queue
            </button>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                title="Start New Day"
                aria-label="Start New Day"
                className="bg-warning-soft text-warning hover:bg-warning/20 active:scale-[0.98] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
              >
                <Sunrise className="w-4 h-4" /> Start New Day
              </button>
              <button
                type="button"
                onClick={() => setShowResetInfo(v => !v)}
                onBlur={() => setTimeout(() => setShowResetInfo(false), 200)}
                title="What does this do?"
                aria-label="About Start New Day"
                className="relative w-8 h-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0"
              >
                <Info className="w-4 h-4" />
                {showResetInfo && (
                  <div className="absolute z-30 top-10 right-0 w-80 text-left bg-card border border-border rounded-xl p-3.5 card-shadow text-xs text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                      <Sunrise className="w-3.5 h-3.5 text-warning" /> Start a fresh business day
                    </p>
                    {dailyResetCfg.enabled && (
                      <div className="mb-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] leading-snug">
                        <strong>⚡ Automated:</strong> Resets automatically every night at {formatResetTimeLabel(dailyResetCfg.time)} ({formatTimezoneShort(dailyResetCfg.timezone)}). No manual action required!
                      </div>
                    )}
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Today's queue is closed and saved to history.</li>
                      <li>A new session begins with token #1.</li>
                      <li>Anyone still waiting is marked as a no-show.</li>
                      <li>All past data stays available in Analytics & History.</li>
                    </ul>
                    <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/80 pt-1.5">
                      Use this manual button only if you want to start a new shift mid-day or test token resetting.
                    </p>
                  </div>
                )}
              </button>
              {dailyResetCfg.enabled && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/40 border border-border px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Auto-resets at {formatResetTimeLabel(dailyResetCfg.time)} ({formatTimezoneShort(dailyResetCfg.timezone)})
                </span>
              )}
            </div>
            <button onClick={() => setShowAddWalkin(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Walk-in
            </button>
            <button onClick={() => setShowQR(true)} className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <QrCode className="w-4 h-4" /> QR Code
            </button>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="bg-card border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Public Display
            </a>
            <a href="/join/vihaan-clinic" target="_blank" rel="noopener noreferrer" className="bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-500/25 transition-all flex items-center gap-2 shadow-sm">
              <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Customer Phone POV</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

          {/* Now Serving */}
          {called.length > 0 && (
            <div className="gradient-bg rounded-2xl p-6 mb-6 text-primary-foreground">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs uppercase tracking-widest opacity-80">
                  {isClinic ? "Currently In Consultation" : "Now Serving"}
                </p>
                {isClinic && called[0] && (
                  <ClinicTimerBadge
                    calledAt={called[0].called_at}
                    expectedMinutes={selectedQueue.estimated_service_time || 8}
                    light
                  />
                )}
              </div>
              {called.map(v => (
                <div key={v.id} className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-3xl font-extrabold">
                        Token <AnimatedNumber value={v.token_number} prefix="#" invertHighlight />
                      </p>
                      {isClinic && v.visitType && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                          {VISIT_TYPE_META[v.visitType].label}
                        </span>
                      )}
                      {isClinic && v.isUrgent && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-100 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-90">{v.visitor_name || (isClinic ? "Patient" : "Guest")}{v.phone ? ` · ${v.phone}` : ""}</p>
                  </div>
                  {isClinic ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-white/15 backdrop-blur px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 opacity-95">
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                        {waiting.length > 0
                          ? "Auto-completes on Next Patient"
                          : "Last patient in queue"}
                      </span>
                      <button
                        type="button"
                        onClick={() => recallCurrent(v)}
                        title="Re-ping TV chime & alert for current patient"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Bell className="w-3.5 h-3.5" /> Re-call
                      </button>
                      <button
                        type="button"
                        onClick={() => sendToLab(v)}
                        title="Park patient for X-ray / Blood test without marking served"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <FlaskConical className="w-3.5 h-3.5" /> Sent to Lab
                      </button>
                      <button
                        type="button"
                        onClick={() => markNoShow(v.id, v.token_number)}
                        title="Mark patient absent without counting as consulted"
                        className="bg-white/15 hover:bg-rose-500/40 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <UserX className="w-3.5 h-3.5" /> No-Show
                      </button>
                      {waiting.length === 0 && (
                        <button
                          type="button"
                          onClick={() => markServed(v.id, v.token_number)}
                          className="bg-white/25 hover:bg-white/35 backdrop-blur px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Complete Consultation
                        </button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => markServed(v.id, v.token_number)} className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Mark Served
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sent for Lab / Returning Patients Tray */}
          {isClinic && labHoldVisitors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-foreground">
                    Sent for Lab / Reports ({labHoldVisitors.length})
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Bring back to Next Up when reports arrive
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {labHoldVisitors.map((lv) => (
                  <div
                    key={lv.id}
                    className="bg-card border border-border rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        #{lv.token_number} {lv.visitor_name || "Patient"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">On hold for tests</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bringBackFromLab(lv)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Bring Back Next
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting list */}
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{isClinic ? "Patients Waiting" : "Waiting List"}</h2>
              <button onClick={() => setShowAddWalkin(true)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" /> {isClinic ? "Add Patient" : "Add Token"}
              </button>
            </div>
            {waiting.length === 0 ? (
              <div className="px-6 py-6">
                <EmptyState
                  compact
                  icon={Users}
                  title={isClinic ? "No patients waiting" : "No one waiting yet"}
                  description={isClinic ? "When a patient arrives and joins the queue, their token number and wait status will appear here." : "Your first customer will unlock live operational insights — wait times, service pace and queue health all populate automatically."}
                  tip={isClinic ? "Patients can scan your clinic QR code at the desk or reception to get a digital token." : "Share or display your queue's QR code at the entrance so walk-ins can join in one tap."}
                />
              </div>
            ) : (selectedQueue as any).queue_type === "restaurant" ? (
              <div className="divide-y divide-border">
                {(() => {
                  const groups = new Map<number, Visitor[]>();
                  waiting.forEach((v) => {
                    const size = (v as any).assigned_table_size ?? 0;
                    const arr = groups.get(size) || [];
                    arr.push(v);
                    groups.set(size, arr);
                  });
                  const sortedSizes = Array.from(groups.keys()).sort((a, b) => a - b);
                  return sortedSizes.map((size) => (
                    <div key={size}>
                      <div className="px-6 py-2 bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {size > 0 ? `${size} Seats` : "Unassigned"} · {groups.get(size)!.length} waiting
                      </div>
                      {groups.get(size)!.map((v) => {
                        const pos = waiting.indexOf(v);
                        const eta = (pos + 1) * (selectedQueue.estimated_service_time || 5);
                        return (
                          <div key={v.id} className="px-6 py-4 flex items-center justify-between border-t border-border">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">#{v.token_number}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {v.visitor_name || "Guest"}
                                  {(v as any).party_size ? <span className="ml-2 text-xs text-muted-foreground">party of {(v as any).party_size}</span> : null}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {v.phone ? `${v.phone} · ` : ""}Joined {new Date(v.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground hidden sm:block">~{eta}m</span>
                              <button
                                type="button"
                                onClick={() => skipVisitor(v.id, v.token_number)}
                                aria-label={`Skip token #${v.token_number}`}
                                title={`Skip token #${v.token_number}`}
                                className="px-2.5 py-1.5 rounded-lg bg-warning-soft text-warning text-xs font-medium hover:bg-warning/20 active:scale-[0.98] transition-all"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVisitor(v.id, v.token_number)}
                                aria-label={`Remove token #${v.token_number}`}
                                title={`Remove token #${v.token_number}`}
                                className="px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 active:scale-[0.98] transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {waiting.map(v => {
                  const pos = waiting.indexOf(v);
                  const eta = (pos + 1) * (selectedQueue.estimated_service_time || 5) + (isClinic ? delayMinutes : 0);
                  return (
                    <div key={v.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          v.isUrgent
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40"
                            : "bg-primary/10 text-primary"
                        }`}>
                          #{v.token_number}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{v.visitor_name || (isClinic ? "Patient" : "Guest")}</p>
                            {isClinic && v.isUrgent && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <Zap className="w-2.5 h-2.5" /> Urgent
                              </span>
                            )}
                            {isClinic && v.visitType && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VISIT_TYPE_META[v.visitType].badgeCls}`}>
                                {VISIT_TYPE_META[v.visitType].short}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {v.phone ? `${v.phone} · ` : ""}Joined {new Date(v.joined_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:block">~{eta}m</span>
                        <button
                          type="button"
                          onClick={() => skipVisitor(v.id, v.token_number)}
                          aria-label={`Skip token #${v.token_number}`}
                          title={`Skip token #${v.token_number}`}
                          className="px-2.5 py-1.5 rounded-lg bg-warning-soft text-warning text-xs font-medium hover:bg-warning/20 active:scale-[0.98] transition-all"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVisitor(v.id, v.token_number)}
                          aria-label={`Remove token #${v.token_number}`}
                          title={`Remove token #${v.token_number}`}
                          className="px-2.5 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-medium hover:bg-danger/20 active:scale-[0.98] transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Insights & Benchmarking */}
          {syncedStats.served + syncedStats.waiting < 5 ? (
            showAIBanner && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Insights & Health Coaching</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Operational forecasting, health scoring, and AI advice will unlock automatically once you serve 5 tokens ({syncedStats.served}/5 completed).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAIBanner(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <div className="space-y-6 mb-6">
              <HealthScoreCard businessId={businessId} />
              <AIInsights insight="queue" mode="business" businessId={businessId} />
              <BusinessBenchmark businessId={businessId} />
              <QueueForecast queueId={selectedQueue.id} audience="business" />
            </div>
          )}

          {selectedQueue && <QueueIntegrityPanel queueId={selectedQueue.id} />}
        </>
        )
      ) : (
        <div className="py-10 bg-card rounded-2xl card-shadow">
          <EmptyState
            icon={Users}
            title="No queues yet"
            description="Spin up your first queue so walk-in customers can join from their phone — no hardware, no paper tokens."
            cta={{ label: "Create your first queue", onClick: () => setShowCreate(true) }}
            tip="Print or display your queue's QR code at the entrance — customers join in one tap."
          />
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create New Queue">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Queue Configuration</label>
            <p className="text-xs text-muted-foreground mb-3">Pick the setup that best matches how you serve customers.</p>
            <div role="radiogroup" aria-label="Queue configuration" className="grid grid-cols-1 gap-2">
              {([
                {
                  k: "single",
                  label: "Single Queue",
                  example: "One shared line — e.g. a barber shop or a small clinic with one counter.",
                },
                {
                  k: "counters",
                  label: "Multiple Counters",
                  example: "Several parallel counters serving the same line — e.g. a bank, post office, or DMV.",
                },
                {
                  k: "seating",
                  label: "Seating Based",
                  example: "Customers grouped by party size — e.g. restaurants and cafés seating 2 / 4 / 6 / 8+.",
                },
                {
                  k: "departments",
                  label: "Department Based",
                  example: "Different services in one place — e.g. hospital OPD, salon (haircut / spa / nails).",
                },
              ] as const).map((opt) => {
                const selected = newQueue.config_mode === opt.k;
                return (
                  <button
                    key={opt.k}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      const isSeating = opt.k === "seating";
                      setNewQueue({
                        ...newQueue,
                        config_mode: opt.k,
                        queue_type: isSeating ? "restaurant" : "standard",
                        table_config: isSeating && newQueue.table_config.length === 0
                          ? [
                              { seats: 2, count: 1 },
                              { seats: 4, count: 1 },
                              { seats: 6, count: 1 },
                              { seats: 8, count: 1 },
                            ]
                          : newQueue.table_config,
                      });
                    }}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 ml-6">{opt.example}</p>
                  </button>
                );
              })}
            </div>
            {(newQueue.config_mode === "counters" || newQueue.config_mode === "departments") && (
              <p className="mt-2 text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
                Tip: create one queue per {newQueue.config_mode === "counters" ? "counter" : "department"} — customers see them all and pick where to join.
              </p>
            )}
          </div>
          <input type="text" placeholder="Queue name (e.g., Main Counter)" value={newQueue.name} onChange={e => setNewQueue({ ...newQueue, name: e.target.value })} className="input" />
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Est. service time (minutes)</label>
            <input type="number" min={1} max={120} value={newQueue.estimated_service_time} onChange={e => setNewQueue({ ...newQueue, estimated_service_time: parseInt(e.target.value) || 5 })} className="input" />
          </div>
          <textarea placeholder="Note (optional)" rows={2} value={newQueue.note} onChange={e => setNewQueue({ ...newQueue, note: e.target.value })} className="input resize-none" />
          {newQueue.queue_type === "restaurant" && (
            <RestaurantTableConfig
              tables={newQueue.table_config}
              onChange={(table_config) => setNewQueue({ ...newQueue, table_config })}
              policy={newQueue.seating_policy}
              onPolicyChange={(seating_policy) => setNewQueue({ ...newQueue, seating_policy })}
              partySizes={newQueue.party_sizes}
              onPartySizesChange={(party_sizes) => setNewQueue({ ...newQueue, party_sizes })}
              partySizeMode={newQueue.party_size_mode}
              onPartySizeModeChange={(party_size_mode) => setNewQueue({ ...newQueue, party_size_mode })}
            />
          )}
          <div className="flex gap-3">
            <button onClick={createQueue} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      {showQR && selectedQueue && (
        <Modal onClose={() => setShowQR(false)} title="Scan to Join Queue">
          <p className="text-sm text-muted-foreground text-center -mt-2">{businessName} · {selectedQueue.name}</p>
          <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-border shadow-sm">
            <QRCodeSVG id="qr-standee-svg" value={joinUrl} size={220} includeMargin />
          </div>
          <p className="text-xs text-muted-foreground break-all text-center select-all bg-muted/40 p-2.5 rounded-lg font-mono">
            {joinUrl}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { hapticCopy(); navigator.clipboard.writeText(joinUrl); toast.success("Link copied!"); }}
                className="flex-1 gradient-bg text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Copy Link
              </button>
              <button
                onClick={() => printQRStandee(businessName, selectedQueue.name, joinUrl, isClinic)}
                className="flex-1 bg-card border border-primary/40 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Standee
              </button>
            </div>
            <button
              onClick={async () => {
                try {
                  toast.loading("Generating 300 DPI Standee...");
                  await downloadStandeePNG({
                    bizName: businessName,
                    queueName: selectedQueue.name,
                    url: joinUrl,
                    isClinic,
                  });
                  toast.dismiss();
                  toast.success("High-Res Standee downloaded!");
                } catch (err: any) {
                  toast.dismiss();
                  toast.error(err?.message || "Failed to download standee");
                }
              }}
              className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download High-Res Standee (PNG for Print)
            </button>
          </div>
        </Modal>
      )}

      {showAddWalkin && (
        <Modal onClose={() => setShowAddWalkin(false)} title={isClinic ? "Add Walk-in Patient" : "Add Walk-in Customer"}>
          <input type="text" placeholder={isClinic ? "Patient Name (optional)" : "Name (optional)"} value={walkinName} onChange={e => setWalkinName(e.target.value)} className="input" />
          <input type="tel" placeholder={isClinic ? "Phone (optional, for alerts)" : "Phone (optional)"} value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} className="input" />
          {isClinic && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Visit Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["new", "followup", "report"] as VisitType[]).map((vt) => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setWalkinVisitType(vt)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        walkinVisitType === vt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {VISIT_TYPE_META[vt].label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Urgent / Priority Case</p>
                    <p className="text-[11px] text-muted-foreground">Places patient directly in Next Up slot</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={walkinUrgent}
                  onChange={(e) => setWalkinUrgent(e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
              </label>
            </div>
          )}
          {selectedQueue && (selectedQueue as any).queue_type === "restaurant" && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Party size *</label>
              <div className="flex flex-wrap gap-2">
                {(((selectedQueue as any).party_sizes as number[] | null) || COMMON_PARTY_SIZES).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWalkinParty(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      walkinParty === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n === 10 ? "10+" : n}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                We'll auto-assign the smallest table that fits.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={addWalkin} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              {isClinic ? (walkinUrgent ? "⚡ Add Urgent Patient" : "Add Patient to Queue") : "Add to Queue"}
            </button>
            <button onClick={() => setShowAddWalkin(false)} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      <ClinicWrapModal
        open={showWrapModal}
        onClose={() => setShowWrapModal(false)}
        clinicName={businessName}
        servedCount={syncedStats.served}
        avgWait={syncedStats.avgWait}
        noShowCount={syncedStats.skipped}
      />

      {showReset && selectedQueue && (
        <Modal onClose={() => !resetting && setShowReset(false)} title="Start a New Day?">
          <div className="flex items-start gap-3 -mt-1">
            <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center shrink-0">
              <Sunrise className="w-5 h-5" />
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              You're about to close today's queue for <span className="font-semibold text-foreground">{selectedQueue.name}</span> and begin a fresh session with Token #1.
            </div>
          </div>
          {dailyResetCfg.enabled && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground space-y-1">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5" /> Note: Daily reset is automated!
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                QBlink already resets this queue every night at <strong>{formatResetTimeLabel(dailyResetCfg.time)} ({formatTimezoneShort(dailyResetCfg.timezone)})</strong>. You only need to click below if you want to reset right now mid-day or for a new shift.
              </p>
            </div>
          )}
          <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1.5">
            <p>✓ Today's data is safely archived for analytics & reports</p>
            <p>✓ Tokens reset to #1 for the new session</p>
            <p>✓ Customers still waiting will be marked as no-show</p>
            <p>✓ History remains accessible from the History page</p>
          </div>
          <div className="flex gap-3">
            <button onClick={startNewDay} disabled={resetting} className="flex-1 gradient-bg text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {resetting ? "Starting…" : "Yes, Start New Day"}
            </button>
            <button onClick={() => setShowReset(false)} disabled={resetting} className="px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          </div>
        </Modal>
      )}

      <style>{`.input{width:100%;padding:0.75rem 1rem;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));color:hsl(var(--foreground));font-size:0.875rem}.input:focus{outline:none;box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}`}</style>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
  accent,
  hint,
  tip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
  hint?: React.ReactNode;
  tip?: { title?: string; description: string; example?: string };
}) => (
  <div className="bg-card rounded-2xl p-5 card-shadow flex flex-col gap-2">
    <div className="flex items-center gap-1.5 text-muted-foreground/80 text-[11px] font-medium uppercase tracking-wide">
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
      {tip && <InfoHint {...tip} ariaLabel={`About ${label}`} />}
    </div>
    <p
      className={`text-3xl md:text-[2rem] leading-none font-extrabold tabular-nums tracking-tight ${
        accent ? "text-primary" : "text-foreground"
      }`}
    >
      {value}
    </p>
    {hint && <div className="text-[11px] text-muted-foreground/80">{hint}</div>}
  </div>
);

const Modal = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-card rounded-2xl p-6 w-full max-w-md card-shadow flex flex-col gap-4 my-4 sm:my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain relative border border-border"
        style={{ WebkitOverflowScrolling: "touch" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Dashboard;
