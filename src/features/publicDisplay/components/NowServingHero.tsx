import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, PauseCircle } from "lucide-react";
import { PublicDisplayState } from "../types";

interface NowServingHeroProps {
  displayData: PublicDisplayState;
}

export const NowServingHero: React.FC<NowServingHeroProps> = ({ displayData }) => {
  const { currentToken, counterLabel, status, waitingCount, queueType } = displayData;

  const isPaused = status === "paused";
  const isClosed = status === "closed";
  const isEmpty = !currentToken && waitingCount === 0;

  const getServingLabel = () => {
    if (queueType === "restaurant") return "NOW SEATING";
    return "NOW SERVING";
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 rounded-3xl bg-card border-2 border-primary/30 shadow-2xl relative overflow-hidden text-center min-h-[360px] md:min-h-[460px]">
      {/* Decorative Ambient Radial Glow */}


      {/* PAUSED STATE */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 max-w-lg z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-soft text-warning font-black text-sm uppercase tracking-widest border border-warning/40">
            <PauseCircle className="w-5 h-5" />
            <span>QUEUE PAUSED</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground">
            Service Temporarily On Hold
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Please remain nearby. The counter will resume calling tokens shortly.
          </p>
        </motion.div>
      )}

      {/* CLOSED STATE */}
      {isClosed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 max-w-lg z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-black text-sm uppercase tracking-widest border border-border">
            <Clock className="w-5 h-5" />
            <span>QUEUE CLOSED</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground">
            Queue Closed for Today
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Check-ins are concluded for this session. Thank you for your patience.
          </p>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {!isPaused && !isClosed && isEmpty && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 max-w-lg z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-soft text-success font-black text-sm uppercase tracking-widest border border-success/40">
            <CheckCircle2 className="w-5 h-5" />
            <span>COUNTERS READY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground">
            No One is Waiting
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Scan the QR code to join immediately and be served next.
          </p>
        </motion.div>
      )}

      {/* ACTIVE NOW SERVING HERO */}
      {!isPaused && !isClosed && !isEmpty && (
        <div className="z-10 flex flex-col items-center justify-center space-y-4 w-full">
          {/* Header Tag */}
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-primary">
              {getServingLabel()}
            </span>
          </div>

          {/* Giant Number Transition with Smooth Spring Animation */}
          <div className="py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentToken || "empty"}
                initial={{ opacity: 0, y: -25, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="font-mono font-black text-7xl sm:text-9xl md:text-[10rem] lg:text-[11.5rem] tracking-tighter text-foreground leading-none drop-shadow-sm select-none"
              >
                {currentToken ? `#${currentToken}` : "—"}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Counter Label */}
          {counterLabel && (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-muted/60 border border-border text-foreground font-extrabold text-sm sm:text-base md:text-lg shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{counterLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
