import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, Zap, Check, ArrowUpRight } from "lucide-react";
import { useOptionalTheme } from "@/hooks/useTheme";
import BorderGlow from "@/components/reactbits/BorderGlow";
import Counter from "@/components/reactbits/Counter";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

export const ReliefBento = () => {
  const [pos, setPos] = useState(3);
  const themeCtx = useOptionalTheme();
  const isDark = themeCtx?.theme === "dark";

  useEffect(() => {
    const t = setInterval(() => setPos((p) => (p <= 1 ? 5 : p - 1)), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="relative ink-surface py-12 sm:py-24 overflow-hidden grain"
      aria-label="The relief layer"
    >
      {/* Ambient background glow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 relative z-10">
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl text-cream leading-[0.98] max-w-3xl">
          What replaces the anxiety
          <br />
          <span className="text-glow italic font-normal">of standing in line.</span>
        </h2>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
          {/* Big Live Position Widget */}
          <div className="md:col-span-4 md:row-span-3">
            <BorderGlow
              edgeSensitivity={30}
              glowColor={isDark ? "180 48 54" : "195 78 28"}
              backgroundColor={isDark ? "#1a3552" : "#f3f1ec"}
              surfaceTheme={isDark ? "dark" : "light"}
              borderRadius={24}
              glowRadius={40}
              glowIntensity={0.85}
              coneSpread={25}
              animated={false}
              colors={isDark ? ["#51c2c2", "#10637f", "#f4f2eb"] : ["#10637f", "#51c2c2", "#0e1e34"]}
              fillOpacity={0.32}
              className="h-full shadow-2xl"
            >
              <div className="p-5 sm:p-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-center font-mono-caps text-cream/70 text-[11px] sm:text-xs gap-2">
                  <span className="flex items-center gap-2 font-bold">
                    <Radio className="w-4 h-4 text-glow shrink-0" /> LIVE STREAMING POSITION
                  </span>
                  <span className="px-2.5 sm:px-3 py-1 rounded-full bg-glow/15 border border-glow/30 text-glow font-bold text-[10px] sm:text-[11px] flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-glow" /> Realtime
                  </span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-end gap-4 sm:gap-10 my-5 sm:my-8">
                  <div className="font-display text-cream font-black leading-none tracking-tighter">
                    <Counter
                      value={pos}
                      fontSize="clamp(3.25rem, 12vw, 8.5rem)"
                      fontWeight={900}
                      textColor="hsl(var(--cream))"
                      duration={550}
                      bounce={0.25}
                    />
                  </div>

                  <div className="pb-2 sm:pb-8">
                    <div className="font-mono-caps text-cream/50 text-xs sm:text-sm font-semibold tracking-wider">AHEAD OF YOU</div>
                    <div className="font-display text-2xl sm:text-4xl text-glow font-bold mt-1 tabular-nums flex items-baseline">
                      <Counter
                        value={pos * 2 + 2}
                        prefix="~"
                        suffix=" min"
                        fontSize="clamp(1.5rem, 6vw, 2.25rem)"
                        fontWeight={700}
                        textColor="hsl(var(--glow))"
                        duration={500}
                        bounce={0.2}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Step Progress Track */}
                <div>
                  <div className="flex gap-1 sm:gap-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className={`h-5 sm:h-7 flex-1 rounded-md transition-colors duration-500 ${
                          i < 20 - pos * 4 ? "bg-gradient-to-t from-glow to-teal shadow-sm shadow-glow/30" : "bg-cream/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between font-mono-caps text-cream/50 text-xs mt-4">
                    <span>01 Joined #A-42</span>
                    <span className="text-glow font-semibold">Moving steadily</span>
                    <span>Counter 2</span>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Friction Removed Card */}
          <div
            className="md:col-span-2 md:row-span-2 relative cream-surface p-8 rounded-3xl flex flex-col justify-between shadow-xl border border-border group"
          >
            <div className="font-mono-caps text-ink/60 text-xs font-bold tracking-wider">
              FRICTION ELIMINATED
            </div>
            <div className="my-auto space-y-1">
              <div className="font-display text-4xl sm:text-5xl text-ink font-bold leading-none">No app.</div>
              <div className="font-display text-3xl sm:text-4xl text-ink/30 line-through leading-none decoration-destructive decoration-2">
                Install.
              </div>
              <div className="font-display text-3xl sm:text-4xl text-ink/30 line-through leading-none decoration-destructive decoration-2">
                Sign up.
              </div>
              <div className="font-display text-3xl sm:text-4xl text-ink-accent font-bold leading-none pt-2 flex items-center gap-2">
                Just a link <ArrowUpRight className="w-7 h-7" />
              </div>
            </div>
            <div className="text-xs text-ink/60 font-medium">100% web-native in any browser</div>
          </div>

          {/* Pull Quote Card */}
          <div
            className="md:col-span-2 md:row-span-2 relative rounded-3xl bg-gradient-to-b from-deep/50 to-deep/20 border border-glow/25 p-8 flex flex-col justify-between shadow-xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-glow/15 border border-glow/30 flex items-center justify-center text-glow">
              <Radio className="w-5 h-5" />
            </div>
            <div className="font-display text-lg sm:text-xl text-cream italic leading-relaxed my-3 font-medium">
              "Staff can finally focus on patient registrations instead of answering repetitive queue questions."
            </div>
            <div className="font-mono-caps text-glow/80 text-xs font-semibold">— Dr. Ambrish Patange, Sterling Care Clinic</div>
          </div>

          {/* Zero Hardware Card */}
          <SpotlightCard
            theme={isDark ? "dark" : "light"}
            spotlightColor={isDark ? "#51c2c2" : "#10637f"}
            intensity={0.14}
            className="md:col-span-2 md:row-span-1 border border-glow/20 !p-6 !rounded-2xl flex items-center justify-between shadow-lg [--spotlight-card-surface:hsl(var(--deep))]"
          >
            <div>
              <div className="font-mono-caps text-cream/50 text-xs font-semibold">HARDWARE NEEDED</div>
              <div className="font-display text-3xl text-cream font-bold mt-0.5">Zero.</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-glow/10 border border-glow/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-glow" />
            </div>
          </SpotlightCard>

          {/* Setup Time Card */}
          <SpotlightCard
            theme={isDark ? "dark" : "light"}
            spotlightColor={isDark ? "#51c2c2" : "#10637f"}
            intensity={0.14}
            className="md:col-span-2 md:row-span-1 border border-glow/20 !p-6 !rounded-2xl flex items-center justify-between shadow-lg [--spotlight-card-surface:hsl(var(--deep))]"
          >
            <div>
              <div className="font-mono-caps text-glow/80 text-xs font-semibold">TIME TO GO LIVE</div>
              <div className="font-display text-3xl text-cream font-bold mt-0.5">&lt; 2 minutes</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center">
              <Check className="w-6 h-6 text-success" />
            </div>
          </SpotlightCard>

          {/* Autonomous Insights Card — spans full width to eliminate grid void */}
          <SpotlightCard
            theme={isDark ? "dark" : "light"}
            spotlightColor={isDark ? "#51c2c2" : "#10637f"}
            intensity={0.14}
            className="md:col-span-6 border border-glow/20 !p-6 !rounded-2xl flex items-center justify-between shadow-lg [--spotlight-card-surface:hsl(var(--deep))]"
          >
            <div>
              <div className="font-mono-caps text-cream/50 text-xs font-semibold">INTELLIGENCE</div>
              <div className="font-display text-xl text-cream font-bold leading-tight mt-0.5">
                Peak prediction & walk-out prevention
              </div>
            </div>
            <div className="flex items-center gap-1 h-6">
              <span className="w-1 rounded-full bg-glow animate-bar-1" />
              <span className="w-1 rounded-full bg-glow animate-bar-3" />
              <span className="w-1 rounded-full bg-glow animate-bar-5" />
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
};