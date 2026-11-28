import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  FlaskConical,
  Minimize2,
  Maximize2,
  Pause,
  Phone,
  Play,
  Sparkles,
  UserX,
  Zap,
  X,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";

export type VisitType = "new" | "followup" | "report";

export const VISIT_TYPE_META: Record<
  VisitType,
  { label: string; short: string; badgeCls: string }
> = {
  new: {
    label: "New Visit",
    short: "New",
    badgeCls: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/25",
  },
  followup: {
    label: "Follow-up",
    short: "Follow-up",
    badgeCls: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/25",
  },
  report: {
    label: "Lab Report",
    short: "Report",
    badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
};

export const PAUSE_REASONS = [
  { id: "rounds", label: "Doctor Rounds", emoji: "🏥" },
  { id: "emergency", label: "Emergency Case", emoji: "🚨" },
  { id: "break", label: "Short Break", emoji: "☕" },
  { id: "lunch", label: "Lunch Break", emoji: "🍽️" },
] as const;

export const ClinicTimerBadge = ({
  calledAt,
  expectedMinutes = 8,
  light = false,
}: {
  calledAt: string | null;
  expectedMinutes?: number;
  light?: boolean;
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!calledAt) {
      setElapsedSec(0);
      return;
    }
    const calc = () =>
      Math.max(0, Math.floor((Date.now() - new Date(calledAt).getTime()) / 1000));
    setElapsedSec(calc());
    const id = setInterval(() => setElapsedSec(calc()), 1000);
    return () => clearInterval(id);
  }, [calledAt]);

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isOver = mins >= expectedMinutes;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold tabular-nums transition-colors ${
        light
          ? isOver
            ? "bg-amber-400/25 text-amber-100 border border-amber-300/40"
            : "bg-white/15 text-white border border-white/20"
          : isOver
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
      }`}
      title={`Consultation duration (expected ~${expectedMinutes} min)`}
    >
      <Clock className="w-3 h-3" />
      {formatted}
    </span>
  );
};

export interface ClinicVisitorBrief {
  id: string;
  token_number: number;
  visitor_name: string | null;
  phone?: string | null;
  called_at?: string | null;
  visitType?: VisitType;
  isUrgent?: boolean;
}

export const ClinicPulseStrip = ({
  servedCount,
  calledVisitor,
  waitingList,
  expectedMinutes,
  miniMode,
  onToggleMiniMode,
}: {
  servedCount: number;
  calledVisitor: ClinicVisitorBrief | null;
  waitingList: ClinicVisitorBrief[];
  expectedMinutes: number;
  miniMode: boolean;
  onToggleMiniMode: () => void;
}) => {
  const nextTwo = waitingList.slice(0, 2);
  const remaining = Math.max(0, waitingList.length - 2);

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-5 card-shadow flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5" />
          {servedCount} Consulted
        </span>
        <span className="text-muted-foreground/60">→</span>

        {calledVisitor ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/25">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            #{calledVisitor.token_number} Inside
            <ClinicTimerBadge
              calledAt={calledVisitor.called_at || null}
              expectedMinutes={expectedMinutes}
            />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
            Cabin Ready
          </span>
        )}

        {nextTwo.length > 0 && (
          <>
            <span className="text-muted-foreground/60">→</span>
            {nextTwo.map((v, idx) => (
              <span
                key={v.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold border ${
                  idx === 0
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25"
                    : "bg-muted/60 text-muted-foreground border-border"
                }`}
              >
                {v.isUrgent && <Zap className="w-3 h-3 text-amber-500" />}
                #{v.token_number} {idx === 0 ? "Next" : ""}
              </span>
            ))}
            {remaining > 0 && (
              <span className="text-xs font-semibold text-muted-foreground px-1.5">
                +{remaining} waiting
              </span>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleMiniMode}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          miniMode
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/50 hover:bg-muted text-foreground border-border"
        }`}
        title="Distraction-free Doctor Cabin Remote"
      >
        {miniMode ? (
          <>
            <Maximize2 className="w-3.5 h-3.5" /> Full Dashboard
          </>
        ) : (
          <>
            <Minimize2 className="w-3.5 h-3.5" /> Cabin Mini-Mode
          </>
        )}
      </button>
    </div>
  );
};

export const ClinicCabinMiniMode = ({
  queueName,
  calledVisitor,
  nextVisitor,
  waitingCount,
  expectedMinutes,
  isPaused,
  pauseReason,
  delayMinutes,
  callingNext,
  onCallNext,
  onRecall,
  onSendToLab,
  onNoShow,
  onTogglePause,
  onExitMiniMode,
}: {
  queueName: string;
  calledVisitor: ClinicVisitorBrief | null;
  nextVisitor: ClinicVisitorBrief | null;
  waitingCount: number;
  expectedMinutes: number;
  isPaused: boolean;
  pauseReason: string | null;
  delayMinutes: number;
  callingNext: boolean;
  onCallNext: () => void;
  onRecall: () => void;
  onSendToLab: () => void;
  onNoShow: () => void;
  onTogglePause: () => void;
  onExitMiniMode: () => void;
}) => {
  const isLastPatient = waitingCount === 0 && Boolean(calledVisitor);
  const isQueueEmpty = waitingCount === 0 && !calledVisitor;

  return (
    <div className="max-w-lg mx-auto my-4 bg-card border border-border rounded-3xl p-6 card-shadow">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-border/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Doctor Cabin Remote
          </span>
          <h2 className="text-lg font-extrabold text-foreground">{queueName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {delayMinutes > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              +{delayMinutes}m delay
            </span>
          )}
          <button
            type="button"
            onClick={onExitMiniMode}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Full View
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-warning-soft text-warning text-xs font-semibold flex items-center justify-between">
          <span>⏸ Queue Paused{pauseReason ? ` · ${pauseReason}` : ""}</span>
          <button
            type="button"
            onClick={onTogglePause}
            className="underline font-bold"
          >
            Resume
          </button>
        </div>
      )}

      {/* Active Patient */}
      <div className="gradient-bg rounded-2xl p-5 text-primary-foreground mb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-widest opacity-85 font-semibold">
            {calledVisitor ? "Currently In Consultation" : "Cabin Idle"}
          </span>
          {calledVisitor && (
            <ClinicTimerBadge
              calledAt={calledVisitor.called_at || null}
              expectedMinutes={expectedMinutes}
              light
            />
          )}
        </div>

        {calledVisitor ? (
          <>
            <div className="flex items-baseline gap-2.5 mt-1">
              <p className="text-4xl font-black">
                Token <AnimatedNumber value={calledVisitor.token_number} prefix="#" invertHighlight />
              </p>
              {calledVisitor.visitType && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                  {VISIT_TYPE_META[calledVisitor.visitType].short}
                </span>
              )}
            </div>
            <p className="text-sm opacity-90 mt-0.5">
              {calledVisitor.visitor_name || "Patient"}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={onRecall}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Bell className="w-3.5 h-3.5" /> Re-call
              </button>
              <button
                type="button"
                onClick={onSendToLab}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Sent to Lab
              </button>
              <button
                type="button"
                onClick={onNoShow}
                className="bg-white/15 hover:bg-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <UserX className="w-3.5 h-3.5" /> No-Show
              </button>
            </div>
          </>
        ) : (
          <p className="text-lg font-bold mt-2 opacity-90">
            Ready for next patient
          </p>
        )}
      </div>

      {/* Primary Giant Button */}
      <button
        type="button"
        onClick={onCallNext}
        disabled={callingNext || isQueueEmpty}
        className="w-full py-4 px-6 rounded-2xl gradient-bg text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
      >
        {isLastPatient ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Complete Consultation</span>
          </>
        ) : isQueueEmpty ? (
          <>
            <Phone className="w-5 h-5" />
            <span>No Patients Waiting</span>
          </>
        ) : (
          <>
            <Phone className="w-5 h-5" />
            <span>
              Call Next Patient{nextVisitor ? ` (#${nextVisitor.token_number})` : ""}
            </span>
          </>
        )}
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
          Space
        </span>
      </button>

      {/* Next Up + Pause */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {nextVisitor ? (
            <>
              Next up:{" "}
              <strong className="text-foreground">
                #{nextVisitor.token_number} {nextVisitor.visitor_name || "Patient"}
              </strong>
              {nextVisitor.visitType ? ` (${VISIT_TYPE_META[nextVisitor.visitType].short})` : ""}
              {waitingCount > 1 ? ` · +${waitingCount - 1} more` : ""}
            </>
          ) : (
            "Waiting room is clear"
          )}
        </span>
        <button
          type="button"
          onClick={onTogglePause}
          className="text-xs font-semibold text-warning hover:underline flex items-center gap-1"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3" /> Resume
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" /> Pause
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const ClinicWrapModal = ({
  open,
  onClose,
  clinicName,
  servedCount,
  avgWait,
  noShowCount,
}: {
  open: boolean;
  onClose: () => void;
  clinicName: string;
  servedCount: number;
  avgWait: number;
  noShowCount: number;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="OPD Shift Summary"
        className="bg-card border border-border rounded-3xl p-6 w-full max-w-md card-shadow relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-foreground">
          Smooth OPD Shift!
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          All patients at <strong>{clinicName}</strong> have been attended to.
        </p>

        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60">
            <p className="text-2xl font-black text-primary">{servedCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              Consulted
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60">
            <p className="text-2xl font-black text-foreground">
              {avgWait || 8}m
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              Avg Wait
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/60">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {noShowCount}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              No-Shows
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl gradient-bg text-primary-foreground font-bold text-sm hover:opacity-95 transition-opacity"
        >
          Done for Now
        </button>
      </div>
    </div>
  );
};
