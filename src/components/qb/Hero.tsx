import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, QrCode, Users } from "lucide-react";
import { motion } from "framer-motion";
import SpecularButton from "@/components/reactbits/SpecularButton";
import GradientASCII from "@/components/reactbits/GradientASCII";
import GlassSurface from "@/components/reactbits/GlassSurface";
import BorderGlow from "@/components/reactbits/BorderGlow";
import Counter from "@/components/reactbits/Counter";

const proof = [
  { k: "0", v: "apps to install" },
  { k: "0", v: "hardware to buy" },
  { k: "<2 min", v: "to go live" },
  { k: "Live", v: "position, everywhere" },
];

/**
 * Hero — the product stage. Uses an interactive GradientASCII background
 * calibrated to Maritime Navy and Coastal Teal behind the value proposition.
 */
export const Hero = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const liveServing = 14 + step;
  const aheadCount = Math.max(0, 2 - step);
  const etaMins = aheadCount * 3;
  const flowStages = [
    { label: "QR Scanned", sub: "Token #17 issued in browser" },
    { label: "Wait Anywhere", sub: "2 ahead · live position sync" },
    { label: "Turn Ready", sub: "Proceed to Counter 1" },
  ];

  return (
    <section id="product" className="relative min-h-[94vh] hero-stage overflow-hidden flex items-center">
      <div className="absolute inset-0" aria-hidden="true">
        <GradientASCII
          colors={["#0e1e34", "#10637f", "#51c2c2", "#f4f2eb"]}
          shape="horizon"
          characters=" =+xX0S8#@"
          cellSize={18}
          density={0.85}
          glow={0.35}
          flicker={0}
          grain={0}
          gradientOpacity={0.55}
          glyphOpacity={0.65}
          speed={0.6}
          intro={false}
          mouseInteraction={false}
          clickEffect="none"
        />
      </div>

      {/* Legibility scrim: keeps the headline column readable over the moving ASCII field. */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-2/3 bg-gradient-to-r from-[hsl(var(--brand-navy)/0.92)] via-[hsl(var(--brand-navy)/0.65)] to-transparent pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24 w-full">
        <div className="grid lg:grid-cols-12 lg:items-center gap-10 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:col-span-7"
        >
          <p className="font-mono-caps text-xs tracking-[0.18em] uppercase stage-muted font-medium mb-5">
            Customer Flow Intelligence Platform
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif font-semibold text-[2.75rem] sm:text-6xl lg:text-7xl xl:text-[5rem] leading-[1.02] tracking-tight stage-text"
          >
            <span className="inline-block first-letter:text-[1.18em] first-letter:leading-none">
              The line still exists
            </span>
            <span className="block stage-accent">Nobody has to stand in it</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-base sm:text-lg stage-muted max-w-xl leading-relaxed"
          >
            Qblink turns walk-in chaos into a measured flow. Customers scan, hold their place from
            anywhere, and arrive at the exact minute they're needed — while your counter runs on
            live position data, forecasts and operational intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3.5"
          >
            <div>
              <Link
                to="/auth"
                className="group relative inline-flex items-center gap-2.5 rounded-xl bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-semibold px-6 py-3.5 shadow-sm hover:opacity-95 transition-opacity"
              >
                Start free pilot
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div>
              <SpecularButton
                size="md"
                radius={14}
                tint="#51c2c2"
                tintOpacity={0.14}
                textColor="#f4f2eb"
                lineColor="#51c2c2"
                baseColor="#10637f"
                intensity={1}
                idleIntensity={0.35}
                shineSize={10}
                shineFade={34}
                thickness={1.2}
                glow={1}
                followMouse
                proximity={250}
                onClick={() => navigate("/pitch")}
                className="!px-5 !py-3.5 !text-sm !font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-success" />
                Try Pitch Demo
              </SpecularButton>
            </div>

            <div>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--brand-cream)/0.06)] stage-text font-medium px-5 py-3.5 hover:bg-[hsl(var(--brand-cream)/0.12)] transition-colors border border-[hsl(var(--brand-cream)/0.18)]"
              >
                <QrCode className="w-4 h-4 text-[hsl(var(--brand-glow))]" />
                See customer journey
              </Link>
            </div>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 max-w-xl"
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={20}
              backgroundOpacity={0.07}
              opacity={1}
              blur={14}
              displace={0.35}
              distortionScale={-140}
              className="px-6 py-4"
            >
              <div className="flex w-full flex-wrap gap-y-6 gap-x-6">
                {proof.map((p, i) => (
                  <div
                    key={p.v}
                    className={`flex items-center gap-6 ${i !== 0 ? 'sm:border-l sm:border-[hsl(var(--brand-cream)/0.14)] sm:pl-6' : ''}`}
                  >
                    <div>
                      <dt className="font-display text-2xl stage-text tracking-tight font-bold">{p.k}</dt>
                      <dd className="text-[0.8125rem] stage-muted mt-0.5 leading-snug">{p.v}</dd>
                    </div>
                  </div>
                ))}
              </div>
            </GlassSurface>
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block lg:col-span-5"
        >
          <BorderGlow
            backgroundColor="#0d1b2e"
            borderRadius={24}
            glowColor="180 54 54"
            glowRadius={42}
            glowIntensity={0.9}
            colors={["#51c2c2", "#10637f", "#f4f2eb"]}
            surfaceTheme="dark"
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={22}
              backgroundOpacity={0.05}
              opacity={1}
              blur={14}
              displace={0.3}
              distortionScale={-120}
              className="!border-0 p-6"
            >
              <div className="w-full space-y-5">
                <div className="flex items-center justify-between text-xs font-mono-caps">
                  <span className="text-[hsl(var(--brand-glow))] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Live Queue Flow
                  </span>
                  <span className="text-[hsl(var(--brand-cream)/0.55)]">Counter 1</span>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--brand-cream)/0.12)] bg-[hsl(var(--brand-navy)/0.65)] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono-caps text-[hsl(var(--brand-cream)/0.55)]">
                      NOW SERVING
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 font-display text-4xl font-bold text-[hsl(var(--brand-cream))]">
                      <span>#</span>
                      <Counter value={liveServing} fontSize={36} places={[10, 1]} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--brand-glow)/0.15)] border border-[hsl(var(--brand-glow)/0.3)] px-3 py-1 text-xs font-semibold text-[hsl(var(--brand-glow))]">
                      <Clock className="w-3.5 h-3.5" />
                      {etaMins === 0 ? "Your turn" : `~${etaMins} min wait`}
                    </div>
                    <div className="mt-2 text-xs text-[hsl(var(--brand-cream)/0.65)] flex items-center justify-end gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[hsl(var(--brand-glow))]" />
                      {aheadCount === 0 ? "Proceed to desk" : `${aheadCount} ahead of #17`}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {flowStages.map((stage, idx) => {
                    const active = idx === step;
                    const done = idx < step;
                    return (
                      <div
                        key={stage.label}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-colors duration-300 ${
                          active
                            ? "border-[hsl(var(--brand-glow)/0.5)] bg-[hsl(var(--brand-glow)/0.12)]"
                            : "border-[hsl(var(--brand-cream)/0.08)] bg-[hsl(var(--brand-navy)/0.35)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              active || done
                                ? "text-[hsl(var(--brand-glow))]"
                                : "text-[hsl(var(--brand-cream)/0.35)]"
                            }`}
                          />
                          <div>
                            <div className="text-xs font-semibold text-[hsl(var(--brand-cream))]">
                              {stage.label}
                            </div>
                            <div className="text-[11px] text-[hsl(var(--brand-cream)/0.6)]">
                              {stage.sub}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono-caps text-[hsl(var(--brand-glow))]">
                          {active ? "LIVE" : done ? "DONE" : "NEXT"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassSurface>
          </BorderGlow>
        </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path d="M2 2l8 8 8-8" stroke="hsl(var(--brand-cream))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </section>
  );
};
