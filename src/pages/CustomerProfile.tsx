import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, History, Loader2, LogOut, RefreshCw, Search, UserRound, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMyQueueVisits } from "@/hooks/useMyQueueVisits";
import { supabase } from "@/integrations/supabase/client";
import { visitStatusLabel } from "@/lib/customerVisits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MobileBottomNav from "@/components/MobileBottomNav";
import logo from "@/assets/qblink-logo.png";

export default function CustomerProfile() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { active, history, refresh } = useMyQueueVisits();
  const [name, setName] = useState("");
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState("");
  const profile = useQuery({
    queryKey: ["customer-profile", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_profiles").select("full_name").eq("user_id", user?.id || "").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth/signin?next=/customer-dashboard/profile", { replace: true });
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (profile.isSuccess) setName(profile.data?.full_name || user?.user_metadata?.full_name || "");
  }, [profile.data, profile.isSuccess, user?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in again.");
      const { error } = await supabase.from("customer_profiles").upsert({ user_id: user.id, full_name: name.trim() }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["customer-profile", user?.id] }); toast.success("Name updated"); },
    onError: () => toast.error("Your name couldn't be saved. Please try again."),
  });
  const leave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("leave_my_queue", { p_visitor_id: id });
      if (error) throw error;
    },
    onSuccess: async () => { setLeaveId(null); await refresh(); toast.success("You have left the queue"); },
    onError: () => setLeaveError("We couldn't leave the queue. Check your connection and try again."),
  });
  const visits = history.data?.pages.flat() || [];
  const leavingVisit = active.data?.find(v => v.visitor_id === leaveId);
  if (authLoading || !user) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="min-h-dvh soft-bg text-foreground">
      <header className="border-b border-border bg-card/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/customer-dashboard" className="flex items-center gap-2 font-bold"><img src={logo} alt="Qblink" className="h-9 w-9 object-contain" /> Qblink</Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/10">
                <Link to="/admin">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost"><Link to="/customer-dashboard"><ArrowLeft /> Discovery</Link></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-32 md:pb-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold">My Profile</h1><p className="mt-1 text-sm text-muted-foreground break-all">{user.email}</p></div>
          <Button variant="outline" onClick={async () => { await refresh(); toast.success("Refreshed"); }} disabled={active.isFetching || history.isFetching} aria-label="Refresh my queues"><RefreshCw className={active.isFetching || history.isFetching ? "animate-spin" : ""} /> Refresh</Button>
        </div>
        <section className="mb-10 border-b border-border pb-8" aria-labelledby="name-heading">
          <h2 id="name-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold"><UserRound className="h-5 w-5 text-primary" /> Personal details</h2>
          {profile.isPending ? <Skeleton className="h-10 w-full max-w-md" /> : profile.isError ? <div role="alert"><p className="text-sm text-danger">Your profile couldn't load.</p><Button variant="link" onClick={() => void profile.refetch()}>Try again</Button></div> : (
            <form className="max-w-lg" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
              <label htmlFor="customer-name" className="mb-2 block text-sm font-medium">Name</label>
              <div className="flex flex-wrap gap-2"><Input id="customer-name" className="min-w-0 flex-1" required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /><Button type="submit" disabled={save.isPending || !name.trim() || name.trim() === profile.data?.full_name}>{save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save name</Button></div>
            </form>
          )}
        </section>
        <section className="mb-10" aria-labelledby="active-heading">
          <h2 id="active-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" /> Current queues {active.data && <span className="text-primary">({active.data.length})</span>}</h2>
          {active.isPending ? <Skeleton className="h-36 w-full" /> : active.isError ? <div role="alert"><p className="text-sm text-danger">Current queues couldn't load. Your place hasn't changed.</p><Button variant="link" onClick={() => void active.refetch()}>Try again</Button></div> : !active.data?.length ? <p className="py-6 text-sm text-muted-foreground">You're not standing in any queues right now.</p> : (
            <div className="grid gap-4 sm:grid-cols-2">{active.data.map(v => (
              <article key={v.visitor_id} className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-bold break-words">{v.business_name}</h3><p className="text-sm text-muted-foreground break-words">{v.counter_name}{v.table_size ? ` · ${v.table_size} seater` : ""}</p></div><span className="shrink-0 text-xl font-bold text-primary">#{v.token_number}</span></div>
                <p className="mb-1 text-sm font-semibold text-primary">{visitStatusLabel(v.status)}</p>
                <p className="mb-5 text-xs text-muted-foreground">Joined {new Date(v.joined_at).toLocaleString()}</p>
                <div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link to={`/join/${v.join_queue_id}`}>View queue <ArrowRight /></Link></Button><Button size="sm" variant="outline" onClick={() => { setLeaveError(""); setLeaveId(v.visitor_id); }}><LogOut /> Leave queue</Button></div>
              </article>
            ))}</div>
          )}
        </section>
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5 text-primary" /> Past visits</h2>
          {history.isPending ? <Skeleton className="h-36 w-full" /> : history.isError ? <div role="alert"><p className="text-sm text-danger">Past visits couldn't load.</p><Button variant="link" onClick={() => void history.refetch()}>Try again</Button></div> : !visits.length ? <p className="py-6 text-sm text-muted-foreground">No past visits linked to this account yet.</p> : (
            <div className="divide-y divide-border">{visits.map(v => <article key={v.visitor_id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><h3 className="font-semibold break-words">{v.business_name}</h3><p className="text-sm text-muted-foreground break-words">{v.counter_name} · Token #{v.token_number}{v.table_size ? ` · ${v.table_size} seater` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(v.joined_at).toLocaleString()}</p></div><span className="text-sm text-muted-foreground">{visitStatusLabel(v.status)}</span></article>)}</div>
          )}
          {history.hasNextPage && <Button variant="outline" className="mt-4" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>Show more visits</Button>}
        </section>
      </main>
      <AlertDialog open={!!leaveId} onOpenChange={open => { if (!open && !leave.isPending) setLeaveId(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg"><AlertDialogHeader><AlertDialogTitle>Leave this queue?</AlertDialogTitle><AlertDialogDescription>Your place at {leavingVisit?.business_name || "this business"} will be released. This visit will stay in your history.</AlertDialogDescription></AlertDialogHeader>{leaveError && <p role="alert" className="text-sm text-danger">{leaveError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={leave.isPending}>Keep my place</AlertDialogCancel><AlertDialogAction disabled={leave.isPending} onClick={e => { e.preventDefault(); if (leaveId) leave.mutate(leaveId); }}>{leave.isPending ? "Leaving…" : "Leave queue"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <MobileBottomNav
        items={[
          { to: "/customer-dashboard", label: "Discovery", icon: Search, end: true },
          { to: "/customer-dashboard/profile", label: "My Visits", icon: Users },
        ]}
      />
    </div>
  );
}