import { Link } from "react-router-dom";
import { Check, ShieldCheck, HeartPulse, Sparkles, Server, PhoneCall, Database, Award } from "lucide-react";

export interface PlanDef {
  id: "free_trial" | "self_sustainable" | "community";
  name: string;
  badge?: string;
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
    id: "free_trial",
    name: "1st Month Free Trial",
    badge: "Full Access Onboarding",
    price: "₹0",
    cadence: "first 30 days",
    line: "Experience zero-wait queue flow at your counter with zero financial risk.",
    features: [
      "Unlimited digital tokens & QR code joins",
      "Remote waiting with live position on customer phones",
      "TV / Tablet Public Display Screen with sound chime",
      "Multi-counter routing & staff dashboard",
      "Automated midnight queue reset (12:00 AM)",
      "High-res counter standee & QR poster export",
    ],
    cta: "Start 1st Month Free",
    to: "/auth/business",
  },
  {
    id: "self_sustainable",
    name: "Self-Sustainable Plan",
    badge: "Most chosen · 100% at-cost",
    price: "₹499",
    cadence: "per month (after 1st month)",
    line: "Pure cost pass-through for busy walk-in clinics, counters & salons. Zero venture margin.",
    features: [
      "Everything in 1st Month Free",
      "Sub-second edge WebSockets & live telemetry",
      "Automated SMS & turn arrival notifications",
      "Peak-hour AI flow & walkaway intelligence",
      "Automated midnight reset with timezone scheduling",
      "High-resolution physical standee / tent export",
      "Dedicated priority community & onboarding support",
    ],
    cta: "Start Free Month Now",
    to: "/auth/business",
    featured: true,
  },
  {
    id: "community",
    name: "Community & Public Rollout",
    badge: "Public health & charitable",
    price: "₹0",
    cadence: "100% subsidized",
    line: "For government primary health posts, charitable dispensaries, and public service desks.",
    features: [
      "Multi-department token triage & routing",
      "Multilingual support for vernacular patients",
      "Dedicated on-site setup and staff training",
      "Custom integration with public registries",
      "100% sponsored under our social mission",
    ],
    cta: "Request Community Rollout",
    to: "mailto:teamqblink@gmail.com?subject=Public%20or%20Charitable%20Rollout%20Request",
  },
];

export const Pricing = () => (
  <section id="pricing" className="relative py-24 sm:py-32 bg-background border-t border-border overflow-hidden">
    {/* Ambient radial glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" aria-hidden />

    <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
      {/* Header & Incubation Banner */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 border border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>A Self-Sustainable Social Initiative</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-bold">Inventure · IIT Gandhinagar</span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-[1.05]">
          Priced purely to keep itself self-sustainable.
        </h2>

        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Qblink was incubated at <strong className="text-foreground font-semibold">Inventure Incubation Center, IIT Gandhinagar</strong> to eliminate waiting-room chaos and crowding without expensive hardware. We carry zero venture markups: your <strong>first month is completely free</strong> to self-sustain your operations, and thereafter just <strong>₹499/month</strong> strictly covers raw server, SMS, and database costs.
        </p>

        {/* Institutional Badge Bar */}
        <div className="mt-7 inline-flex flex-wrap items-center gap-4 py-2 px-4 rounded-xl bg-card border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Award className="w-4 h-4 text-primary" />
            <span>Incubated at Inventure, IIT Gandhinagar</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Zero Profit Markup</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>1st Month 100% Free</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mt-14 grid gap-6 md:grid-cols-3 items-stretch">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`relative rounded-2xl p-7 flex flex-col justify-between border transition-all ${
              p.featured
                ? "border-primary/50 bg-card shadow-[0_20px_60px_-24px_hsl(var(--primary)/0.45)] ring-1 ring-primary/30"
                : "border-border bg-card hover:shadow-lg"
            }`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary text-primary-foreground text-[0.62rem] tracking-[0.16em] uppercase px-3 py-1 font-semibold">
                Most chosen · At cost
              </span>
            )}
            <div>
              {p.badge && !p.featured && (
                <div className="inline-block rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-2.5 py-0.5 mb-3 border border-border">
                  {p.badge}
                </div>
              )}
              {p.featured && <div className="h-4" />}
              <h3 className="font-display text-2xl text-foreground font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5 pb-4 border-b border-border">
                <span className="font-display text-4xl text-foreground font-extrabold">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.cadence}</span>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed min-h-[2.5rem]">
                {p.line}
              </p>

              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4">
              {p.to.startsWith("mailto:") ? (
                <a
                  href={p.to}
                  className="w-full inline-flex justify-center rounded-xl px-4 py-3 text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors text-center"
                >
                  {p.cta}
                </a>
              ) : (
                <Link
                  to={p.to}
                  className={`w-full inline-flex justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-opacity text-center ${
                    p.featured
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {p.cta}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Transparent Cost Breakdown Grid */}
      <div className="mt-14 rounded-2xl p-6 sm:p-7 bg-card/60 border border-border backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-border">
          <div>
            <h4 className="font-display text-base sm:text-lg font-bold text-foreground">
              Where does your ₹499 go? 100% Transparent Cost Accounting
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Because Qblink is a social initiative born at IIT Gandhinagar, we publish our exact operational unit costs.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
            ₹0 Founder Profit
          </span>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background/60 border border-border/80">
            <div className="flex items-center gap-2 mb-1.5 text-foreground font-semibold">
              <Server className="w-4 h-4 text-primary" />
              <span>Cloud & Edge WebSockets (~₹220)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              High-availability edge servers powering sub-second queue sync and live patient/customer phone screens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background/60 border border-border/80">
            <div className="flex items-center gap-2 mb-1.5 text-foreground font-semibold">
              <PhoneCall className="w-4 h-4 text-primary" />
              <span>WhatsApp & SMS Alerts (~₹180)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Direct pass-through telecom gateway fees for instant turn alerts and arrival notifications.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background/60 border border-border/80">
            <div className="flex items-center gap-2 mb-1.5 text-foreground font-semibold">
              <Database className="w-4 h-4 text-primary" />
              <span>Database & Security (~₹99)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Encrypted database storage, hourly backups, and SSL certificates strictly aligned with DPDP 2023.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Prices shown in INR. First 30 days are 100% free with all features unlocked. Taxes handled at checkout.
      </p>
    </div>
  </section>
);

export default Pricing;
