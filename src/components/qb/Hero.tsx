import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, Clock, Play, QrCode, Users } from "lucide-react";
import GradientASCII from "@/components/reactbits/GradientASCII";
import GlassSurface from "@/components/reactbits/GlassSurface";
import BorderGlow from "@/components/reactbits/BorderGlow";
import Counter from "@/components/reactbits/Counter";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { savePreferredRole } from "@/lib/storage/cookieStorage";

const proof = [
  { k: "0", v: "apps to install" },
  { k: "0", v: "hardware to buy" },
  { k: "<2 min", v: "to go live" },
  { k: "Live", v: "position, everywhere" },
];

/**
 * Combined Hero — fuses Maritime Navy + Coastal Teal GradientASCII & GlassSurface
 * with Inventure IIT Gandhinagar institutional recognition, direct Customer/Business
 * onboarding with cookie role memory, and the 1st-month-free / ₹499 self-sustainable model.
 */
export const Hero = () => {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const { roles } = useUserRole();

  const customerHref = user
    ? (roles.includes("customer") ? "/customer-dashboard" : "/auth/customer")
    : "/auth/customer";

  const businessHref = user
    ? (roles.includes("business") ? "/dashboard" : "/auth/business")
    : "/auth/business";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const liveServing = step === 0 ? 14 : step === 1 ? 15 : 17;
  const aheadCount = step === 0 ? 2 : step === 1 ? 1 : 0;
  const etaMins = aheadCount * 3;
  const flowStages = [
    { label: "QR Scanned", sub: "Your Token #17 issued in browser" },
    {
      label: "Wait Anywhere",
      sub: aheadCount > 0 ? `${aheadCount} ahead · live sync` : "Live sync active",
    },
    { label: "Turn Ready", sub: "Proceed to Counter 1" },
  ];

  return (
    <section id="product" className="relative min-h-0 lg:min-h-[92svh] hero-stage overflow-hidden flex items-center">
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
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-24 sm:pt-32 pb-12 sm:pb-24 w-full">
        <div className="grid lg:grid-cols-12 lg:items-center gap-8 lg:gap-12">
          <div className="w-full lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full glass-panel px-3.5 py-1.5 mb-5 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-glow))] animate-tick" />
              <span className="text-[0.7rem] tracking-[0.16em] uppercase stage-muted font-medium">
                Customer Flow Intelligence · Inventure, IIT Gandhinagar
              </span>
            </div>

            <h1 className="font-serif font-semibold text-[2.15rem] sm:text-5xl lg:text-7xl xl:text-[4.75rem] leading-[1.04] tracking-tight stage-text">
              <span className="inline-block first-letter:text-[1.15em] first-letter:leading-none">
                The line still exists.
              </span>
              <span className="block stage-accent">Nobody has to stand in it.</span>
            </h1>

            <p className="mt-5 sm:mt-7 text-sm sm:text-lg stage-muted max-w-xl leading-relaxed">
              Qblink turns walk-in chaos into a measured flow. Customers scan, hold their place from
              anywhere, and arrive at the exact minute they're needed — while your counter runs on
              live position data, forecasts, and operational intelligence.
            </p>

            <div className="mt-7 sm:mt-9 flex flex-col gap-3.5 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-3">
                <Link
                  to={customerHref}
                  onClick={() => savePreferredRole("customer")}
                  className="group w-full sm:w-auto min-h-[52px] inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-semibold px-5 py-3.5 shadow-md hover:brightness-110 transition-all active:scale-[0.99]"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-bold leading-tight flex items-center gap-1.5">
                      <span>Join as a Customer</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[11px] font-medium text-[hsl(var(--brand-navy)/0.8)] leading-tight mt-0.5">
                      Scan QR or track live wait
                    </div>
                  </div>
                </Link>

                <Link
                  to={businessHref}
                  onClick={() => savePreferredRole("business")}
                  className="group w-full sm:w-auto min-h-[52px] inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--brand-cream)/0.08)] stage-text font-semibold px-5 py-3.5 hover:bg-[hsl(var(--brand-cream)/0.16)] transition-colors border border-[hsl(var(--brand-glow)/0.45)] shadow-md active:scale-[0.99]"
                >
                  <Building2 className="w-4 h-4 text-[hsl(var(--brand-glow))] shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-bold leading-tight flex items-center gap-1.5">
                      <span>Join as a Business</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[11px] stage-muted leading-tight mt-0.5">
                      Run your clinic or counter queue
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/pitch"
                  className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand-glow)/0.35)] bg-[hsl(var(--brand-glow)/0.1)] px-4 min-h-[38px] text-xs font-semibold text-[hsl(var(--brand-glow))] hover:bg-[hsl(var(--brand-glow)/0.2)] transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Try Pitch Demo</span>
                </Link>
                <a
                  href="#customer-journey"
                  className="inline-flex items-center gap-2 rounded-full glass-panel stage-text px-4 min-h-[38px] text-xs font-medium hover:bg-[hsl(var(--brand-cream)/0.1)] transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Demo Pass</span>
                </a>
              </div>

              <p className="text-xs stage-muted flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>1st month completely free · Thereafter ₹499/mo self-sustainable social initiative</span>
              </p>
            </div>

            <dl className="mt-8 sm:mt-12 max-w-xl">
              <GlassSurface
                width="100%"
                height="auto"
                borderRadius={20}
                backgroundOpacity={0.07}
                opacity={1}
                blur={14}
                displace={0.35}
                distortionScale={-140}
                className="px-4 sm:px-6 py-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 w-full">
                  {proof.map((p, i) => (
                    <div
                      key={p.v}
                      className={`${i !== 0 ? "sm:border-l sm:border-[hsl(var(--brand-cream)/0.14)] sm:pl-4" : ""}`}
                    >
                      <dt className="font-display text-xl sm:text-2xl stage-text tracking-tight font-bold">{p.k}</dt>
                      <dd className="text-xs sm:text-[0.8125rem] stage-muted mt-0.5 leading-snug">{p.v}</dd>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            </dl>
          </div>

          <div className="lg:col-span-5">
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
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-65"
        aria-hidden
      >
        <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
          <path d="M2 2l8 8 8-8" stroke="hsl(var(--brand-cream))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
};
