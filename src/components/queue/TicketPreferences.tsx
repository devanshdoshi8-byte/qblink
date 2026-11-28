import { BellRing, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ticketCopy, type TicketLanguage } from "@/lib/waitingExperience";
import type { useTurnAlerts } from "@/hooks/useTurnAlerts";

export function TicketLanguagePicker({ language, onChange }: { language: TicketLanguage; onChange: (value: TicketLanguage) => void }) {
  return (
    <div role="group" aria-label="Ticket language" className="flex shrink-0 gap-1.5">
      {(["en", "hi", "mr"] as const).map((value, i) => (
        <button
          key={value}
          type="button"
          aria-pressed={language === value}
          onClick={() => onChange(value)}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-all font-medium ${
            language === value
              ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
              : "bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          {["EN", "हिं", "मरा"][i]}
        </button>
      ))}
    </div>
  );
}

export function TurnAlertControls({ language, alerts }: { language: TicketLanguage; alerts: ReturnType<typeof useTurnAlerts> }) {
  const t = ticketCopy[language];
  return <section aria-label={t.alerts} className="my-4 border-y border-border py-4 text-left">
    <div className="flex items-center gap-3">
      <BellRing className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <label htmlFor="ticket-turn-bell" className="flex-1 text-sm font-semibold">{t.bell}</label>
      <Switch id="ticket-turn-bell" checked={alerts.enabled} onCheckedChange={value => void alerts.toggle(value)} />
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground" role="status">{alerts.wakeState === "active" ? t.awake : alerts.wakeState === "unavailable" ? t.unavailable : t.off}</p>
      <Button type="button" variant="outline" size="sm" disabled={!alerts.enabled} onClick={() => void alerts.play()}><Volume2 aria-hidden />{t.test}</Button>
    </div>
    {alerts.audioError && <p role="alert" className="mt-2 text-xs text-destructive">{t.audioError}</p>}
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.limits}</p>
  </section>;
}