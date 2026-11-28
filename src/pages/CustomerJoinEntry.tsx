import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  LogIn,
  MapPin,
  Play,
  QrCode,
  Search,
  UserPlus,
} from "lucide-react";
import SEO from "@/components/SEO";
import { QBlinkWordmark } from "@/components/qb/QBlinkWordmark";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface RegisteredBusiness {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  discovery_enabled?: boolean | null;
}

interface BusinessQueue {
  id: string;
  business_id: string;
  name: string;
  status: string;
  estimated_service_time: number | null;
  parent_queue_id: string | null;
}

const CustomerJoinEntry = () => {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<RegisteredBusiness[]>([]);
  const [queues, setQueues] = useState<BusinessQueue[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingList(true);

    (async () => {
      const [{ data: bizData }, { data: queueData }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, category, address, discovery_enabled")
          .order("name", { ascending: true }),
        supabase
          .from("queues")
          .select("id, business_id, name, status, estimated_service_time, parent_queue_id")
          .is("parent_queue_id", null)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;
      setBusinesses(
        ((bizData || []) as RegisteredBusiness[]).filter((b) => b.discovery_enabled !== false)
      );
      setQueues((queueData || []) as BusinessQueue[]);
      setLoadingList(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const queuesByBiz = useMemo(() => {
    const map = new Map<string, BusinessQueue[]>();
    queues.forEach((q) => {
      const list = map.get(q.business_id) || [];
      list.push(q);
      map.set(q.business_id, list);
    });
    return map;
  }, [queues]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses
      .map((biz) => {
        const bizQueues = queuesByBiz.get(biz.id) || [];
        if (bizQueues.length === 0) return null;
        const primaryQueue =
          bizQueues.find((item) => item.status === "active") || bizQueues[0];
        const matches =
          !q ||
          biz.name.toLowerCase().includes(q) ||
          (biz.category || "").toLowerCase().includes(q) ||
          (biz.address || "").toLowerCase().includes(q) ||
          bizQueues.some((item) => item.name.toLowerCase().includes(q));
        if (!matches) return null;
        return { biz, primaryQueue, bizQueues };
      })
      .filter(Boolean) as Array<{
      biz: RegisteredBusiness;
      primaryQueue: BusinessQueue;
      bizQueues: BusinessQueue[];
    }>;
  }, [businesses, queuesByBiz, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || results.length === 0) return;
    navigate(`/join/${encodeURIComponent(results[0].primaryQueue.id)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Join a Queue — QBlink"
        description="Sign in and search registered QBlink businesses to join a live queue."
        path="/join"
      />
      <header className="border-b border-border/60 bg-background/90 px-5 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" aria-label="QBlink home">
            <QBlinkWordmark textClassName="text-xl text-foreground" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border bg-card transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to QBlink</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Customer Queue Entry</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Join a live queue
            </h1>
            <p className="text-sm text-muted-foreground">
              {user
                ? "Search registered businesses on QBlink and select a queue to join."
                : "Sign in first to search registered businesses and join their live queues."}
            </p>
          </div>

          {authLoading ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Checking your session...
            </div>
          ) : !user ? (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Sign in required
                </h2>
                <p className="text-xs text-muted-foreground">
                  Please sign in to your customer account before searching and joining a registered business queue.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/auth/signin?next=%2Fjoin"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in to continue</span>
                </Link>
                <Link
                  to="/auth?next=%2Fjoin"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-foreground font-semibold py-3 text-sm hover:bg-muted transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create customer account</span>
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div>
                <label
                  htmlFor="business-search"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Search registered businesses
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="business-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by business name, category, or area..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {loadingList ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  Loading registered businesses...
                </p>
              ) : results.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  {query.trim()
                    ? `No registered business matches "${query.trim()}".`
                    : "No registered businesses with open queues found."}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                  {results.map(({ biz, primaryQueue }) => {
                    const isActive = primaryQueue.status === "active";
                    return (
                      <button
                        key={biz.id}
                        type="button"
                        onClick={() =>
                          navigate(`/join/${encodeURIComponent(primaryQueue.id)}`)
                        }
                        className="w-full min-h-[44px] text-left rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/40 p-3 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-sm font-semibold text-foreground truncate">
                              {biz.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 truncate">
                            <span>{biz.category || "Service"}</span>
                            {biz.address && (
                              <span className="inline-flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{biz.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-success-soft text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isActive ? "Open" : primaryQueue.status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingList || results.length === 0}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <span>
                  {results.length > 0
                    ? `Join ${results[0].biz.name}`
                    : "Select a registered business"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="rounded-2xl border border-border bg-card/60 p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Just exploring?</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Try the live sample clinic queue without an account.
              </div>
            </div>
            <Link
              to="/pitch"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Sample</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerJoinEntry;
