import { getOpenState } from "@/lib/operatingHours";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Search, Star, Users, LogOut, MapPin, ArrowLeft, ArrowRight, UtensilsCrossed, X, Clock, Zap } from "lucide-react";
import { SkeletonCardGrid, SkeletonStatGrid, SkeletonPageHeader } from "@/components/skeletons/DashboardSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import logo from "@/assets/qblink-logo.png";
import { CATEGORIES, getCategoryForBusiness, getCategoryByKey } from "@/lib/categories";
import AIAssistant from "@/components/AIAssistant";
import FavoriteBusinesses from "@/components/FavoriteBusinesses";
import NotificationBell from "@/components/customer/NotificationBell";
import UpcomingAppointments from "@/components/customer/UpcomingAppointments";
import CustomerAnalyticsBento from "@/components/customer/CustomerAnalyticsBento";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface Business {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  address: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_recommended: boolean | null;
  is_featured?: boolean | null;
  is_sponsored?: boolean | null;
  display_rank?: number | null;
  discovery_enabled?: boolean | null;
  remote_joining_enabled?: boolean | null;
  show_live_queue_info?: boolean | null;
  operating_hours?: unknown;
}

interface QueueInfo {
  business_id: string;
  queue_id: string;
  status: string;
  est_time: number;
  waiting: number;
}

interface QueueOption {
  id: string;
  name: string;
  status: string;
  est_time: number;
  waiting: number;
}

const CustomerDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [queueMap, setQueueMap] = useState<Record<string, QueueInfo>>({});
  const [queuesByBiz, setQueuesByBiz] = useState<Record<string, QueueOption[]>>({});
  const [pickerBiz, setPickerBiz] = useState<Business | null>(null);
  const [selectedQueueByBiz, setSelectedQueueByBiz] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("qblink:selectedQueueByBiz") || "{}");
    } catch { return {}; }
  });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth/signin");
    if (!roleLoading && user && role === "business") navigate("/dashboard");
  }, [user, role, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("customer_profiles").select("full_name").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => data?.full_name && setProfileName(data.full_name));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("customer-businesses")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const rememberQueue = (businessId: string, queueId: string) => {
    setSelectedQueueByBiz(prev => {
      const next = { ...prev, [businessId]: queueId };
      try {
        localStorage.setItem("qblink:selectedQueueByBiz", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "qblink:selectedQueueByBiz") return;
      try {
        setSelectedQueueByBiz(JSON.parse(e.newValue || "{}"));
      } catch {
        setSelectedQueueByBiz({});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Auto-fallback: if the remembered queue for any business is no longer
  // active (closed/paused by staff), drop the remembered selection and let
  // the UI fall back to the first active queue. Notify the user once.
  useEffect(() => {
    const stale: string[] = [];
    Object.entries(selectedQueueByBiz).forEach(([bizId, qid]) => {
      const list = queuesByBiz[bizId];
      if (!list || list.length === 0) return; // not loaded yet
      const stillActive = list.some(x => x.id === qid && x.status === "active");
      if (!stillActive) stale.push(bizId);
    });
    if (stale.length === 0) return;
    setSelectedQueueByBiz(prev => {
      const next = { ...prev };
      stale.forEach(id => delete next[id]);
      try { localStorage.setItem("qblink:selectedQueueByBiz", JSON.stringify(next)); } catch {}
      return next;
    });
    stale.forEach(bizId => {
      const biz = businesses.find(b => b.id === bizId);
      const fallback = (queuesByBiz[bizId] || []).find(x => x.status === "active");
      if (fallback) {
        toast.info(`Switched to ${fallback.name}`, {
          description: `${biz?.name || "Your previous queue"} closed your earlier queue.`,
        });
      }
    });
    // If the picker modal is open and the remembered queue for that business
    // just went stale, the modal will simply re-render with the remaining
    // active queues — no need to close it.
  }, [queuesByBiz, selectedQueueByBiz, businesses]);

  // If the picker modal is open and no queues remain active for that
  // business, close the modal automatically.
  useEffect(() => {
    if (!pickerBiz) return;
    const activeLeft = (queuesByBiz[pickerBiz.id] || []).filter(x => x.status === "active");
    if (activeLeft.length === 0) {
      toast.info(`${pickerBiz.name} has no open queues right now.`);
      setPickerBiz(null);
    }
  }, [queuesByBiz, pickerBiz]);

  const fetchData = async () => {
    const { data: bizRaw } = await supabase
      .from("businesses")
      .select("*")
      .order("is_sponsored" as any, { ascending: false })
      .order("is_featured" as any, { ascending: false })
      .order("is_recommended", { ascending: false })
      .order("display_rank" as any, { ascending: false })
      .order("created_at", { ascending: false });
    // Respect Customer Discovery: hide businesses that have opted out.
    const biz = (bizRaw || []).filter((b: any) => b.discovery_enabled !== false);
    const { data: queues } = await supabase
      .from("queues")
      .select("id, business_id, name, status, estimated_service_time, parent_queue_id, queue_type, table_size" as any);
    const { data: visitors } = await (supabase as any).from("queue_visitors_public").select("queue_id, status").eq("status", "waiting");

    const map: Record<string, QueueInfo> = {};
    const byBiz: Record<string, QueueOption[]> = {};
    // Queues are an internal concept. Customers only see COUNTERS (parent queues).
    // Restaurant table-size sub-queues (parent_queue_id != null) are hidden here
    // and their waiting counts roll up into their parent counter.
    const waitingByQueue: Record<string, number> = {};
    (visitors || []).forEach((v: any) => {
      waitingByQueue[v.queue_id] = (waitingByQueue[v.queue_id] || 0) + 1;
    });
    const parents = (queues || []).filter((q: any) => !q.parent_queue_id);
    const childrenByParent: Record<string, any[]> = {};
    (queues || []).forEach((q: any) => {
      if (q.parent_queue_id) {
        (childrenByParent[q.parent_queue_id] = childrenByParent[q.parent_queue_id] || []).push(q);
      }
    });
    parents.forEach((q: any) => {
      const ownWaiting = waitingByQueue[q.id] || 0;
      const childWaiting = (childrenByParent[q.id] || []).reduce(
        (sum, c) => sum + (waitingByQueue[c.id] || 0),
        0,
      );
      const waiting = ownWaiting + childWaiting;
      (byBiz[q.business_id] = byBiz[q.business_id] || []).push({
        id: q.id,
        name: (q as any).name || "Counter",
        status: q.status,
        est_time: q.estimated_service_time || 5,
        waiting,
      });
      if (!map[q.business_id] || q.status === "active") {
        map[q.business_id] = {
          business_id: q.business_id,
          queue_id: q.id,
          status: q.status,
          est_time: q.estimated_service_time || 5,
          waiting,
        };
      }
    });

    setBusinesses(biz);
    setQueueMap(map);
    setQueuesByBiz(byBiz);
    setLoading(false);
  };

  // Count businesses per category for grid badges.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    businesses.forEach(b => {
      const c = getCategoryForBusiness(b.category);
      counts[c.key] = (counts[c.key] ?? 0) + 1;
    });
    return counts;
  }, [businesses]);

  const activeCat = activeCategory ? getCategoryByKey(activeCategory) : null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return businesses.filter(b => {
      if (activeCat) {
        if (getCategoryForBusiness(b.category).key !== activeCat.key) return false;
      }
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
      );
    });
  }, [businesses, activeCat, search]);

  if (authLoading || loading) return (
    <div className="min-h-screen soft-bg">
      <header className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="hidden sm:block h-4 w-20" />
          <Skeleton className="flex-1 max-w-xl h-10 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <SkeletonPageHeader />
        <div className="flex gap-2 mb-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
          ))}
        </div>
        <SkeletonStatGrid count={4} className="mb-6" />
        <SkeletonCardGrid count={6} />
      </main>
    </div>
  );

  return (
    <div className="min-h-screen soft-bg">
      <header className="bg-card/90 border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-h-[44px] min-w-[44px] justify-center sm:justify-start">
            <img src={logo} alt="Qblink" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-foreground hidden sm:block">Qblink</span>
          </Link>
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search places or areas…"
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <NotificationBell />
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-primary items-center justify-center text-primary-foreground text-xs font-bold">
              {profileName?.[0]?.toUpperCase() || "C"}
            </div>
            <button onClick={signOut} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-muted transition-colors" title="Sign out" aria-label="Sign out">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {!activeCat && !search && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Hi {profileName?.split(" ")[0] || "there"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Your queue activity and live venues nearby
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                {CATEGORIES.map(c => {
                  const count = categoryCounts[c.key] ?? 0;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className="min-h-[38px] shrink-0 px-3.5 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{c.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimalistic Bento Grid: Left = Personal Analytics, Right = Live Near You + Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-8 min-w-0">
                {user && <CustomerAnalyticsBento userId={user.id} />}
              </div>
              <div className="lg:col-span-4 space-y-5 min-w-0">
                <LiveDiscoveryBento
                  businesses={businesses}
                  queueMap={queueMap}
                  queuesByBiz={queuesByBiz}
                  selectedQueueByBiz={selectedQueueByBiz}
                />
                <UpcomingAppointments
                  businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
                  customerName={profileName}
                />
              </div>
            </div>

            <FavoriteBusinesses />

            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Recommended places</h2>
            </div>
          </>
        )}

        {(activeCat || search) && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setActiveCategory(null); setSearch(""); }}
              className="w-9 h-9 rounded-xl bg-card card-shadow flex items-center justify-center hover:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {activeCat ? activeCat.label : `Results for "${search}"`}
              </h1>
              <p className="text-xs text-muted-foreground">{filtered.length} places</p>
            </div>
          </div>
        )}

        {filtered.length === 0 && (activeCat || search) ? (
          <div className="py-10 bg-card rounded-2xl card-shadow">
            <EmptyState
              icon={Search}
              title="No matches yet"
              description={search
                ? `We couldn't find any business matching "${search}" in your area right now.`
                : "No businesses in this category are live on Qblink yet — check back soon."}
              cta={{ label: "Browse all categories", onClick: () => { setActiveCategory(null); setSearch(""); } }}
              tip="Try a broader keyword like 'cafe' or 'clinic', or tap a category chip above."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeCat || search
              ? filtered
              : businesses.filter(b => b.is_sponsored || b.is_featured || b.is_recommended)
            ).map(b => {
              const q = queueMap[b.id];
              const openState = getOpenState(b.operating_hours);
              const isClosedByHours = openState.status === "closed" || openState.status === "holiday";
              const isActive = q?.status === "active" && !isClosedByHours;
              const cat = getCategoryForBusiness(b.category);
              const showPickup = cat.supportsPickup;
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isActive ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                      {isClosedByHours ? (
                        openState.label
                      ) : isActive ? (
                        b.show_live_queue_info === false
                          ? "Open"
                          : <><AnimatedNumber value={q.waiting} suffix=" waiting" invertHighlight /></>
                      ) : q ? "Queue closed" : "No queue"}
                    </span>
                    {b.is_sponsored ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Sponsored
                      </span>
                    ) : b.is_featured ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-info-soft text-info font-medium">
                        Featured
                      </span>
                    ) : b.is_recommended && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-warning-soft text-warning font-medium inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Top Pick
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{b.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.category || cat.label}</p>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {b.address && <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {b.address}</span>}
                    {b.rating && (b.total_reviews ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-warning text-warning" /> {b.rating}
                      </span>
                    )}
                    {q && isActive && b.show_live_queue_info !== false && <span>~<AnimatedNumber value={q.waiting * q.est_time} suffix="m" invertHighlight /></span>}
                  </div>

                  <div className="space-y-2 mt-auto">
                    {isActive ? (() => {
                      const activeQs = (queuesByBiz[b.id] || []).filter(x => x.status === "active");
                      const remembered = selectedQueueByBiz[b.id];
                      const rememberedStillActive = remembered && activeQs.some(x => x.id === remembered);
                      if (activeQs.length > 1 && !rememberedStillActive) {
                        return (
                          <button
                            onClick={() => setPickerBiz(b)}
                            className="w-full text-center bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <Users className="w-4 h-4" /> Choose Counter ({activeQs.length})
                          </button>
                        );
                      }
                      const targetId = rememberedStillActive
                        ? remembered!
                        : (!b.id.startsWith("demo-") && q?.queue_id ? q.queue_id : b.id);
                      const targetName = activeQs.find(x => x.id === targetId)?.name;
                      return (
                        <div className="space-y-1.5">
                          <Link
                            to={`/join/${targetId}`}
                            className="w-full text-center bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <Users className="w-4 h-4" /> Join {targetName || "Counter"}
                          </Link>
                          {activeQs.length > 1 && (
                            <button
                              onClick={() => setPickerBiz(b)}
                              className="w-full text-center text-xs text-primary hover:underline"
                            >
                              Change counter ({activeQs.length} available)
                            </button>
                          )}
                        </div>
                      );
                    })() : (
                      <button disabled className="w-full bg-muted text-muted-foreground py-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
                        {isClosedByHours ? openState.label : q?.status === "closed" ? "Queue Closed" : "Queue Inactive"}
                      </button>
                    )}
                    {showPickup && (
                      <Link
                        to={`/pickup/${b.id}`}
                        className="w-full text-center bg-card border border-primary/40 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UtensilsCrossed className="w-4 h-4" /> Order pickup
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AIAssistant mode="customer" />
      {pickerBiz && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setPickerBiz(null)}
        >
          <div
            className="bg-card rounded-2xl card-shadow w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">Choose a counter</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{pickerBiz.name} has multiple counters open</p>
              </div>
              <button
                onClick={() => setPickerBiz(null)}
                className="p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {(queuesByBiz[pickerBiz.id] || [])
                .filter(qq => qq.status === "active")
                .map(qq => (
                  <Link
                    key={qq.id}
                    to={`/join/${qq.id}`}
                    onClick={() => {
                      rememberQueue(pickerBiz.id, qq.id);
                      try {
                        sessionStorage.setItem("qblink:switchedQueue", JSON.stringify({ queueId: qq.id, queueName: qq.name }));
                      } catch {}
                      toast.success(`Switched to ${qq.name}`, {
                        description: `Taking you to ${pickerBiz.name}'s ${qq.name}…`,
                      });
                      setPickerBiz(null);
                    }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{qq.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> <AnimatedNumber value={qq.waiting} suffix=" waiting" invertHighlight /></span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~<AnimatedNumber value={qq.waiting * qq.est_time} suffix="m" invertHighlight /></span>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;

// ===== Live Discovery Bento =====
const LiveDiscoveryBento = ({
  businesses,
  queueMap,
  queuesByBiz,
  selectedQueueByBiz,
}: {
  businesses: Business[];
  queueMap: Record<string, QueueInfo>;
  queuesByBiz: Record<string, QueueOption[]>;
  selectedQueueByBiz: Record<string, string>;
}) => {
  const live = useMemo(() => {
    return businesses
      .map((b) => {
        const q = queueMap[b.id];
        if (!q || q.status !== "active") return null;
        const st = getOpenState(b.operating_hours);
        if (st.status === "closed" || st.status === "holiday") return null;
        return {
          biz: b,
          waiting: q.waiting,
          wait: q.waiting * q.est_time,
          queueId: q.queue_id,
          showLive: b.show_live_queue_info !== false,
          remoteJoin: b.remote_joining_enabled !== false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.wait - b!.wait) as Array<{
      biz: Business;
      waiting: number;
      wait: number;
      queueId: string;
      showLive: boolean;
      remoteJoin: boolean;
    }>;
  }, [businesses, queueMap]);

  const top = live.slice(0, 4);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Live near you</h2>
          <p className="text-xs text-muted-foreground">Shortest wait right now</p>
        </div>
        <Zap className="w-4 h-4 text-primary" />
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          No active queues nearby at the moment.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {top.map((row) => {
            const activeQs = (queuesByBiz[row.biz.id] || []).filter(
              (x) => x.status === "active"
            );
            const remembered = selectedQueueByBiz[row.biz.id];
            const targetId =
              activeQs.find((x) => x.id === remembered)?.id ||
              (!row.biz.id.startsWith("demo-") ? row.queueId : row.biz.id);
            return (
              <div
                key={row.biz.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {row.biz.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.showLive ? `~${row.wait}m · ${row.waiting} waiting` : "Open"}
                  </p>
                </div>
                <Link
                  to={`/join/${targetId}`}
                  className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shrink-0"
                >
                  {row.remoteJoin ? "Join" : "Visit"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
