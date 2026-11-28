import { useState } from "react";
import { Timer, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publicUrl } from "@/lib/publicUrl";
import { ticketCopyFor, type TicketCopy, type TicketLanguage } from "@/lib/waitingExperience";

interface CustomerTicketShareCardProps {
  /** Minutes the customer has been free to wait anywhere else (time since joining). */
  minutesSaved: number;
  /** Public, customer-reachable link the family can open to track live status. */
  ticketUrl: string;
  businessName: string;
  token?: number | null;
  ahead?: number | null;
  waitMinutes?: number | null;
  language?: TicketLanguage;
  className?: string;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const openWhatsApp = (message: string) => {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
};

const familyMessage = (t: TicketCopy, p: { businessName: string; token?: number | null; ahead?: number | null; waitMinutes?: number | null; ticketUrl: string }) =>
  fill(t.shareFamilyMsg, {
    biz: p.businessName,
    token: p.token ?? "—",
    ahead: p.ahead ?? 0,
    wait: p.waitMinutes ?? 0,
    url: p.ticketUrl,
  });

/**
 * Purely presentational share card for the customer waiting screen:
 * "Life reclaimed" badge, family/driver live-status pass and a
 * recommend-Qblink-to-a-business call to action.
 */
const CustomerTicketShareCard = ({
  minutesSaved,
  ticketUrl,
  businessName,
  token,
  ahead,
  waitMinutes,
  language = "en",
  className,
}: CustomerTicketShareCardProps) => {
  const t = ticketCopyFor(language);
  const [recommendOpen, setRecommendOpen] = useState(false);

  return (
    <section
      lang={language}
      aria-label={t.shareFamilyTitle}
      className={cn("rounded-2xl border border-border bg-card p-4 text-left card-shadow", className)}
    >
      {minutesSaved >= 1 && (
        <div className="inline-flex max-w-full items-start gap-2 rounded-full bg-success-soft px-3 py-2 text-success">
          <Timer className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs font-semibold leading-snug">
            {fill(t.shareSaved, { n: minutesSaved })}
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={() =>
          openWhatsApp(
            familyMessage(t, { businessName, token, ahead, waitMinutes, ticketUrl }),
          )
        }
        className="mt-3 flex h-auto min-h-11 w-full items-center gap-2 whitespace-normal rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-success-foreground hover:opacity-90 touch-manipulation"
        aria-label={t.shareFamilyTitle}
      >
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
        {t.shareFamilyTitle}
      </Button>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{t.shareFamilySub}</p>

      <div className="mt-3 rounded-xl border border-dashed border-border p-3">
        <button
          type="button"
          onClick={() => setRecommendOpen((open) => !open)}
          aria-expanded={recommendOpen}
          className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-foreground touch-manipulation"
        >
          {t.shareRecommendTitle}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", recommendOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        {recommendOpen && (
          <Button
            type="button"
            variant="outline"
            onClick={() => openWhatsApp(fill(t.shareRecommendMsg, { biz: businessName, url: publicUrl("/") }))}
            className="mt-2 h-auto min-h-11 w-full justify-start gap-2 whitespace-normal rounded-lg text-xs font-semibold touch-manipulation"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-success" aria-hidden />
            {t.shareRecommendAction}
          </Button>
        )}
      </div>
    </section>
  );
};

export default CustomerTicketShareCard;
