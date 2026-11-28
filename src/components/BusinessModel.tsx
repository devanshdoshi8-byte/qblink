import { Check, ShieldCheck, Users } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const tiers = [
  { icon: Check, title: "Free to use", desc: "Qblink has no subscription, paid plan, or trial period." },
  { icon: ShieldCheck, title: "No paywalls", desc: "There are no payment requirements to use Qblink." },
  { icon: Users, title: "For every business", desc: "The same free access is available to clinics, salons, restaurants, and service counters." },
];

const BusinessModel = () => (
  <section className="section-padding">
    <div className="section-container">
      <SectionHeading
        badge="Free access"
        title="Qblink is free to use"
        subtitle="No subscriptions, paid plans, trial periods, or payment requirements."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <AnimatedSection key={t.title} delay={i * 0.08}>
            <div className="bg-card rounded-2xl p-6 card-shadow h-full">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default BusinessModel;
