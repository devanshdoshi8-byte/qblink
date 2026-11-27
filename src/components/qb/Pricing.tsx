import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useOptionalTheme } from "@/hooks/useTheme";
import BorderGlow from "@/components/reactbits/BorderGlow";

export interface PlanDef {
  id: "free" | "starter" | "growth" | "enterprise";
  name: string;
  price: string;
  cadence: string;
  line: string;
  features: string[];
  cta: string;
  to: string;
  featured?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    line: "For a single counter finding its rhythm.",
    features: ["1 queue", "Up to 50 customers / day", "QR + link join", "Live position for customers", "Basic daily summary"],
    cta: "Start free",
    to: "/auth",
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹799",
    cadence: "per month",
    line: "For a busy front desk that can't keep answering \"how long?\".",
    features: ["3 queues / counters", "Unlimited customers", "No-show & arrival window control", "7-day analytics history", "Public display screen"],
    cta: "Start Starter",
    to: "/auth",
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹1,999",
    cadence: "per month",
    line: "For multi-counter operations that run on numbers.",
    features: ["Unlimited queues & counters", "Staff accounts & permissions", "Full analytics + peak-hour intelligence", "Restaurant seating & party routing", "AI recommendations", "Priority support"],
    cta: "Start Growth",
    to: "/auth",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "talk to us",
    line: "For chains, hospital groups and multi-location networks.",
    features: ["Multi-location rollout", "SSO & advanced roles", "API access & integrations", "Custom SLAs", "Dedicated onboarding"],
    cta: "Book a demo",
    to: "/#contact",
  },
];

export const Pricing = () => {
  const themeCtx = useOptionalTheme();
  const isDark = themeCtx?.theme === "dark";

  const renderCardBody = (p: PlanDef) => (
    <>
      {p.featured && (
        <span className="absolute -top-3 left-6 z-10 rounded-full bg-primary text-primary-foreground text-xs font-medium tracking-[0.16em] uppercase px-3 py-1">
          Most chosen
        </span>
      )}
      <h3 className="font-display text-xl text-foreground">{p.name}</h3>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-4xl text-foreground">{p.price}</span>
        <span className="text-xs text-muted-foreground">{p.cadence}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed min-h-[2.5rem]">{p.line}</p>

      <ul className="mt-6 space-y-3 flex-1">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border mt-6" />
      <Link
        to={p.to}
        className={`mt-7 inline-flex justify-center rounded-xl px-4 py-3 text-sm font-medium transition-opacity ${
          p.featured
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-border text-foreground hover:bg-muted"
        }`}
      >
        {p.cta}
      </Link>
    </>
  );

  return (
  <section id="pricing" className="relative py-24 sm:py-32 bg-background/85">
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="max-w-2xl">
        <div className="font-mono-caps text-primary mb-4">Pricing</div>
        <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-[1.02]">
          Priced against the hour it gives back.
        </h2>
        <p className="mt-5 text-muted-foreground">
          Start free on a single counter. Move up only when the flow you're managing is worth it.
          No hardware, no setup fee, cancel any time.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {PLANS.map((p) => (
          <div key={p.id} className="relative h-full">
            <BorderGlow
              edgeSensitivity={30}
              glowColor={isDark ? "180 48 54" : "195 78 28"}
              backgroundColor={isDark ? "#122136" : "#ffffff"}
              surfaceTheme={isDark ? "dark" : "light"}
              borderRadius={16}
              glowRadius={36}
              glowIntensity={p.featured ? 0.95 : 0.75}
              coneSpread={25}
              animated={false}
              colors={isDark ? ["#51c2c2", "#10637f", "#f4f2eb"] : ["#10637f", "#51c2c2", "#0e1e34"]}
              fillOpacity={0.28}
              className="h-full"
            >
              <div className="relative p-6 flex flex-col h-full">
                {renderCardBody(p)}
              </div>
            </BorderGlow>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Prices shown in INR, billed monthly. Taxes handled at checkout.
      </p>
    </div>
  </section>
  );
};
