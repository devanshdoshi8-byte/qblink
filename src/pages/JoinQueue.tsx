import { getOpenState } from "@/lib/operatingHours";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Users, CheckCircle, Loader2, Activity, RefreshCw, UserCircle2, AlertCircle, ArrowLeft, MapPin, LayoutDashboard } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import AIAssistant from "@/components/AIAssistant";
import TrustPrivacyCard from "@/components/TrustPrivacyCard";
import FounderContact from "@/components/FounderContact";
import PrefillNotice from "@/components/PrefillNotice";
import SEO from "@/components/SEO";
import LiveWaitingExperience from "@/components/LiveWaitingExperience";
import BusinessStatusBanner from "@/components/BusinessStatusBanner";
import DynamicWelcomeHeader from "@/components/queue/DynamicWelcomeHeader";
import BusinessHighlightsCard from "@/components/queue/BusinessHighlightsCard";
import LiveActivityFeed from "@/components/queue/LiveActivityFeed";
import QueueTimeline from "@/components/queue/QueueTimeline";
import ContextualTips from "@/components/queue/ContextualTips";
import CustomerTicketShareCard from "@/components/queue/CustomerTicketShareCard";
import { publicUrl } from "@/lib/publicUrl";
import { useCustomerQueueIntel } from "@/hooks/useCustomerQueueIntel";
import QueueForecast from "@/components/QueueForecast";
import SaveBusinessButton from "@/components/SaveBusinessButton";
import SuccessCelebration from "@/components/SuccessCelebration";
import { sendQueueSmsNonBlocking } from "@/lib/sms";
import { hapticJoin, hapticRefresh } from "@/lib/haptics";
import { useAuth } from "@/hooks/useAuth";
import { logEngagement } from "@/lib/receptionImpact";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { TicketLanguagePicker, TurnAlertControls } from "@/components/queue/TicketPreferences";
import { useTurnAlerts } from "@/hooks/useTurnAlerts";
import { OnPremiseConfig } from "@/lib/onPremiseVerification";
import OnPremiseVerificationModal from "@/components/queue/OnPremiseVerificationModal";
import { ticketCopy, type TicketLanguage } from "@/lib/waitingExperience";
import { getSavedCustomerDetails, saveCustomerDetails } from "@/lib/storage/cookieStorage";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { setPending } from "@/lib/auth/pendingAuth";

interface QueueInfo {
  id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  current_token: number | null;
  next_token: number | null;
  note: string | null;
  queue_type?: string | null;
  table_config?: any;
  party_sizes?: number[] | null;
  party_size_mode?: string | null;
  business_id?: string | null;
  parent_queue_id?: string | null;
  table_size?: number | null;
  seating_policy?: string | null;
}

interface BusinessFlags {
  remote_joining_enabled: boolean;
  show_live_queue_info: boolean;
}

const JoinQueue = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const goBack = () => {
    navigate(user ? "/customer-dashboard" : "/");
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("qblink:switchedQueue");
      if (!raw) return;
      const { queueId: qid, queueName } = JSON.parse(raw);
      if (qid === queueId) {
        toast.success(`You're now in ${queueName}`, {
          description: "Confirm your details to grab your token.",
        });
      }
      sessionStorage.removeItem("qblink:switchedQueue");
    } catch {}
  }, [queueId]);

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasCustomerProfile, setHasCustomerProfile] = useState(false);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [joined, setJoined] = useState(false);
  const [myToken, setMyToken] = useState<number | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState<string>("waiting");
  const [language, setLanguage] = useState<TicketLanguage>(() => {
    try { const saved = localStorage.getItem("qb_ticket_language"); return saved === "hi" || saved === "mr" ? saved : "en"; } catch { return "en"; }
  });
  const t = ticketCopy[language];
  const alerts = useTurnAlerts(myStatus, joined);
  const changeLanguage = (value: TicketLanguage) => {
    setLanguage(value);
    try { localStorage.setItem("qb_ticket_language", value); } catch {}
  };
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [waitingCount, setWaitingCount] = useState(0);
  const [aheadCount, setAheadCount] = useState<number | null>(null);
  const [initialAhead, setInitialAhead] = useState<number | null>(null);
  const [nowServingToken, setNowServingToken] = useState<number | null>(null);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const prevStatusRef = useRef<string>("waiting");
  const autoJoinTriggeredRef = useRef(false);
  const [partySize, setPartySize] = useState<number>(2);
  // The queue we actively track live state against. For restaurants this
  // swaps to the child (table-size) queue after joining, so "Now Serving",
  // "Ahead of You" etc. reflect the correct sub-queue.
  const [activeQueueId, setActiveQueueId] = useState<string | undefined>(queueId);
  useEffect(() => { setActiveQueueId(queueId); }, [queueId]);
  const [searchParams] = useSearchParams();
  const [bizFlags, setBizFlags] = useState<BusinessFlags>({
    remote_joining_enabled: true,
    show_live_queue_info: true,
  });
  const [bizAddress, setBizAddress] = useState<string | null>(null);
  const [bizHours, setBizHours] = useState<unknown>(null);
  const [bizName, setBizName] = useState<string>("the business");
  const [bizCategory, setBizCategory] = useState<string | null>(null);
  const [onPremiseConfig, setOnPremiseConfig] = useState<OnPremiseConfig | null>(null);
  const [onPremiseVerified, setOnPremiseVerified] = useState(false);
  const [showOnPremiseModal, setShowOnPremiseModal] = useState(false);
  const openState = getOpenState(bizHours);

  // Parse QR/link query params for frictionless prefill
  const urlName = searchParams.get("name") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlAutoJoin = searchParams.get("autojoin") === "1";
  const urlSize = (() => {
    const raw = searchParams.get("size");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const [sizeLocked, setSizeLocked] = useState<boolean>(urlSize !== null);

  const isHealthcare = useMemo(() => {
    const cat = (bizCategory || "").toLowerCase();
    const qName = (queue?.name || "").toLowerCase();
    const qType = (queue?.queue_type || "").toLowerCase();
    return (
      cat.includes("clinic") ||
      cat.includes("hospital") ||
      cat.includes("health") ||
      cat.includes("doctor") ||
      cat.includes("opd") ||
      qType === "appointment" ||
      qName.includes("dr") ||
      qName.includes("doctor") ||
      qName.includes("clinic")
    );
  }, [bizCategory, queue?.name, queue?.queue_type]);

  // UUID check — demo queues use slugs like "demo-aroma" and can't hit the DB
  const isUuid = (v: string | undefined) =>
    !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const isDemo = !isUuid(queueId);

  // Shared read-only intel layer (one fetch + one realtime channel for all
  // the presentation enhancements below). Never used for queue calculations.
  const intel = useCustomerQueueIntel({
    queueId: activeQueueId ?? queueId ?? null,
    businessId: (queue as any)?.business_id ?? null,
    userId: user?.id ?? null,
    enabled: !isDemo,
  });

  useEffect(() => {
    if (queueId) {
      fetchQueue();
      fetchWaitingCount();
    }
  }, [queueId]);

  // Prefill from cookies/previous session so the user never has to re-enter
  useEffect(() => {
    try {
      const saved = getSavedCustomerDetails();
      if (saved.name) setVisitorName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.name || saved.phone) setPrefilled(true);
    } catch {}
  }, []);

  // Override with URL query params (highest priority — from QR / shared links)
  useEffect(() => {
    if (urlName) { setVisitorName(urlName); setPrefilled(true); }
    if (urlPhone) { setPhone(urlPhone); setPrefilled(true); }
  }, [urlName, urlPhone]);

  // If the share link locks a table size (e.g. per-child QR), pre-select it.
  useEffect(() => {
    if (urlSize) setPartySize(urlSize);
  }, [urlSize]);

  // Auto-join after returning from 1-tap Google OAuth on /join/:queueId?autojoin=1
  useEffect(() => {
    if (autoJoinTriggeredRef.current) return;
    if (searchParams.get("autojoin") !== "1") return;
    if (!user || !profileLoaded || !hasCustomerProfile || !queue) return;
    if (joined || joining || queue.status !== "active") return;
    const isRestaurantNoSize = (queue as any).queue_type === "restaurant" && !urlSize;
    if (isRestaurantNoSize) return;
    autoJoinTriggeredRef.current = true;
    void handleJoin();
  });

  // Restore an account-linked visit after refresh, cross-device navigation, or reopening from My Profile.
  useEffect(() => {
    if (!user || !queueId || isDemo) return;
    let cancelled = false;
    const restore = async () => {
      const { data, error } = await supabase.rpc("get_my_queue_visits", { p_history: false });
      if (cancelled || error) return;
      const visit = data?.find(v => v.join_queue_id === queueId || v.queue_id === queueId);
      if (!visit) return;
      setMyVisitorId(visit.visitor_id);
      setMyToken(visit.token_number);
      setMyStatus(visit.status);
      setActiveQueueId(visit.queue_id);
      setJoinedAt(new Date(visit.joined_at).getTime());
      setJoined(true);
    };
    void restore();
    return () => { cancelled = true; };
  }, [user?.id, queueId, isDemo]);

  // If a customer is logged in, auto-fill from their profile and skip the form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setProfileLoaded(true); return; }
      const { data } = await supabase
        .from("customer_profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      // Always treat logged-in users as having a profile. Fall back to signup
      // metadata (full_name / phone) or email when the profile row is missing,
      // and lazily create the row so it persists for next time.
      const meta: any = user.user_metadata || {};
      const emailLocal = user.email ? user.email.split("@")[0].toLowerCase() : "";
      const looksAuto = (n?: string | null) =>
        !!n && !!emailLocal && n.trim().toLowerCase() === emailLocal;
      const profileName = (data?.full_name as string) || "";
      const metaName: string = meta.full_name || meta.name || "";
      // Pick the best real name. Ignore any name that's just the email prefix
      // (those were autogenerated by older code, not entered by the user).
      let realName = "";
      if (profileName && !looksAuto(profileName)) realName = profileName;
      else if (metaName && !looksAuto(metaName)) realName = metaName;
      const fallbackPhone: string =
        (data?.phone as string) ||
        meta.phone ||
        (user as any).phone ||
        "";
      setPhone(fallbackPhone);
      if (realName) {
        setVisitorName(realName);
        setHasCustomerProfile(true);
        setPrefilled(false);
        // If profile is stale (autogenerated or missing), correct it.
        if (profileName !== realName) {
          supabase
            .from("customer_profiles")
            .upsert(
              { user_id: user.id, full_name: realName, phone: fallbackPhone || null },
              { onConflict: "user_id" }
            )
            .then(() => {});
        }
      } else {
        // No real name on file — ask the user to enter it.
        setVisitorName("");
        setHasCustomerProfile(false);
        setPrefilled(false);
      }
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!activeQueueId || isDemo) return;
    const channel = supabase
      .channel(`join-${activeQueueId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${activeQueueId}` }, () => {
        fetchLiveQueueState(myToken, myVisitorId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "queues", filter: `id=eq.${activeQueueId}` }, () => {
        fetchLiveQueueState(myToken, myVisitorId);
      })
      .subscribe();
    // Polling fallback in case realtime drops
    const poll = setInterval(() => {
      fetchLiveQueueState(myToken, myVisitorId);
    }, joined ? 5000 : 10000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [activeQueueId, myVisitorId, myToken, joined]);

  const refreshNow = () => {
    hapticRefresh();
    toast.success("Refreshed");
    const bizId = (queue as any)?.business_id;
    if (!isDemo) logEngagement(bizId, queueId, "refresh", myVisitorId);
    if (isDemo) {
      fetchQueue();
      fetchWaitingCount();
      return;
    }
    fetchQueue();
    fetchWaitingCount();
    if (myVisitorId) fetchLiveQueueState(myToken, myVisitorId);
  };

  // Trigger when status flips to "called"
  const triggerYourTurn = () => {
    setCelebrate(true);
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]);
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(t.called, {
          body: `${queue?.name ?? "Queue"} · #${myToken}. ${t.proceed}`,
          icon: logo,
        });
      } catch {}
    }
    setTimeout(() => setCelebrate(false), 6000);
  };

  // Gentle success celebration when the user first joins the queue.
  useEffect(() => {
    if (!joined) return;
    setShowJoinSuccess(true);
    const t = setTimeout(() => setShowJoinSuccess(false), 2800);
    return () => clearTimeout(t);
  }, [joined]);

  // Watch myStatus transitions
  useEffect(() => {
    if (prevStatusRef.current !== "called" && myStatus === "called") {
      triggerYourTurn();
    }
    prevStatusRef.current = myStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStatus]);

  const fetchQueue = async () => {
    if (isDemo) {
      const isVihaan = (queueId || "").toLowerCase().includes("vihaan") || (queueId || "").toLowerCase().includes("clinic");
      setQueue({
        id: queueId || "demo-vihaan-clinic",
        name: isVihaan ? "Dr. Ambrish Patange (OPD)" : "Live OPD Queue",
        status: "active",
        estimated_service_time: 12,
        current_token: 14,
        next_token: 15,
        note: "Please take a seat in the waiting area. We will alert your mobile.",
        queue_type: "clinic",
        business_id: "demo-biz-vihaan",
      });
      setBizName(isVihaan ? "Vihaan Health Clinic" : "Community Healthcare OPD");
      setBizCategory("clinic");
      setBizAddress("Malad West, Mumbai");
      setNowServingToken(14);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("queues").select("*").eq("id", queueId!).maybeSingle();
    if (error || !data) {
      // No silent demo fallback: a real link that fails must surface the real state.
      if (error) console.error("Qblink: queue load failed", error.message);
      setQueue(null);
      setNowServingToken(null);
      setLoading(false);
      return;
    }
    setQueue(data);
    setNowServingToken(typeof data.current_token === "number" && data.current_token > 0 ? data.current_token : null);
    setLoading(false);
    if ((data as any)?.business_id) {
      logEngagement((data as any).business_id, data.id, "page_view", null, 60000);
      const { data: biz } = await (supabase as any)
        .from("businesses_public")
        .select("name, category, remote_joining_enabled, show_live_queue_info, address, operating_hours, settings")
        .eq("id", (data as any).business_id)
        .maybeSingle();
      if (biz) {
        setBizFlags({
          remote_joining_enabled: (biz as any).remote_joining_enabled ?? true,
          show_live_queue_info: (biz as any).show_live_queue_info ?? true,
        });
        setBizAddress((biz as any).address ?? null);
        setBizHours((biz as any).operating_hours ?? null);
        setBizName((biz as any).name || "the business");
        setBizCategory((biz as any).category ?? null);
        const bSettings = (biz as any).settings || {};
        if (bSettings.on_premise_joining) {
          setOnPremiseConfig(bSettings.on_premise_joining);
        }
      }
    }
  };

  const fetchWaitingCount = async () => {
    if (isDemo) {
      setWaitingCount(3);
      return;
    }
    const { count, error } = await supabase
      .from("queue_visitors_public" as any)
      .select("*", { count: "exact", head: true })
      .eq("queue_id", activeQueueId ?? queueId!)
      .eq("status", "waiting");
    // Real queue: trust the live count even when it's 0. Never substitute demo numbers.
    if (error) console.error("Qblink: waiting count failed", error.message);
    setWaitingCount(typeof count === "number" ? count : 0);
  };

  const fetchMyStatus = async () => {
    if (!myVisitorId) return;
    const { data } = await (supabase as any).from("queue_visitors_public").select("status, token_number").eq("id", myVisitorId).maybeSingle();
    if (data) {
      setMyStatus(data.status as string);
      if (data.status === "called") toast.info("🔔 It's your turn! Please proceed.");
    }
  };

  const fetchLiveQueueState = async (
    tokenOverride = myToken,
    visitorIdOverride = myVisitorId,
    qidOverride?: string,
  ) => {
    const qid = qidOverride ?? activeQueueId;
    if (!qid || isDemo) {
      await fetchQueue();
      await fetchWaitingCount();
      return;
    }

    const [{ data: queueData }, { data: visitorRows }] = await Promise.all([
      supabase.from("queues").select("*").eq("id", qid).maybeSingle(),
      (supabase as any)
        .from("queue_visitors_public")
        .select("id,queue_id,token_number,status,joined_at,called_at")
        .eq("queue_id", qid)
        .order("token_number", { ascending: true }),
    ]);

    if (queueData) {
      // For restaurant children keep the customer-facing name friendly.
      setQueue((prev) => ({ ...(prev as QueueInfo), ...(queueData as QueueInfo) }));
    }
    if ((queueData as any)?.business_id && visitorIdOverride) {
      logEngagement((queueData as any).business_id, qid, "status_check", visitorIdOverride, 30000);
    }

    const rows = (visitorRows || []) as Array<{
      id: string;
      token_number: number | null;
      status: string | null;
      called_at: string | null;
    }>;
    const waitingRows = rows.filter((v) => v.status === "waiting" && typeof v.token_number === "number");
    const firstWaitingToken = waitingRows[0]?.token_number ?? null;
    const calledToken = rows
      .filter((v) => (v.status === "called" || v.status === "serving") && typeof v.token_number === "number")
      .sort((a, b) => new Date(b.called_at || 0).getTime() - new Date(a.called_at || 0).getTime())[0]?.token_number ?? null;
    const queueCurrent = typeof queueData?.current_token === "number" && queueData.current_token > 0 ? queueData.current_token : null;
    const inferredCounterToken = typeof firstWaitingToken === "number" ? firstWaitingToken : null;
    const servingToken = queueCurrent ?? calledToken ?? inferredCounterToken;

    setNowServingToken(servingToken ?? null);
    setWaitingCount(waitingRows.length);

    const mine = visitorIdOverride ? rows.find((v) => v.id === visitorIdOverride) : null;
    if (mine?.status) setMyStatus(mine.status);
    const token = tokenOverride ?? mine?.token_number ?? null;
    if (typeof token === "number") {
      const ahead = mine?.status && mine.status !== "waiting"
        ? 0
        : waitingRows.filter((v) => {
          const n = v.token_number as number;
          return n < token && (!servingToken || n > servingToken);
        }).length;
      setAheadCount(ahead);
      setInitialAhead((prev) => (prev == null || prev < ahead ? ahead : prev));
    }
  };

  // Single source of truth for "people ahead": count waiting visitors with smaller token
  const fetchAhead = async () => {
    if (!myToken || isDemo) return;
    const { count } = await (supabase as any)
      .from("queue_visitors_public")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", activeQueueId ?? queueId!)
      .eq("status", "waiting")
      .lt("token_number", myToken);
    setAheadCount(count ?? 0);
  };

  const handleJoin = async (forceVerified?: boolean) => {
    setJoinError(null);
    if (!queue) return;
    const clearRememberedQueue = () => {
      const bizId = (queue as any)?.business_id;
      if (!bizId) return;
      try {
        const raw = localStorage.getItem("qblink:selectedQueueByBiz");
        if (!raw) return;
        const map = JSON.parse(raw);
        if (map && map[bizId]) {
          delete map[bizId];
          localStorage.setItem("qblink:selectedQueueByBiz", JSON.stringify(map));
        }
      } catch {}
    };
    const isRestaurant = (queue as any).queue_type === "restaurant";
    if (isRestaurant) {
      if (!partySize || partySize < 1) {
        setJoinError("Please enter your party size.");
        return;
      }
      const sizes = ((queue.table_config as any[]) || [])
        .map((t) => Number(t?.seats) || 0)
        .filter((n) => n > 0);
      const maxSeats = sizes.length ? Math.max(...sizes) : 0;
      if (maxSeats > 0 && partySize > maxSeats) {
        setJoinError(`Sorry, we don't have a table that fits ${partySize} guests. The largest table seats ${maxSeats}.`);
        return;
      }
    }
    // Logged-in customers: use their account details, no form required.
    // Guest joiners (QR scan): require name + phone unless the business
    // disabled it (direct 1-tap join).
    const requireDetails = (queue as any).require_customer_details !== false;
    if (!hasCustomerProfile && requireDetails) {
      if (!visitorName.trim() || !phone.trim()) {
        setJoinError("Please enter both your name and phone number to get a token.");
        return;
      }
    } else if (!visitorName.trim()) {
      // Extreme fallback — should never happen since we always set a name.
      setVisitorName("Customer");
    }
    try {
      if (visitorName.trim() || phone.trim()) {
        saveCustomerDetails({ name: visitorName.trim(), phone: phone.trim() });
      }
    } catch {}
    const requiresOnPremise = !bizFlags.remote_joining_enabled && Boolean(onPremiseConfig?.enabled);
    if (requiresOnPremise && !onPremiseVerified && !forceVerified) {
      setShowOnPremiseModal(true);
      return;
    }
    setJoining(true);

    const tokenNum = queue.next_token || 1;

    // Demo / non-UUID queues: simulate a successful join without hitting the DB
    if (isDemo) {
      setMyToken(tokenNum);
      setMyVisitorId(`demo-${Date.now()}`);
      setAheadCount(waitingCount);
      setInitialAhead(waitingCount);
      setJoinedAt(Date.now());
      setJoined(true);
      setJoining(false);
      hapticJoin();
      clearRememberedQueue();
      return;
    }

    const rpcArgs: any = {
      p_queue_id: queue.id,
      p_visitor_name: (visitorName.trim() || "Guest").slice(0, 100),
      p_phone: phone.trim().slice(0, 20) || null,
    };
    let data: any = null;
    let error: any = null;
    if (user) {
      const res = await supabase.rpc("join_customer_queue", {
        ...rpcArgs,
        p_party_size: isRestaurant ? partySize : null,
      });
      data = res.data; error = res.error;
    } else if (isRestaurant) {
      const res = await supabase.rpc("join_restaurant_queue" as any, {
        p_parent_queue_id: queue.id,
        p_table_size: partySize,
        p_visitor_name: rpcArgs.p_visitor_name,
        p_phone: rpcArgs.p_phone,
      });
      data = res.data; error = res.error;
    } else {
      const res = await supabase.rpc("join_queue", rpcArgs);
      data = res.data; error = res.error;
    }

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      const raw = (error?.message || "").toLowerCase();
      let msg = "We couldn't add you to this queue. Please try again.";
      if (raw.includes("not active") || raw.includes("paused")) msg = "This queue is paused right now. Please try again shortly.";
      else if (raw.includes("not found")) msg = "This queue link is no longer valid. Ask the business for a new one.";
      else if (raw.includes("network") || raw.includes("fetch")) msg = "Network issue. Check your connection and try again.";
      else if (raw.includes("too long")) msg = "Your name or phone number is too long. Please shorten and retry.";
      else if (raw.includes("no suitable table") || raw.includes("not available right now")) msg = `Sorry, no ${partySize}-person tables are available right now.`;
      else if (raw.includes("select a table size") || raw.includes("party size required")) msg = "Please pick your table size.";
      else if (raw.includes("already in this queue")) msg = "You're already in this queue.";
      else if (raw.includes("wait a moment") || raw.includes("wait before rejoining")) msg = "Please wait a moment before rejoining this queue.";
      setJoinError(msg);
      toast.error(msg);
      setJoining(false);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    setMyToken(row.token_number);
    setMyVisitorId(row.id);
    // Restaurant joins land in a child queue — follow it for live updates.
    if (isRestaurant && row.child_queue_id) {
      setActiveQueueId(row.child_queue_id);
    }
    setJoined(true);
    setJoining(false);
    setJoinedAt(Date.now());
    hapticJoin();
    clearRememberedQueue();

    // Trigger non-blocking SMS confirmation if phone was provided
    if (phone.trim() && (queue as any)?.business_id) {
      sendQueueSmsNonBlocking({
        businessId: (queue as any).business_id,
        tokenId: row.id,
        phone: phone.trim(),
        eventType: "TOKEN_ISSUED",
        clinicName: bizName || queue.name,
        tokenNumber: row.token_number,
        etaMinutes: (waitingCount + 1) * (queue.estimated_service_time || 5),
      });
    }
    // Persist the real name/phone for logged-in users so we never fall back
    // to the email prefix again.
    if (user) {
      supabase
        .from("customer_profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: visitorName.trim().slice(0, 100),
            phone: phone.trim().slice(0, 20) || null,
          },
          { onConflict: "user_id" }
        )
        .then(() => {});
      // Bump favorite "last used" so this business floats to the top of My Favorites.
      const bizId = (queue as any)?.business_id;
      if (bizId) {
        (supabase as any)
          .from("customer_favorites")
          .update({ last_used_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("business_id", bizId)
          .then(() => {});
      }
    }
    // Fetch authoritative queue state after join
    setTimeout(() => {
      fetchLiveQueueState(
        row.token_number,
        row.id,
        isRestaurant && row.child_queue_id ? row.child_queue_id : undefined,
      );
    }, 100);
  };

  // ====== SINGLE SOURCE OF TRUTH — derived state ======
  // All user-facing numbers come from this one function. No other place computes them.
  const derived = () => {
    const serviceTime = queue?.estimated_service_time || 5;
    // Authoritative "ahead" = number of waiting visitors with smaller token than mine.
    // Falls back to waitingCount snapshot until the live count loads.
    const ahead = aheadCount ?? waitingCount;
    return {
      ahead,
      waitMinutes: ahead * serviceTime,
      liveStatus: ahead === 0 ? "You're next" : "Moving",
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <BackButton to={user ? "/customer-dashboard" : "/"} />
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!queue) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <BackButton to={user ? "/customer-dashboard" : "/"} />
      <div className="text-center">
        <img src={logo} alt="Qblink" className="h-12 w-12 rounded-lg object-contain mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Queue not found</h1>
        <p className="text-muted-foreground text-sm">This queue may have been closed or the link is invalid.</p>
      </div>
    </div>
  );

  if (queue.status !== "active" && !joined) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <BackButton to={user ? "/customer-dashboard" : "/"} />
      <div className="text-center">
        <img src={logo} alt="Qblink" className="h-12 w-12 rounded-lg object-contain mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">
          {queue.status === "closed" ? "Queue Closed" : "Queue Paused"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {queue.status === "closed"
            ? "This queue has been closed for now. Please check back later."
            : "This queue is currently not accepting new entries. Keep this page open — it updates live."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-3 sm:py-8">
      <SEO
        title={`Join ${queue.name} — Qblink`}
        description={`Join the live queue for ${queue.name}. Track your spot and wait time from your phone.`}
        path={`/join/${queueId}`}
      />
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-primary/20 backdrop-blur-sm animate-in fade-in duration-300" />
          {/* Floating emoji confetti */}
          {Array.from({ length: 24 }).map((_, i) => {
            const emojis = ["🎉", "✨", "🎊", "🔔", "⭐", "🥳", "💫"];
            const e = emojis[i % emojis.length];
            const left = (i * 4.2) % 100;
            const delay = (i % 8) * 0.12;
            const dur = 2.4 + (i % 5) * 0.4;
            return (
              <span
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${left}%`,
                  top: "-10%",
                  animation: `qb-fall ${dur}s ease-in ${delay}s forwards`,
                }}
              >
                {e}
              </span>
            );
          })}
          <div className="relative bg-card rounded-3xl px-8 py-10 card-shadow text-center max-w-xs mx-4 animate-in zoom-in-50 duration-500">
            <div className="text-6xl mb-3 animate-bounce">🔔</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-1">{t.called}</h2>
            <p className="text-sm text-foreground mb-3">{t.proceed}</p>
            <p className="text-4xl font-extrabold text-foreground">#{myToken}</p>
          </div>
          <style>{`
            @keyframes qb-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      <div className="w-full max-w-sm">
        {isDemo && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Link
              to="/dashboard?demo=true"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Doctor Dashboard (Business POV)</span>
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              Customer POV
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={goBack}
            aria-label={t.back}
            className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border shadow-sm px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.back}</span>
          </Button>
          <TicketLanguagePicker language={language} onChange={changeLanguage} />
        </div>

        <div className="text-center mb-4">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain mx-auto mb-2" />
          <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {isHealthcare ? "Clinic OPD" : (bizCategory ? bizCategory.slice(0, 20) : "Live Queue")}
            </span>
            {openState.status !== "unknown" && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                openState.status === "open"
                  ? "bg-success-soft text-success"
                  : openState.status === "holiday"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
              }`}>
                {openState.status === "open" ? "● Open" : openState.label}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{queue.name}</h1>
          {bizAddress && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[280px]">{bizAddress}</span>
            </p>
          )}
          {queue.note && <p className="text-xs text-muted-foreground mt-1">{queue.note}</p>}
        </div>

        {!joined ? (
          <div className="bg-card rounded-2xl p-4 sm:p-6 card-shadow">
            {!bizFlags.remote_joining_enabled && onPremiseConfig?.enabled && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 mb-4 text-xs flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">On-Premise Verification Active</p>
                  <p className="text-muted-foreground mt-0.5">
                    Remote joining is off. A 1-time location check (250m) or counter code is required when you join.
                  </p>
                </div>
              </div>
            )}
            {bizFlags.show_live_queue_info ? (
              <div className="flex justify-between mb-5 bg-muted/30 border border-border/40 rounded-xl py-3 px-4">
                <div className="text-center flex-1 border-r border-border/40">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-0.5"><Users className="w-3.5 h-3.5" /> In queue</div>
                  <p className="text-2xl font-bold text-foreground">{waitingCount}</p>
                </div>
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-0.5"><Clock className="w-3.5 h-3.5" /> Est. wait</div>
                  <p className="text-2xl font-bold text-foreground">{waitingCount * (queue.estimated_service_time || 5)}m</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/40 p-3 mb-5 text-center text-xs text-muted-foreground">
                Queue status available upon arrival.
              </div>
            )}

            {isHealthcare && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs font-semibold text-primary">
                  Get your digital OPD token in one tap — we'll alert you before your turn.
                </p>
              </div>
            )}

            {openState.status === "closed" || openState.status === "holiday" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-center">
                  <p className="text-sm font-semibold text-warning">
                    {openState.status === "holiday" ? "Closed for holiday" : "Currently closed"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{openState.detail}</p>
                </div>
                <a
                  href={bizAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}` : "#"}
                  target={bizAddress ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => { if (!bizAddress) e.preventDefault(); }}
                  className="w-full inline-flex items-center justify-center bg-card border border-primary/40 text-primary py-3.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Visit Business
                </a>
                <p className="text-[11px] text-muted-foreground text-center">
                  You can join the queue once this business reopens.
                </p>
              </div>
            ) : !bizFlags.remote_joining_enabled && !onPremiseConfig?.enabled ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                  Remote joining is currently unavailable.
                </div>
                <a
                  href={bizAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizAddress)}` : "#"}
                  target={bizAddress ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => { if (!bizAddress) e.preventDefault(); }}
                  className="w-full inline-flex items-center justify-center bg-card border border-primary/40 text-primary py-3.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  Visit Business
                </a>
                <p className="text-[11px] text-muted-foreground text-center">
                  Please visit in person to join the queue.
                </p>
              </div>
            ) : hasCustomerProfile ? (
              <>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-5 flex items-center gap-2.5">
                  <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Joining as</p>
                    <p className="text-sm font-semibold text-foreground truncate">{visitorName}</p>
                  </div>
                </div>
                {joinError && (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-4 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium leading-snug">{joinError}</p>
                  </div>
                )}
                {!isHealthcare && (queue as any).queue_type === "restaurant" && (
                  <PartySizeField
                    value={partySize}
                    onChange={setPartySize}
                    options={deriveJoinPartySizes(queue)}
                    locked={sizeLocked}
                    onUnlock={() => setSizeLocked(false)}
                  />
                )}
                <button onClick={() => void handleJoin()} disabled={joining || !profileLoaded}
                  className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
                  {joining ? "Joining..." : "Join Queue"}
                </button>
              </>
            ) : (
              <>
                {user && profileLoaded && (
                  <div className="rounded-xl border border-warning/50 bg-warning-soft p-3 mb-4 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-warning font-semibold leading-snug">No customer profile found on your account.</p>
                      <p className="text-[11px] text-warning/80 leading-snug mt-0.5">Enter your details below — we'll save them for next time.</p>
                    </div>
                  </div>
                )}
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-2.5 sm:p-3 mb-3">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">How it works</p>
                  <ol className="text-xs text-foreground/80 space-y-1 list-decimal list-inside">
                    <li>{(queue as any).require_customer_details === false ? "Tap the button below to get your token instantly." : "Enter your name and phone to get a token."}</li>
                    <li>Track your live position — no need to stay in line.</li>
                    <li>You'll be alerted when it's your turn.</li>
                  </ol>
                </div>
                {!user && (
                  <div className="mb-4 space-y-2.5">
                    <GoogleSignInButton
                      disabled={joining}
                      onBeforeOAuth={() => {
                        setJoinError(null);
                        setPending("role", "customer");
                        setPending("next", `/join/${queueId}?autojoin=1`);
                      }}
                      onError={(msg) => setJoinError(msg)}
                    />
                    <p className="text-[11px] text-center text-muted-foreground">
                      1-tap join &amp; save your visit history — no password needed.
                    </p>
                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-border" />
                      <span className="mx-3 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        or join as guest
                      </span>
                      <div className="flex-grow border-t border-border" />
                    </div>
                  </div>
                )}
                {(hasCustomerProfile || (queue as any).require_customer_details !== false) && (
                <div className="space-y-3 mb-4">
                  <PrefillNotice
                    visible={prefilled}
                    onClear={() => { setVisitorName(""); setPhone(""); setPrefilled(false); }}
                    onUpdate={(n, p) => { setVisitorName(n); setPhone(p); setPrefilled(true); }}
                  />
                  <input type="text" required placeholder="Your name *" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="tel" required placeholder="Phone *" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                )}
                {joinError && (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-3 flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium leading-snug">{joinError}</p>
                  </div>
                )}
                {!isHealthcare && (queue as any).queue_type === "restaurant" && (
                  <PartySizeField
                    value={partySize}
                    onChange={setPartySize}
                    options={deriveJoinPartySizes(queue)}
                    locked={sizeLocked}
                    onUnlock={() => setSizeLocked(false)}
                  />
                )}
                <button onClick={() => void handleJoin()} disabled={joining}
                  className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {joining ? "Joining..." : "Join Queue"}
                </button>
                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  Have an account?{" "}
                  <Link to={`/auth/signin?next=/join/${queueId}`} className="text-primary font-semibold hover:underline">Sign in</Link> to skip this.
                  <br />
                  New here?{" "}
                  <Link to={`/auth/customer?next=/join/${queueId}`} className="text-primary font-semibold hover:underline">Create account</Link>
                </p>
              </>
            )}
          </div>
        ) : null}

        {!joined && (
          <div className="mt-4 space-y-4">
            <BusinessStatusBanner
              queueId={activeQueueId ?? queueId ?? null}
              queueStatus={queue.status}
              expectedServiceMinutes={queue.estimated_service_time || 5}
              callTimes={intel.callTimes}
              waiting={intel.pulse?.waiting ?? waitingCount}
              hasData={intel.ready}
            />
            {bizFlags.show_live_queue_info && (
              <BusinessHighlightsCard
                rating={intel.highlights?.rating}
                totalReviews={intel.highlights?.total_reviews}
                pulse={intel.pulse}
                loading={!intel.ready}
              />
            )}
            {!isDemo && (queue as any).business_id && (
              <div className="flex justify-center pt-1">
                <SaveBusinessButton
                  businessId={(queue as any).business_id}
                  businessName={queue.name}
                />
              </div>
            )}
          </div>
        )}

        {!joined && !isDemo && (activeQueueId || queueId) && bizFlags.show_live_queue_info && (
          <div className="mt-4">
            <QueueForecast queueId={(activeQueueId ?? queueId)!} audience="customer" />
          </div>
        )}

        {joined && (
          <div lang={language} className="bg-card rounded-2xl p-5 card-shadow text-center">
            <SuccessCelebration token={myToken} visible={showJoinSuccess} />
            <TurnAlertControls language={language} alerts={alerts} />
            {myStatus === "called" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">{t.called}</h2>
                <p className="text-6xl font-extrabold text-foreground mb-2 break-all">#{myToken}</p>
                <p className="text-sm text-foreground">{t.proceed}</p>
                <Button
                  type="button"
                  onClick={async () => {
                    if (!myVisitorId) return;
                    const { error } = await (supabase as any).rpc("check_in_visitor", { p_visitor_id: myVisitorId });
                    if (error) return toast.error(error.message || "Check-in failed");
                    toast.success(t.checkedInToast);
                  }}
                  className="mt-4 h-auto min-h-11 whitespace-normal inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-primary-foreground text-sm font-semibold hover:opacity-90"
                  aria-label="Confirm arrival and check in"
                >
                  <CheckCircle className="w-4 h-4" /> {t.arrived}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {t.checkSoon}
                </p>
              </>
            ) : myStatus === "served" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t.served}</h2>
                <p className="text-sm text-muted-foreground">{t.thanks}</p>
              </>
            ) : myStatus === "skipped" ? (
              <>
                <h2 className="text-xl font-bold text-warning mb-2">{t.skipped}</h2>
                <p className="text-sm text-muted-foreground">{t.skippedNote}</p>
              </>
            ) : (
              <>
                {(() => {
                  const d = derived();
                  return (
                    <>
                      <LiveWaitingExperience
                        language={language}
                        ahead={d.ahead}
                        waitMinutes={d.waitMinutes}
                        liveStatus={d.liveStatus}
                        myToken={myToken}
                        nowServing={nowServingToken}
                        serviceTime={queue.estimated_service_time || 5}
                        onRefresh={refreshNow}
                        initialAhead={initialAhead ?? undefined}
                        joinedAt={joinedAt ?? undefined}
                        remoteJoiningEnabled={bizFlags.remote_joining_enabled}
                      />
                      <CustomerTicketShareCard
                        minutesSaved={Math.max(1, joinedAt ? Math.round((Date.now() - joinedAt) / 60000) : (initialAhead && initialAhead > d.ahead ? (initialAhead - d.ahead) * (queue.estimated_service_time || 5) : 5))}
                        ticketUrl={(activeQueueId ?? queueId) ? publicUrl(`/join/${activeQueueId ?? queueId}`) : (typeof window !== "undefined" ? window.location.href : "")}
                        businessName={queue.name}
                        token={myToken}
                        ahead={d.ahead}
                        waitMinutes={d.waitMinutes}
                        language={language}
                        className="mt-4"
                      />
                      <QueueTimeline
                        language={language}
                        tokens={intel.tokens}
                        myToken={myToken}
                        nowServing={nowServingToken}
                        loading={!intel.ready}
                        className="mt-4"
                      />
                      <LiveActivityFeed events={intel.activity} loading={!intel.ready} className="mt-4" language={language} />
                      <div className="mt-4 bg-info-soft border border-info/30 rounded-xl p-3 text-left">
                        <p className="text-xs text-info">
                          💡 {t.arriveTip}
                        </p>
                      </div>
                      <ContextualTips
                        pulse={intel.pulse}
                        ahead={d.ahead}
                        waitMinutes={d.waitMinutes}
                        serviceTime={queue.estimated_service_time || 5}
                        callTimes={intel.callTimes}
                        className="mb-4"
                      />
                      <TrustPrivacyCard />
                      <AIAssistant
                        mode="queue_companion"
                        queueContext={{
                          user_position: d.ahead,
                          estimated_wait_time: d.waitMinutes,
                          now_serving: nowServingToken,
                          user_token: myToken,
                          business_name: queue.name,
                        }}
                      />
                      <div className="mt-6 pb-24">
                        <FounderContact compact />
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <a href="/" className="text-primary hover:underline">Qblink</a>
        </p>
        {showOnPremiseModal && onPremiseConfig && (
          <OnPremiseVerificationModal
            isOpen={showOnPremiseModal}
            onClose={() => setShowOnPremiseModal(false)}
            queueId={activeQueueId ?? queueId!}
            businessName={bizName}
            config={onPremiseConfig}
            onVerified={() => {
              setOnPremiseVerified(true);
              setShowOnPremiseModal(false);
              handleJoin(true);
            }}
          />
        )}
        <p className="hidden">
        </p>
      </div>
    </div>
  );
};

export default JoinQueue;

const DEFAULT_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 8, 10];
const FLEXIBLE_PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7];

// What party sizes should the customer see when joining a restaurant?
//  - Flexible (default): every-day party sizes (1..7+). The system auto-routes
//    them to the smallest available table that fits.
//  - Strict: only sizes the restaurant explicitly seats.
const deriveJoinPartySizes = (queue: any): number[] => {
  const policy = (queue?.seating_policy as string) || "flexible";
  const tables = (queue?.table_config as Array<{ seats: number; count: number }> | null) || [];
  const fromTables = Array.from(
    new Set(
      tables
        .filter((t) => (t?.count ?? 0) > 0 && (t?.seats ?? 0) > 0)
        .map((t) => Number(t.seats)),
    ),
  ).sort((a, b) => a - b);
  if (policy === "strict") {
    if (fromTables.length) return fromTables;
    const configured = (queue?.party_sizes as number[] | null) || [];
    return configured.length ? configured : DEFAULT_PARTY_SIZES;
  }
  // Flexible mode: show simple everyday party sizes regardless of internal seats.
  return FLEXIBLE_PARTY_SIZES;
};

const PartySizeField = ({
  value,
  onChange,
  options,
  locked,
  onUnlock,
}: {
  value: number;
  onChange: (n: number) => void;
  options?: number[] | null;
  locked?: boolean;
  onUnlock?: () => void;
}) => {
  const sizes = (options && options.length ? options : DEFAULT_PARTY_SIZES)
    .slice()
    .sort((a, b) => a - b);
  // Ensure current value is one of the configured chips; default to smallest.
  useEffect(() => {
    if (locked) return;
    if (!sizes.includes(value)) onChange(sizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes.join(","), locked]);

  if (locked) {
    return (
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Party size</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            Party size: {value} {value === 1 ? "guest" : "guests"}
          </p>
        </div>
        {onUnlock && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUnlock}
            className="text-xs h-7 px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
          >
            Change
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="text-sm font-semibold text-foreground mb-2 block">
        How many people are joining today? <span className="text-destructive">*</span>
      </label>
      <p className="text-xs text-muted-foreground mb-2">
        Just tell us your party size — we'll match you with the right table.
      </p>
      <div
        role="radiogroup"
        aria-label="Party size"
        className="flex flex-wrap gap-2"
      >
        {sizes.map((n) => {
          const active = value === n;
          const isMax = n === Math.max(...sizes);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={`min-w-[52px] px-4 py-3 rounded-xl text-base font-semibold border transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground/80 hover:text-foreground hover:border-primary/40"
              }`}
            >
              {isMax && n >= 7 ? `${n}+` : n}
            </button>
          );
        })}
      </div>
    </div>
  );
};
