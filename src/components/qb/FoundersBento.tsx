import { Award, Cpu, Smartphone } from "lucide-react";
import MagicBento from "@/components/reactbits/MagicBento";
import GlassSurface from "@/components/reactbits/GlassSurface";

const AvatarMark = ({ letter }: { letter: string }) => (
  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
    {letter}
  </span>
);

export const FoundersBento = () => {
  return (
    <section
      id="founders"
      className="relative py-24 sm:py-32 bg-background/85"
      aria-label="Founding leadership and recognition"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end mb-12">
          <div className="lg:col-span-7">
            <div className="font-mono-caps text-primary mb-3">
              Founding Leadership
            </div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-[1.02]">
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
          rowHeight={220}
          gap={12}
          radius={20}
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          clickEffect={true}
          cards={[
            {
              id: "founder-devansh",
              label: "Founder & Creator · Started Qblink",
              title: "Devansh",
              accent: true,
              icon: <AvatarMark letter="D" />,
              description:
                "Devansh started Qblink after watching people waste hours standing in chaotic, disorganized waiting lines. He conceived the vision of hardware-free customer flow intelligence and built the core foundation so anyone can wait remotely without buying hardware or downloading apps.",
            },
            {
              id: "cofounder-mithil",
              label: "Co-founder · Joined Devansh",
              title: "Mithil",
              icon: <AvatarMark letter="M" />,
              description:
                "Joined Devansh as co-founder to lead platform scale, merchant counter reliability, and operational deployment across clinics, salons, and food businesses.",
            },
            {
              id: "cofounder-aarav",
              label: "Co-founder · Joined Devansh",
              title: "Aarav",
              icon: <AvatarMark letter="A" />,
              description:
                "Joined Devansh as co-founder to engineer high-frequency real-time queue signals, live browser notifications, and frictionless smartphone experiences.",
            },
            {
              id: "cofounder-vihan",
              label: "Co-founder · Joined Devansh",
              title: "Vihaan Patange",
              icon: <AvatarMark letter="V" />,
              description:
                "Joined Devansh as co-founder to spearhead predictive wait-time algorithms, customer flow intelligence, and multi-counter analytics.",
            },
            {
              id: "recognition-iitgn",
              label: "Official Recognition",
              title: "Inventure · IIT Gandhinagar",
              colSpan: 2,
              icon: <Award className="w-4 h-4" />,
              description:
                "Incubated and supported at IIT Gandhinagar as a social and commercial customer flow innovation.",
            },
            {
              id: "pillar-hardware-free",
              label: "Architecture",
              title: "100% Hardware-Free",
              icon: <Cpu className="w-4 h-4" />,
              description:
                "Eliminates expensive paper slips, kiosk machines, and clunky hardware with pure browser tech.",
            },
            {
              id: "pillar-zero-app",
              label: "Customer Experience",
              title: "Zero-App Remote Waiting",
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
