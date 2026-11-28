import { useState } from "react";
import { Clock, Users, RefreshCw, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ticketCopy, shouldReturn, type TicketLanguage, type WaitingLocation } from "@/lib/waitingExperience";

interface Props {
  ahead: number;
  waitMinutes: number;
  liveStatus: string;
  myToken: number | null;
  nowServing: number | null;
  serviceTime: number;
  onRefresh: () => void;
  initialAhead?: number;
  joinedAt?: number;
  remoteJoiningEnabled?: boolean;
  language?: TicketLanguage;
}

const LiveWaitingExperience = ({ ahead, waitMinutes, myToken, nowServing, onRefresh, initialAhead, language = "en" }: Props) => {
  const t = ticketCopy[language];
  const [location, setLocation] = useState<WaitingLocation>("area");
  const [refreshing, setRefreshing] = useState(false);
  const baseline = Math.max(initialAhead ?? ahead, ahead, 1);
  const progress = Math.min(100, Math.round(Math.max(baseline - ahead, 0) / baseline * 100));
  const returnNow = shouldReturn(location, ahead, waitMinutes, "waiting");
  const refresh = async () => {
    setRefreshing(true);
    try { await Promise.resolve(onRefresh()); }
    finally { setRefreshing(false); }
  };

  return <section lang={language} aria-label={t.token} className="w-full text-left">
    <div className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t.token}</p>
        <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background" role="status">{ahead === 0 ? t.next : t.moving}</span>
      </div>
      <p className="mt-3 break-all text-6xl font-extrabold leading-tight text-foreground tabular-nums">#{myToken}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{progress > 0 ? `${progress}${t.closer}` : t.secured}</p>
      <div role="progressbar" aria-label={t.secured} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="mt-3 grid grid-cols-10 gap-1" aria-valuetext={progress > 0 ? `${progress}${t.closer}` : t.secured}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < Math.ceil(progress / 10) ? "bg-primary" : "bg-muted"}`} />)}
      </div>
    </div>
    <p className="mt-4 text-sm text-muted-foreground">{t.serving} <strong className="ml-2 text-xl text-foreground tabular-nums">{nowServing === null ? "—" : `#${nowServing}`}</strong></p>
    <dl aria-live="polite" aria-atomic="true" className="mt-4 grid grid-cols-2 gap-4 border-y border-border py-4">
      <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-4 w-4 shrink-0" aria-hidden />{t.ahead}</dt><dd className="mt-2 text-3xl font-bold text-foreground tabular-nums">{ahead}</dd></div>
      <div><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-4 w-4 shrink-0" aria-hidden />{t.wait}</dt><dd className="mt-2 text-xl font-bold text-foreground">{ahead <= 0 ? t.next : `~${waitMinutes} ${t.min}`}</dd></div>
    </dl>
    <p className="mt-2 text-xs text-muted-foreground">{t.pace}</p>
    <fieldset className="mt-5">
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" aria-hidden />{t.location}</legend>
      <div className="grid gap-2">
        {(["area", "nearby", "out"] as const).map(value => <Button key={value} type="button" variant={location === value ? "default" : "outline"} aria-pressed={location === value} onClick={() => setLocation(value)} className="h-auto min-h-11 justify-start whitespace-normal text-left touch-manipulation">{t[value]}</Button>)}
      </div>
    </fieldset>
    {returnNow && <div role="alert" className="mt-3 border-l-4 border-warning bg-warning-soft p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground"><ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />{t.returnTitle}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{t.returnNote}</p>
    </div>}
    <Button variant="outline" type="button" onClick={() => void refresh()} disabled={refreshing} aria-busy={refreshing} className="mt-4 w-full min-h-11 touch-manipulation"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />{refreshing ? t.refreshing : t.refresh}</Button>
  </section>;
};

export default LiveWaitingExperience;
