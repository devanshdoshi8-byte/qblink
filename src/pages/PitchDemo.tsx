import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Laptop,
  Smartphone,
  ChevronRight,
  Info,
  Stethoscope,
  Coffee,
  Scissors,
  Landmark,
} from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import {
  IndustryType,
  INDUSTRY_PRESETS,
  PitchSimulatorState,
  createInitialPitchState,
  callNextVisitor,
  serveCurrentVisitor,
  simulateTrafficWalkins,
  requestGrace,
} from "@/lib/pitchSimulationEngine";
import { StaffConsoleMockup } from "@/components/pitch/StaffConsoleMockup";
import { CustomerMobileMockup } from "@/components/pitch/CustomerMobileMockup";

export const PitchDemo: React.FC = () => {
  const [industry, setIndustry] = useState<IndustryType>("clinic");
  const [state, setState] = useState<PitchSimulatorState>(() => createInitialPitchState("clinic"));
  const [autoPlay, setAutoPlay] = useState(false);
  const [syncPulse, setSyncPulse] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger sync pulse animation between devices on state changes
  const triggerSyncEffect = () => {
    setSyncPulse(true);
    setTimeout(() => setSyncPulse(false), 800);
  };

  const handleCallNext = () => {
    setState((prev) => callNextVisitor(prev));
    triggerSyncEffect();
  };

  const handleServeCurrent = () => {
    setState((prev) => serveCurrentVisitor(prev));
    triggerSyncEffect();
  };

  const handleSimulateTraffic = () => {
    setState((prev) => simulateTrafficWalkins(prev));
    triggerSyncEffect();
  };

  const handleRequestGrace = () => {
    setState((prev) => requestGrace(prev));
    triggerSyncEffect();
  };

  const handleTogglePause = () => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
    triggerSyncEffect();
  };

  const handleReset = (ind: IndustryType = industry) => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    setAutoPlay(false);
    setState(createInitialPitchState(ind));
    triggerSyncEffect();
  };

  const handleIndustryChange = (newInd: IndustryType) => {
    setIndustry(newInd);
    handleReset(newInd);
  };

  // Keyboard shortcut: Spacebar triggers Call Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleCallNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Automated Guided Pitch Tour
  const startAutoTour = () => {
    handleReset();
    setAutoPlay(true);
    let step = 0;

    autoPlayTimerRef.current = setInterval(() => {
      step++;
      if (step === 1) {
        // Step 1: Call next #1
        handleCallNext();
      } else if (step === 2) {
        // Step 2: Call next #2
        handleCallNext();
      } else if (step === 3) {
        // Step 3: Call next #3 (User is now next!)
        handleCallNext();
      } else if (step === 4) {
        // Step 4: User requests 2 min grace
        handleRequestGrace();
      } else if (step === 5) {
        // Step 5: Staff calls user to counter
        handleCallNext();
      } else if (step >= 6) {
        if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
        setAutoPlay(false);
      }
    }, 3800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-28 selection:bg-primary selection:text-white">
      {/* Top Pitch Navigation & Control Strip */}
      <header className="border-b border-[hsl(var(--brand-cream)/0.1)] bg-[hsl(var(--brand-navy)/0.92)] backdrop-blur-xl px-4 sm:px-8 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 min-h-[40px] text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to QBlink</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <img src={logo} alt="QBlink" className="w-6 h-6 object-contain" />
              <span className="font-display font-extrabold text-sm tracking-tight text-white">
                Live Pitch Simulator
              </span>
            </div>
          </div>

          {/* Industry Preset Selector */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {(Object.keys(INDUSTRY_PRESETS) as IndustryType[]).map((key) => {
              const config = INDUSTRY_PRESETS[key];
              const isSelected = industry === key;
              const Icon =
                key === "clinic"
                  ? Stethoscope
                  : key === "cafe"
                  ? Coffee
                  : key === "salon"
                  ? Scissors
                  : Landmark;
              return (
                <button
                  key={key}
                  onClick={() => handleIndustryChange(key)}
                  className={`inline-flex items-center justify-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Pitch Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={startAutoTour}
              disabled={autoPlay}
              className={`flex-1 sm:flex-initial justify-center min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                autoPlay
                  ? "bg-warning-soft text-warning border border-warning/40"
                  : "bg-success-soft border border-success/30 text-success hover:bg-success/15"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{autoPlay ? "Tour in Progress…" : "60s Guided Tour"}</span>
            </button>

            <button
              onClick={() => handleReset()}
              className="flex-1 sm:flex-initial justify-center min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Screen Showcase Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1 flex flex-col justify-center w-full">
        {/* Presenter Objective Subtitle */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-widest mb-2">
            <Smartphone className="w-3.5 h-3.5" /> Dual-Device Interactive Showcase
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            One Single Platform. Two Synchronized Views.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl mx-auto">
            Click <strong className="text-primary font-bold">"Call Next Guest"</strong> on the counter terminal and watch the customer's phone update in sub-10 milliseconds.
          </p>
        </div>

        {/* Dual Panels Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* LEFT: Business / Staff Console Mockup (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-[460px] lg:h-[620px]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              <Laptop className="w-4 h-4 text-primary" />
              <span>Business / Staff Counter Terminal (Desktop)</span>
            </div>
            <StaffConsoleMockup
              state={state}
              onCallNext={handleCallNext}
              onServeCurrent={handleServeCurrent}
              onSimulateTraffic={handleSimulateTraffic}
              onTogglePause={handleTogglePause}
            />
          </div>

          {/* MIDDLE: Realtime WebSocket Sync Cable / Indicator */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-3">
            <div className="h-20 w-[2px] bg-primary/40" />
            <motion.div
              animate={{
                scale: syncPulse ? [1, 1.35, 1] : 1,
                boxShadow: syncPulse
                  ? "0 0 25px hsl(var(--primary))"
                  : "0 0 0px transparent",
              }}
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-primary text-primary flex items-center justify-center shadow-lg"
            >
              <Zap className="w-5 h-5" />
            </motion.div>
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center">
              Instant Sync
            </span>
            <div className="h-20 w-[2px] bg-primary/40" />
          </div>

          {/* RIGHT: Customer Mobile Phone Mockup (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-center sm:self-start px-1">
              <Smartphone className="w-4 h-4 text-success" />
              <span>Customer Mobile Ticket (Browser)</span>
            </div>
            <CustomerMobileMockup
              state={state}
              onRequestGrace={handleRequestGrace}
            />
          </div>
        </div>
      </main>

      {/* Presenter Pitch Summary Strip (Bottom) */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 px-5 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">100% Zero-App Entry</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Guests never download apps or enter credit cards. Real-time browser websocket keeps them updated everywhere.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Zap className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Dynamic Rolling Wait Engine</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Adapts accurately to recent service speeds, preventing walkaways and customer frustration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Arrival Grace System</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The "I'm 2 mins away" action reduces missed turns and staff friction by over 90%.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PitchDemo;
