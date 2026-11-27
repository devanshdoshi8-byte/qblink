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
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setServingNum((n) => (n >= 98 ? 93 : n + 1));
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const queueRows = [
    { t: `A-${servingNum + 1}`, w: "waiting 3 min", s: "Next" },
    { t: `A-${servingNum + 2}`, w: "waiting 6 min", s: "" },
    { t: `A-${servingNum + 3}`, w: "waiting 9 min", s: "" },
    { t: `A-${servingNum + 4}`, w: "waiting 14 min", s: "Remote" },
  ];

  return (
    <section className="relative hero-stage py-24 sm:py-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 z-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl stage-text leading-[1.02]">
            Everything at the counter,
            <br />
            <span className="stage-accent">on one calm screen.</span>
          </h2>
          <p className="mt-5 stage-muted max-w-lg text-base sm:text-lg leading-relaxed">
            Serve, skip, recall, pause and transfer — with live wait forecasts, no-show protection
            and peak-hour intelligence updating as the queue moves.
          </p>
        </div>

        {/* Product frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14"
        >
          <div className="rounded-2xl bg-[hsl(var(--brand-navy))] border border-[hsl(var(--brand-cream)/0.08)] overflow-hidden shadow-xl">
            {/* Console Bar */}
            <div className="flex items-center justify-between px-5 h-12 border-b border-[hsl(var(--brand-cream)/0.08)] bg-[hsl(var(--brand-navy))]">
              <span className="text-[11px] font-mono-caps text-cream/60 hidden sm:inline">Counter Desk</span>

              <div className="flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
                {tabs.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`whitespace-nowrap pb-1 transition-all ${
                      activeTab === i
                        ? "stage-text border-b-2 border-[hsl(var(--brand-glow))] text-[hsl(var(--brand-glow))]"
                        : "stage-muted hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] stage-accent font-mono-caps">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-glow))]" />
                <span>Live Feed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-[hsl(var(--brand-cream)/0.07)]">
              {/* Live Queue Column */}
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-[hsl(var(--brand-cream)/0.04)] border border-[hsl(var(--brand-cream)/0.08)]">
                  <div>
                    <div className="text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold mb-2">Now serving</div>
                    <SplitFlapText
                      text={`A-${servingNum}`}
                      charset="alphanumeric"
                      tileColor="#152b47"
                      textColor="#51c2c2"
                      fontSize="2.25rem"
                      tileRadius={8}
                      gap={5}
                      flipsPerChar={4}
                      flipDuration={0.08}
                      intro={false}
                      loop={false}
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold">In queue</div>
                    <div className="font-display stage-text font-bold mt-1">
                      <Counter
                        value={12}
                        fontSize="3rem"
                        fontWeight={700}
                        textColor="#f4f2eb"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {queueRows.map((r, i) => (
                    <motion.div
                      key={r.t}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
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
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setServingNum((n) => n + 1)}
                    className="text-xs rounded-xl px-4 py-3 bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Serve Next Token
                  </button>

                  {["Skip", "Recall", "Pause Queue"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      className="text-xs rounded-xl px-3.5 py-3 bg-[hsl(var(--brand-cream)/0.06)] border border-[hsl(var(--brand-cream)/0.12)] stage-muted hover:text-white transition-colors"
                    >
                      {b}
                    </button>
                  ))}
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
                    {[28, 41, 36, 52, 74, 96, 88, 61, 44, 33, 47, 39].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        className="flex-1 rounded-t transition-colors"
                        style={{
                          background:
                            h > 80
                              ? "hsl(var(--brand-glow))"
                              : "hsl(var(--brand-teal) / 0.45)",
                        }}
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
                    { l: "Served today", v: "148", icon: Users },
                    { l: "No-shows", v: "4", icon: ShieldAlert },
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
                    Qblink Intelligence Dispatch
                  </div>
                  <p className="text-xs stage-muted leading-relaxed">
                    Peak load detected between 5–7 PM. Opening Counter 2 for those two hours is projected
                    to reduce customer wait times by 38%.
                  </p>
                </div>
              </div>
            </div>
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
