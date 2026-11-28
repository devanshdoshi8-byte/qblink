import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ticketCopyFor, type TicketCopy, type TicketLanguage } from "@/lib/waitingExperience";

interface Props {
  /** Customer's first name when known. */
  name?: string | null;
  /** People ahead — only meaningful once joined. */
  ahead?: number | null;
  joined?: boolean;
  /** Times this customer has visited this business (from favourites). */
  visitCount?: number | null;
  className?: string;
  language?: TicketLanguage;
}

const partOfDay = (h: number): keyof Pick<TicketCopy, "greetMorning" | "greetAfternoon" | "greetEvening"> =>
  h < 12 ? "greetMorning" : h < 17 ? "greetAfternoon" : "greetEvening";

/**
 * Contextual greeting above the business name.
 * Changes only when context changes (time band, returning status, position).
 */
const DynamicWelcomeHeader = ({ name, ahead, joined, visitCount, className, language = "en" }: Props) => {
  const reduce = useReducedMotion();
  const c = ticketCopyFor(language);
  const first = (name || "").trim().split(/\s+/)[0] || "";

  const { key, title, sub } = useMemo(() => {
    if (joined && typeof ahead === "number") {
      if (ahead <= 0) {
        return { key: "next", title: c.turnNext, sub: c.stayNearby };
      }
      if (ahead <= 3) {
        return { key: "almost", title: c.almostTurn, sub: c.headOver };
      }
    }
    const greetKey = partOfDay(new Date().getHours());
    const greeting = c[greetKey];
    if ((visitCount ?? 0) > 1) {
      return {
        key: "returning",
        title: first ? `${c.welcomeBack}, ${first}.` : `${c.welcomeBack}.`,
        sub: c.goodToSee,
      };
    }
    return {
      key: `greet-${greetKey}`,
      title: first ? `${greeting}, ${first}.` : `${greeting}.`,
      sub: c.gladHere,
    };
  }, [ahead, c, first, joined, visitCount]);

  return (
    <div className={cn("text-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DynamicWelcomeHeader;
