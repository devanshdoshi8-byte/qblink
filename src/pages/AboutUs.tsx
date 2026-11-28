import { Link } from "react-router-dom";
import {
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Heart,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  TrendingUp,
} from "lucide-react";
import SEO from "@/components/SEO";
import { TopNav } from "@/components/qb/TopNav";
import { Signature } from "@/components/qb/Signature";

const SITE_URL = "https://qblink.tech";

const founders = [
  {
    name: "Devansh",
    fullName: "Devansh Doshi",
    role: "Founder & Creator",
    status: "Started Qblink",
    badge: "Founder & Creator",
    bio: "Devansh started Qblink to eliminate the massive waste of human time caused by physical waiting lines. Driven by a deep execution mindset, Devansh designed the original architecture of Qblink as a zero-hardware, zero-app customer flow platform where any phone browser could hold a spot in line. He leads overall product direction, company vision, and core system engineering.",
    email: "devanshdoshi8@gmail.com",
    phone: "+91 93720 90507",
    primary: true,
  },
  {
    name: "Mithil",
    role: "Co-founder",
    status: "Co-founder",
    badge: "Co-founder",
    bio: "Joined Devansh as co-founder to scale business counter operations, multi-location merchant onboarding, and operational reliability. Mithil focuses on customer success, partner expansion, and ensuring seamless adoption for high-volume walk-in environments across clinics, salons, and restaurants.",
    primary: false,
  },
  {
    name: "Aarav",
    role: "Co-founder",
    status: "Co-founder",
    badge: "Co-founder",
    bio: "Joined Devansh as co-founder to architect real-time queue synchronization, sub-second WebSocket signals, and fluid responsive smartphone experiences. Aarav ensures that wait tracking is instant, reliable on flaky cellular networks, and pleasant for customers waiting remotely.",
    primary: false,
  },
  {
    name: "Vihan Patange",
    role: "Co-founder",
    status: "Co-founder",
    badge: "Co-founder",
    bio: "Joined Devansh as co-founder to develop predictive wait-time models, customer flow analytics, and automated peak-hour intelligence algorithms. Vihan focuses on transforming raw counter velocity into actionable insights and accurate return buffers for waiting guests.",
    primary: false,
  },
];

const achievements = [
  {
    title: "Incubated at Inventure, IIT Gandhinagar",
    subtitle: "Prestigious Academic & Tech Incubation",
    desc: "Qblink was selected and incubated at Inventure, the incubation initiative at IIT Gandhinagar. Recognized for its social and commercial impact on reducing hospital crowding and restoring human dignity to waiting.",
    icon: Award,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  {
    title: "100% Hardware-Free Customer Flow",
    subtitle: "Zero Kiosks · Zero Tokens · Zero Printers",
    desc: "Unlike traditional legacy queue systems that require ₹50,000+ kiosks and thermal printers, Qblink operates 100% natively in any web browser on any device. Setup takes under 2 minutes.",
    icon: Zap,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  {
    title: "No App Download Required",
    subtitle: "Browser-Native Smartphone Accessibility",
    desc: "Customers simply scan a QR code or click a link. No app store friction, no forced sign-ups, and no device storage barriers. Accessible to anyone from a budget smartphone to a flagship laptop.",
    icon: Sparkles,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    title: "Sub-Second Live Signal Sync",
    subtitle: "Real-Time Remote Waiting",
    desc: "Proprietary real-time signals let customers leave the waiting room, run errands, and receive live position countdowns and turn chimes, arriving exactly when the counter is ready.",
    icon: Clock,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
];

const aboutJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: "About QBlink — Founders, Mumbai Pilots & IIT Gandhinagar Incubation",
    description:
      "Meet QBlink founder Devansh Doshi and co-founders Mithil, Aarav, and Vihan Patange. Incubated at Inventure, IIT Gandhinagar and validated across real Mumbai pilots.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "About Qblink", item: `${SITE_URL}/about` },
      ],
    },
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Qblink",
      alternateName: ["QBlink", "Q-blink", "Qblink Tech", "Qblink Technologies"],
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      founder: {
        "@type": "Person",
        "@id": `${SITE_URL}/#founder-devansh`,
        name: "Devansh",
        alternateName: "Devansh Doshi",
        jobTitle: "Founder & Creator",
        description: "Devansh started Qblink to eliminate chaotic waiting lines with a browser-native customer flow intelligence platform.",
        sameAs: "mailto:devanshdoshi8@gmail.com",
      },
      founders: [
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#founder-devansh`,
          name: "Devansh",
          jobTitle: "Founder & Creator (Started Qblink)",
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#cofounder-mithil`,
          name: "Mithil",
          jobTitle: "Co-founder",
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#cofounder-aarav`,
          name: "Aarav",
          jobTitle: "Co-founder",
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#cofounder-vihan`,
          name: "Vihan Patange",
          jobTitle: "Co-founder",
        },
      ],
      award: "Incubated at Inventure, IIT Gandhinagar",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#founder-devansh`,
    name: "Devansh",
    alternateName: "Devansh Doshi",
    jobTitle: "Founder & Creator",
    worksFor: {
      "@type": "Organization",
      name: "Qblink",
      url: SITE_URL,
    },
    description: "Devansh started Qblink, conceiving the hardware-free queue intelligence platform and driving its initial architecture.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#cofounder-mithil`,
    name: "Mithil",
    jobTitle: "Co-founder",
    worksFor: {
      "@type": "Organization",
      name: "Qblink",
      url: SITE_URL,
    },
    description: "Co-founder at Qblink, scaling platform counter operations, merchant stability, and multi-location deployment.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#cofounder-aarav`,
    name: "Aarav",
    jobTitle: "Co-founder",
    worksFor: {
      "@type": "Organization",
      name: "Qblink",
      url: SITE_URL,
    },
    description: "Co-founder at Qblink, leading high-frequency real-time queue engineering, web-socket signals, and UX.",
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#cofounder-vihan`,
    name: "Vihan Patange",
    jobTitle: "Co-founder",
    worksFor: {
      "@type": "Organization",
      name: "Qblink",
      url: SITE_URL,
    },
    description: "Co-founder at Qblink, leading customer flow algorithms, wait-time prediction models, and analytics.",
  },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="About QBlink — Founders, Mumbai Pilots & IIT Gandhinagar Incubation"
        description="Meet QBlink founder Devansh Doshi and co-founders Mithil, Aarav, and Vihan Patange. Backed by Inventure at IIT Gandhinagar and validated through real Mumbai clinic and dining pilots."
        path="/about"
        keywords="QBlink, Qblink, Q-blink, Qblink founders, Devansh, Devansh Doshi, Mithil, Aarav, Vihan Patange, Inventure, IIT Gandhinagar, customer flow intelligence, virtual queue, hardware-free waiting"
        jsonLd={aboutJsonLd}
      />

      <TopNav />

      <main className="pt-24 sm:pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-5 sm:px-8 max-w-6xl mx-auto mb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>Incubated at Inventure · IIT Gandhinagar</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            The Story Behind <span className="text-primary">Qblink</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Started by <strong>Devansh</strong> to banish the chaos of physical queues, and joined by co-founders <strong>Mithil</strong>, <strong>Aarav</strong>, and <strong>Vihan Patange</strong> to bring hardware-free customer flow intelligence to walk-in businesses everywhere.
          </p>
        </section>

        {/* Origin Story Section */}
        <section className="px-5 sm:px-8 max-w-5xl mx-auto mb-24">
          <div className="bg-card rounded-3xl p-8 sm:p-12 border border-border/70 card-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 gradient-bg" />

            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Genesis & Purpose</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">
              How Devansh Started Qblink
            </h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed text-base sm:text-lg">
              <p>
                Every day, millions of people stand in packed clinics, noisy restaurants, salons, and bank counters, anxiously watching the receptionist or staring at a wall screen. Meanwhile, every person holds a supercomputer in their pocket.
              </p>
              <p>
                <strong className="text-foreground">Devansh conceived and started Qblink</strong> from a direct realization: physical waiting rooms are broken not because waiting is inevitable, but because existing queue solutions relied on ₹50,000+ hardware kiosks, proprietary apps, and thermal paper tickets. Devansh set out to engineer a solution with two non-negotiable principles: <strong>zero hardware</strong> and <strong>zero app downloads</strong>.
              </p>
              <p>
                As the platform took shape and early pilots demonstrated dramatic reductions in crowding, Devansh brought together co-founders <strong className="text-foreground">Mithil</strong>, <strong className="text-foreground">Aarav</strong>, and <strong className="text-foreground">Vihan Patange</strong>. Together, they expanded Qblink from a simple digital token system into a comprehensive <strong>Customer Flow Intelligence Platform</strong>.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-border/50 grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="font-display text-3xl font-bold text-foreground mb-1">0</p>
                <p className="text-xs uppercase font-mono text-muted-foreground">Kiosks or Hardware Needed</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-primary mb-1">&lt;2 min</p>
                <p className="text-xs uppercase font-mono text-muted-foreground">Time to Go Live</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-foreground mb-1">100%</p>
                <p className="text-xs uppercase font-mono text-muted-foreground">Browser-Native on Any Phone</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Founders & Leadership Team */}
        <section className="px-5 sm:px-8 max-w-6xl mx-auto mb-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary font-bold mb-2">
              <Users className="w-4 h-4" />
              <span>Leadership Team</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Meet the Founders of Qblink
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              A dedicated team of young engineers and builders on a mission to give humans an hour back of their day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {founders.map((founder) => (
              <div
                key={founder.name}
                className={`rounded-3xl p-7 sm:p-8 border transition-all duration-300 ${
                  founder.primary
                    ? "bg-primary/[0.04] border-primary/50 shadow-md relative overflow-hidden"
                    : "bg-card border-border/60 hover:border-border"
                }`}
              >
                {founder.primary && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl">
                    Started Qblink
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                    {founder.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xl sm:text-2xl leading-tight">
                      {founder.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary">
                      {founder.role}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-muted text-muted-foreground">
                      {founder.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {founder.bio}
                </p>

                {founder.email && (
                  <div className="pt-4 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <a
                      href={`mailto:${founder.email}`}
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{founder.email}</span>
                    </a>
                    {founder.phone && (
                      <a
                        href={`tel:${founder.phone}`}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-success" />
                        <span>{founder.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Key Achievements & Recognition */}
        <section className="px-5 sm:px-8 max-w-6xl mx-auto mb-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-teal-600 dark:text-teal-300 font-bold mb-2">
              <Award className="w-4 h-4" />
              <span>Milestones & Impact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Key Achievements & Recognition
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {achievements.map((item, idx) => (
              <div
                key={idx}
                className="bg-card rounded-3xl p-7 border border-border/60 card-shadow hover:border-primary/40 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-lg sm:text-xl mb-1">
                  {item.title}
                </h3>
                <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                  {item.subtitle}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission, Vision & Impact */}
        <section className="px-5 sm:px-8 max-w-5xl mx-auto mb-24">
          <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-8 sm:p-12 border border-border/70 card-shadow">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Our Guiding Conviction
            </h2>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">Our Mission</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Give an hour back to every human waiting in line by making customer flow transparent, remote, and dignified.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">Our Vision</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Become the global standard for frictionless walk-in customer flow intelligence across healthcare, dining, and service sectors.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">Privacy & Simplicity</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Zero intrusive tracking, zero advertising, and PII-free queue signals. Built purely for trust and operational clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-5 sm:px-8 max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-primary/30 shadow-lg">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Join the Movement for Smarter Queuing
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">
              Whether you are a walk-in business looking to calm your counter, or a customer tired of waiting in packed rooms, Qblink is here for you.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/auth/business"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                <Building2 className="w-4 h-4" />
                <span>Start Free Business Pilot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pitch"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-muted/60 text-foreground font-bold text-sm hover:bg-muted transition-colors"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Try Pitch Demo Simulator</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Signature />
    </div>
  );
};

export default AboutUs;
