import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Activity, CheckCircle, Clock, Users, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import SplitFlapText from "@/components/reactbits/SplitFlapText";
import Counter from "@/components/reactbits/Counter";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

const tabs = ["Live queue", "Insights", "Queue health", "Tokens"];

/**
 * A stylised frame of the operator surface with live interactive mechanics.
 */
export const DashboardPreview = () => {
  const [servingNum, setServingNum] = useState(95);
  const [inQueue, setInQueue] = useState(12);
  const [servedToday, setServedToday] = useState(148);
  const [noShows, setNoShows] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isPaused || manualMode) return;
    const t = setInterval(() => {
      setServingNum((n) => (n >= 98 ? 93 : n + 1));
    }, 4500);
    return () => clearInterval(t);
  }, [isPaused, manualMode]);

  const handleServeNext = () => {
    setManualMode(true);
    setIsPaused(false);
    setServingNum((n) => n + 1);
    setInQueue((q) => Math.max(0, q - 1));
    setServedToday((s) => s + 1);
    setStatusNotice(null);
  };

  const handleSkip = () => {
    setManualMode(true);
    setServingNum((n) => n + 1);
    setInQueue((q) => Math.max(0, q - 1));
    setNoShows((ns) => ns + 1);
    setStatusNotice(`Skipped A-${servingNum}`);
  };

  const handleRecall = () => {
    setManualMode(true);
    setStatusNotice(`Recalled A-${servingNum} to Counter 1`);
  };

  const handleTogglePause = () => {
    setManualMode(true);
    setIsPaused((p) => !p);
    setStatusNotice(null);
  };

  const queueRows = [
    { t: `A-${servingNum + 1}`, w: "waiting 3 min", s: "Next" },
    { t: `A-${servingNum + 2}`, w: "waiting 6 min", s: "" },
    { t: `A-${servingNum + 3}`, w: "waiting 9 min", s: "" },
    { t: `A-${servingNum + 4}`, w: "waiting 14 min", s: "Remote" },
  ];

  return (
    <section className="relative hero-stage py-12 sm:py-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 z-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl stage-text leading-[1.02]">
            Everything at the counter,
            <br />
            <span className="stage-accent">on one calm screen.</span>
          </h2>
          <p className="mt-4 sm:mt-5 stage-muted max-w-lg text-sm sm:text-lg leading-relaxed">
            Serve, skip, recall, pause, and transfer tokens with live wait forecasts, no-show protection,
            and peak-hour intelligence updating as the queue moves.
          </p>
        </div>

        {/* Product frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-14"
        >
          <div className="rounded-2xl bg-[hsl(var(--brand-navy))] border border-[hsl(var(--brand-cream)/0.08)] overflow-hidden shadow-xl">
            {/* Console Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 min-h-12 py-2 border-b border-[hsl(var(--brand-cream)/0.08)] bg-[hsl(var(--brand-navy))]">
              <span className="text-[11px] font-mono-caps text-cream/60 hidden sm:inline">Counter Desk</span>

              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs font-semibold">
                {tabs.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`whitespace-nowrap min-h-[36px] py-1 transition-all ${
                      activeTab === i
                        ? "stage-text border-b-2 border-[hsl(var(--brand-glow))] text-[hsl(var(--brand-glow))]"
                        : "stage-muted hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono-caps">
                {isPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    PAUSED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 stage-accent">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-glow))]" />
                    <span>Live Feed</span>
                  </span>
                )}
              </div>
            </div>

            {activeTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-[hsl(var(--brand-cream)/0.07)]">
                {/* Live Queue Column */}
                <div className="bg-[hsl(var(--brand-navy))] p-4 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-[hsl(var(--brand-cream)/0.04)] border border-[hsl(var(--brand-cream)/0.08)]">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] sm:text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold">Now serving</span>
                        {isPaused && (
                          <span className="text-[10px] font-mono-caps px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                            PAUSED
                          </span>
                        )}
                      </div>
                      <SplitFlapText
                        text={`A-${servingNum}`}
                        padTo={5}
                        charset="alphanumeric"
                        tileColor="#152b47"
                        textColor="#51c2c2"
                        fontSize="clamp(1.35rem, 5vw, 2.25rem)"
                        tileRadius={8}
                        gap={5}
                        flipsPerChar={4}
                        flipDuration={0.08}
                        intro={false}
                        loop={false}
                      />
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] sm:text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold">In queue</div>
                      <div className="font-display stage-text font-bold mt-1">
                        <Counter
                          value={inQueue}
                          fontSize="clamp(2rem, 7vw, 3rem)"
                          fontWeight={700}
                          textColor="#f4f2eb"
                        />
                      </div>
                    </div>
                  </div>

                  {statusNotice && (
                    <div className="mb-4 px-3.5 py-2 rounded-lg bg-[hsl(var(--brand-glow)/0.12)] border border-[hsl(var(--brand-glow)/0.3)] text-xs text-[hsl(var(--brand-glow))] font-medium">
                      {statusNotice}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {queueRows.map((r, i) => (
                      <div
                        key={r.t}
                        className="flex items-center gap-4 rounded-xl px-4 py-3 border border-[hsl(var(--brand-cream)/0.08)] transition-colors"
                        style={{ background: `hsl(var(--brand-cream) / ${i === 0 ? 0.08 : 0.03})` }}
                      >
                        <span className="font-display stage-text tabular-nums font-bold text-lg w-16">{r.t}</span>
                        <span className="text-xs stage-muted flex-1 font-medium">{r.w}</span>
                        {r.s && (
                          <span className="text-xs tracking-wider uppercase rounded-full px-2.5 py-0.5 stage-accent font-bold bg-[hsl(var(--brand-glow)/0.15)] border border-[hsl(var(--brand-glow)/0.4)]">
                            {r.s}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleServeNext}
                      className="col-span-2 sm:col-span-1 text-xs rounded-xl px-4 min-h-[44px] py-3 bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Serve Next Token
                    </button>

                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs rounded-xl px-3.5 min-h-[44px] py-3 bg-[hsl(var(--brand-cream)/0.06)] border border-[hsl(var(--brand-cream)/0.12)] stage-muted hover:text-white transition-colors"
                    >
                      Skip
                    </button>

                    <button
                      type="button"
                      onClick={handleRecall}
                      className="text-xs rounded-xl px-3.5 min-h-[44px] py-3 bg-[hsl(var(--brand-cream)/0.06)] border border-[hsl(var(--brand-cream)/0.12)] stage-muted hover:text-white transition-colors"
                    >
                      Recall
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className={`col-span-2 sm:col-span-1 text-xs rounded-xl px-3.5 min-h-[44px] py-3 border transition-colors ${
                        isPaused
                          ? "bg-amber-500/20 border-amber-400/40 text-amber-200 font-semibold"
                          : "bg-[hsl(var(--brand-cream)/0.06)] border-[hsl(var(--brand-cream)/0.12)] stage-muted hover:text-white"
                      }`}
                    >
                      {isPaused ? "Resume Queue" : "Pause Queue"}
                    </button>
                  </div>
                </div>

                {/* Intelligence & Analytics Column */}
                <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8 space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-xs tracking-[0.2em] uppercase stage-muted mb-3 font-mono-caps font-bold">
                      <span>Hourly Flow Intensity</span>
                      <span className="text-[hsl(var(--brand-glow))] flex items-center gap-1">
                        <Activity className="w-3 h-3" /> 5–7 PM Peak
                      </span>
                    </div>

                    <div className="flex items-end gap-2 h-28 p-2 rounded-xl bg-[hsl(var(--brand-cream)/0.03)] border border-[hsl(var(--brand-cream)/0.06)]">
                      {[24, 32, 44, 51, 58, 46, 39, 48, 64, 96, 92, 76].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            height: `${h}%`,
                            background:
                              h > 80
                                ? "hsl(var(--brand-glow))"
                                : "hsl(var(--brand-teal) / 0.45)",
                          }}
                          className="flex-1 rounded-t transition-all duration-300"
                        />
                      ))}
                    </div>

                    <div className="flex justify-between text-[0.6875rem] text-cream/40 mt-1.5 font-mono-caps">
                      <span>8 AM</span>
                      <span>12 PM</span>
                      <span>4 PM</span>
                      <span>8 PM</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Avg wait", v: "11 min", icon: Clock },
                      { l: "Served today", v: String(servedToday), icon: Users },
                      { l: "No-shows", v: String(noShows), icon: ShieldAlert },
                      { l: "Flow Health", v: "94 / 100", icon: TrendingUp },
                    ].map((m) => (
                      <SpotlightCard
                        key={m.l}
                        theme="dark"
                        spotlightColor="#51c2c2"
                        intensity={0.14}
                        className="!rounded-xl !p-3.5 border border-[hsl(var(--brand-cream)/0.08)] [--spotlight-card-surface:hsl(var(--brand-deep)/0.45)]"
                      >
                        <div className="flex items-center justify-between text-xs tracking-wider uppercase stage-muted font-mono-caps">
                          <span>{m.l}</span>
                          <m.icon className="w-3.5 h-3.5 text-[hsl(var(--brand-glow))]" />
                        </div>
                        <div className="font-display text-2xl stage-text font-bold mt-1">{m.v}</div>
                      </SpotlightCard>
                    ))}
                  </div>

                  <div className="rounded-xl border border-[hsl(var(--brand-glow)/0.35)] bg-[hsl(var(--brand-glow)/0.08)] p-4 shadow-sm">
                    <div className="text-xs tracking-[0.18em] uppercase stage-accent font-bold mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--brand-glow))]" />
                      QBlink Intelligence Dispatch
                    </div>
                    <p className="text-xs stage-muted leading-relaxed">
                      Peak load detected between 5–7 PM. Opening Counter 2 for those two hours is projected
                      to reduce customer wait times by 38%.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono-caps uppercase tracking-wider stage-muted">Throughput & Service Velocity</div>
                      <div className="text-xl font-display font-bold stage-text mt-1">Average 5.2 min per visitor</div>
                    </div>
                    <span className="text-xs font-mono-caps px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                      +18% faster vs last week
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Remote Join Share", value: "68%", sub: "QR + Link" },
                      { label: "Walk-In Recovery", value: "91%", sub: "Stayed until turn" },
                      { label: "Peak Window", value: "5–7 PM", sub: "34 tokens/hr" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-4 bg-[hsl(var(--brand-cream)/0.04)] border border-[hsl(var(--brand-cream)/0.08)]">
                        <div className="text-[11px] font-mono-caps stage-muted uppercase">{stat.label}</div>
                        <div className="text-2xl font-display font-bold stage-text mt-1">{stat.value}</div>
                        <div className="text-xs text-[hsl(var(--brand-glow))] mt-0.5">{stat.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[hsl(var(--brand-glow)/0.3)] bg-[hsl(var(--brand-glow)/0.08)] p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono-caps uppercase stage-accent font-bold mb-2">Recommended Action</div>
                    <p className="text-sm stage-text font-medium leading-relaxed">
                      Enable Counter 2 auto-routing at 4:45 PM to absorb evening walk-in surge before wait times cross 15 minutes.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[hsl(var(--brand-cream)/0.1)] text-xs stage-muted">
                    Projected impact: -38% peak wait
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6 bg-[hsl(var(--brand-cream)/0.04)] border border-[hsl(var(--brand-cream)/0.08)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono-caps uppercase stage-muted">Overall Flow Health</div>
                    <div className="text-4xl font-display font-bold text-emerald-300 mt-1">94 / 100</div>
                    <p className="text-xs stage-muted mt-2">All counters responsive. Zero stale tokens detected.</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-3">
                  {[
                    { name: "No-Show Guard", status: "Active", detail: "Auto-grace window: 4 min" },
                    { name: "Inactivity Auto-Pause", status: "Armed", detail: "Pauses after 60m idle" },
                    { name: "Alert Delivery", status: "99.4%", detail: "Browser + WhatsApp fallback" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl px-4 py-3 bg-[hsl(var(--brand-cream)/0.03)] border border-[hsl(var(--brand-cream)/0.08)]">
                      <div>
                        <div className="text-sm font-semibold stage-text">{item.name}</div>
                        <div className="text-xs stage-muted">{item.detail}</div>
                      </div>
                      <span className="text-xs font-mono-caps px-2.5 py-1 rounded-full bg-[hsl(var(--brand-glow)/0.15)] text-[hsl(var(--brand-glow))] border border-[hsl(var(--brand-glow)/0.3)]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono-caps uppercase tracking-wider stage-muted">Recent Token Ledger</div>
                  <div className="text-xs stage-accent font-mono-caps">Counter 1 · Today</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { token: `A-${servingNum}`, channel: "Counter 1", state: isPaused ? "Paused" : "Serving", tone: "text-emerald-300 border-emerald-400/30 bg-emerald-500/15" },
                    { token: `A-${servingNum - 1}`, channel: "QR Scan", state: "Completed · 4m", tone: "text-slate-300 border-slate-700 bg-slate-800/60" },
                    { token: `A-${servingNum - 2}`, channel: "Walk-in", state: "Completed · 6m", tone: "text-slate-300 border-slate-700 bg-slate-800/60" },
                    { token: `A-${servingNum + 1}`, channel: "QR Scan", state: "Next in line", tone: "text-[hsl(var(--brand-glow))] border-[hsl(var(--brand-glow)/0.3)] bg-[hsl(var(--brand-glow)/0.12)]" },
                    { token: `A-${servingNum + 2}`, channel: "Remote Link", state: "Waiting · 6m", tone: "text-slate-300 border-slate-700 bg-slate-800/60" },
                    { token: `A-${servingNum + 3}`, channel: "QR Scan", state: "Waiting · 9m", tone: "text-slate-300 border-slate-700 bg-slate-800/60" },
                  ].map((item) => (
                    <div key={item.token} className="rounded-xl p-3.5 bg-[hsl(var(--brand-cream)/0.03)] border border-[hsl(var(--brand-cream)/0.08)] flex items-center justify-between">
                      <div>
                        <div className="font-display font-bold text-base stage-text tabular-nums">{item.token}</div>
                        <div className="text-xs stage-muted">{item.channel}</div>
                      </div>
                      <span className={`text-[11px] font-mono-caps px-2.5 py-0.5 rounded-full border ${item.tone}`}>
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="mt-10">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 text-sm stage-accent hover:brightness-125 transition font-semibold"
          >
            Launch your own live operator counter
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};
