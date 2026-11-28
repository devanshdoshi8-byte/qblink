import { Link } from "react-router-dom";
import { Award, Cpu, Smartphone, ArrowRight } from "lucide-react";
import MagicBento from "@/components/reactbits/MagicBento";
import GlassSurface from "@/components/reactbits/GlassSurface";

export const FoundersBento = () => {
  return (
    <section
      id="founders"
      className="relative py-12 sm:py-24 bg-background/85"
      aria-label="Founding leadership and recognition"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-end mb-8 sm:mb-12">
          <div className="lg:col-span-7">
            <div className="font-mono-caps text-primary mb-3">
              Founding Leadership
            </div>
            <h2 className="font-display text-3xl sm:text-5xl text-foreground leading-[1.02]">
              Built from conviction,
              <br />
              <span className="text-primary italic font-normal">
                not hardware kiosks.
              </span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-2xl">
              Qblink was started by Devansh with a single conviction: waiting in
              physical lines is an obsolete relic in a smartphone-first world.
              People were wasting precious hours in packed clinic waiting rooms,
              crowded restaurant lobbies, and salon counters while holding
              powerful connected devices in their hands.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
              Devansh built the initial platform from the ground up to eradicate
              physical queues without forcing anyone to buy hardware kiosks or
              install proprietary apps. Devansh was subsequently joined by
              co-founders Mithil, Aarav, and Vihaan Patange to scale Qblink into
              a full-fledged customer flow intelligence platform.
            </p>
            <div className="mt-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <span>Read our full founding story &amp; achievements</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 lg:flex lg:justify-end">
            <GlassSurface
              width="auto"
              height="auto"
              borderRadius={20}
              backgroundOpacity={0.08}
              opacity={1}
              blur={12}
              displace={0.25}
              distortionScale={-100}
              className="px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono-caps text-[11px] text-primary font-semibold">
                    Official Recognition
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    Incubated at Inventure · IIT Gandhinagar
                  </div>
                  <div className="text-xs text-primary font-medium mt-0.5">
                    2nd Globally · International Design Championship 2026
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Social &amp; Healthcare Flow Initiative
                  </div>
                </div>
              </div>
            </GlassSurface>
          </div>
        </div>

        <MagicBento
          columns={4}
          rowHeight={160}
          gap={12}
          radius={20}
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          clickEffect={true}
          cards={[
            {
              id: "founder-devansh",
              label: "Founder · Product & Core",
              title: "Devansh Doshi",
              accent: true,
              description:
                "Started QBlink after watching people lose hours in disorganized waiting lines. Built the core hardware-free flow engine so anyone can wait remotely in any browser.",
            },
            {
              id: "cofounder-mithil",
              label: "Co-founder · Platform & Ops",
              title: "Mithil Nirav Shah",
              description:
                "Leads platform scale, merchant counter reliability, and operational deployment across clinics, salons, and food businesses.",
            },
            {
              id: "cofounder-aarav",
              label: "Co-founder · Realtime & UX",
              title: "Aarav Mehta",
              description:
                "Engineers high-frequency real-time queue signals, live browser notifications, and zero-friction smartphone experiences.",
            },
            {
              id: "cofounder-vihaan",
              label: "Co-founder · Flow Intelligence",
              title: "Vihaan Patange",
              description:
                "Spearheads predictive wait-time algorithms, customer flow intelligence, and multi-counter analytics.",
            },
            {
              id: "pillar-hardware-free",
              label: "Architecture",
              title: "100% Hardware-Free",
              colSpan: 2,
              icon: <Cpu className="w-4 h-4" />,
              description:
                "Eliminates expensive paper slips, kiosk machines, and clunky hardware with pure browser tech.",
            },
            {
              id: "pillar-zero-app",
              label: "Customer Experience",
              title: "Zero-App Remote Waiting",
              colSpan: 2,
              icon: <Smartphone className="w-4 h-4" />,
              description:
                "Customers join with a simple QR scan and hold their place from home, car, or a nearby cafe.",
            },
          ]}
        />
      </div>
    </section>
  );
};

export default FoundersBento;
