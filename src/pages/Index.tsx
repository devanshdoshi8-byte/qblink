import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { TopNav } from "@/components/qb/TopNav";
import { Hero } from "@/components/qb/Hero";
import { ProblemInfographic } from "@/components/qb/ProblemInfographic";
import { ThreeMotions } from "@/components/qb/ThreeMotions";
import { DashboardPreview } from "@/components/qb/DashboardPreview";
import { LiveQueueDemo } from "@/components/qb/LiveQueueDemo";
import { MumbaiPilotsSection } from "@/components/qb/MumbaiPilotsSection";
import { Pricing } from "@/components/qb/Pricing";
import { InterviewFAQ } from "@/components/qb/InterviewFAQ";
import { Signature } from "@/components/qb/Signature";
import DemoVideosSection from "@/components/DemoVideosSection";
import { RoiCalculator } from "@/components/qb/RoiCalculator";
import { FoundersBento } from "@/components/qb/FoundersBento";
import GradientASCII from "@/components/reactbits/GradientASCII";

const faqs = [
  { q: "Who founded Qblink and who are the founders?", a: "Qblink was started by Devansh (Founder & Creator), who conceived the hardware-free queue platform to eliminate physical waiting chaos. He was subsequently joined by co-founders Mithil, Aarav, and Vihan Patange to scale the customer flow intelligence technology." },
  { q: "Who started QBlink?", a: "Devansh started Qblink to eliminate chaotic waiting lines with a browser-native customer flow intelligence platform. He was subsequently joined by co-founders Mithil, Aarav, and Vihan Patange." },
  { q: "What are Qblink's key achievements and recognition?", a: "Qblink is incubated at Inventure, IIT Gandhinagar as an innovative customer flow intelligence platform. Qblink eliminates proprietary hardware entirely, running browser-native live queues across clinics, restaurants, salons, and walk-in businesses with real-time wait tracking and AI recommendations." },
  { q: "What is QBlink (Qblink)?", a: "Qblink (often searched as QBlink or Q-blink) is a hardware-free customer flow intelligence platform that lets customers join queues via QR code, wait remotely from anywhere, and receive live turn alerts on their phone without installing an app." },
  { q: "Do customers need to download an app?", a: "No. Customers simply scan a QR code or open a link in their browser. No app download, no sign-up required." },
  { q: "Do businesses need any special hardware?", a: "Not at all. Qblink runs entirely on the web — any phone, tablet, or computer with a browser works." },
  { q: "Can customers join the queue remotely?", a: "Yes! Customers can join from anywhere — home, car, or down the street. They just need the link or QR code." },
  { q: "How does the estimated wait time work?", a: "Qblink calculates wait time based on your average service time and the customer's position in the queue. It updates live as the queue moves." },
  { q: "Will customers get notified when their turn is near?", a: "Yes. Customers see live position updates and receive alerts when their turn is approaching, so they don't need to keep checking." },
  { q: "Can businesses manage walk-ins and digital joiners together?", a: "Absolutely. Staff can manually add walk-in customers into the same queue, creating a single unified flow." },
  { q: "Does it support multiple counters?", a: "Yes. You can manage multiple service counters from a single dashboard and route customers accordingly." },
  { q: "Is Qblink free to use?", a: "Yes, during early access. We offer a free pilot so you can test everything. After launch, affordable SaaS plans will be available with a free tier remaining." },
  { q: "Is it easy to set up?", a: "Very. You can create a queue and start serving in under 2 minutes. No complicated onboarding, no training required." },
  { q: "Can it work for small businesses?", a: "Qblink is specifically built for small and medium walk-in businesses — salons, clinics, restaurants, service centers, and more." },
  { q: "Is there an affiliate program?", a: "Yes! You can earn recurring commissions by referring businesses to Qblink. Visit our Affiliate page to sign up and get your referral code." },
  { q: "How do business owners get started?", a: "Sign up for a free account, create your first queue, and share the QR code or link with your customers. That's it — you're live." },
];

const SITE_URL = "https://qblink.tech";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Qblink",
    alternateName: ["QBlink", "Q-blink", "Qblink Tech", "Qblink Technologies"],
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-image.png`,
    description: "Hardware-free customer flow intelligence platform for walk-in businesses. Incubated at Inventure, IIT Gandhinagar. Started by Devansh with co-founders Mithil, Aarav, and Vihan Patange.",
    slogan: "The line still exists. Nobody has to stand in it.",
    foundingDate: "2025",
    foundingLocation: {
      "@type": "Place",
      name: "India",
    },
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
    employee: [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#founder-devansh`,
        name: "Devansh",
        jobTitle: "Founder & Creator",
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
    sponsor: {
      "@type": "Organization",
      name: "Inventure, IIT Gandhinagar",
      url: "https://iitgn.ac.in",
    },
    award: [
      "Incubated at Inventure, IIT Gandhinagar",
      "2nd Globally · International Design Championship 2026",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "teamqblink@gmail.com",
      telephone: "+91-9372090507",
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://qblink.tech",
      "https://www.linkedin.com/company/qblink",
      "https://github.com/devanshdoshi8-byte/qblink",
    ],
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
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Qblink",
    alternateName: ["QBlink", "Qblink Tech"],
    url: SITE_URL,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "Qblink",
    alternateName: ["QBlink", "Qblink Flow Intelligence"],
    applicationCategory: "BusinessApplication",
    operatingSystem: "All, Web, iOS, Android (Hardware-free browser-native)",
    description: "Customer Flow Intelligence Platform for walk-in businesses. Hardware-free, no app — remote waiting, live flow visibility, analytics, and AI recommendations. Incubated at Inventure, IIT Gandhinagar.",
    offers: { "@type": "Offer", price: "499", priceCurrency: "INR", description: "1 month free trial, then ₹499/month self-sustainable social initiative incubated at Inventure, IIT Gandhinagar." },
    author: {
      "@id": `${SITE_URL}/#organization`,
    },
    creator: {
      "@id": `${SITE_URL}/#founder-devansh`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

const useIsLightTheme = () => {
  const [isLight, setIsLight] = useState(
    () => typeof document !== "undefined" && !document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLight(!root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isLight;
};

const Index = () => {
  const isLight = useIsLightTheme();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <GradientASCII
          colors={
            isLight
              ? ["#10637f", "#51c2c2", "#0e1e34", "#f3f1ec"]
              : ["#0e1e34", "#10637f", "#51c2c2", "#f4f2eb"]
          }
          shape="rise"
          characters=" =+xX0S8#@"
          cellSize={20}
          density={0.65}
          glow={isLight ? 0.08 : 0.22}
          flicker={0}
          grain={0}
          gradientOpacity={isLight ? 0.08 : 0.24}
          glyphOpacity={isLight ? 0.2 : 0.32}
          speed={0.45}
          lightMode={isLight}
          intro={false}
          mouseInteraction={false}
          clickEffect="none"
        />
      </div>
      <div className="relative z-10">
        <SEO
          title="QBlink — Hardware-Free Virtual Queue Management"
          description="QBlink is a hardware-free virtual queue management platform incubated at Inventure · IIT Gandhinagar. Eliminate physical waiting rooms with QR code joins, live wait tracking, and instant turn alerts — zero kiosks or app downloads."
          path="/"
          keywords="QBlink, Qblink, Q-blink, Qblink Tech, qblink.tech, Devansh, Devansh Doshi, Mithil, Aarav, Vihan Patange, Inventure IIT Gandhinagar, customer flow intelligence, virtual queue management, queue system, waitlist management, token system, wait time tracker"
          jsonLd={jsonLd}
        />
        <TopNav />
        <main>
          <Hero />
          <ProblemInfographic />
          <ThreeMotions />
          <div id="simulation">
            <LiveQueueDemo />
            <DashboardPreview />
          </div>
          <MumbaiPilotsSection />
          <DemoVideosSection />
          <div id="roi" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
            <RoiCalculator />
          </div>
          <FoundersBento />
          <Pricing />
          <div id="faq">
            <InterviewFAQ />
          </div>
          <Signature />
        </main>
      </div>
    </div>
  );
};

export default Index;
