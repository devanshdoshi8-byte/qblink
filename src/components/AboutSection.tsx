import { Link } from "react-router-dom";
import { Target, Users, Rocket, Award, Sparkles, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const teamMembers = [
  {
    name: "Devansh",
    fullName: "Devansh Doshi",
    role: "Founder & Creator",
    tagline: "Started Qblink",
    highlight: true,
    bio: "Devansh started Qblink after watching people waste hours standing in chaotic, disorganized waiting lines. He conceived the vision of hardware-free customer flow intelligence and built the core foundation so anyone can wait remotely without buying hardware or downloading apps.",
  },
  {
    name: "Mithil",
    role: "Co-founder",
    tagline: "Joined Devansh as Co-founder",
    bio: "Joined Devansh as co-founder to lead platform scale, merchant counter reliability, and operational deployment across clinics, salons, and food businesses.",
  },
  {
    name: "Aarav",
    role: "Co-founder",
    tagline: "Joined Devansh as Co-founder",
    bio: "Joined Devansh as co-founder to engineer high-frequency real-time queue signals, live browser notifications, and frictionless smartphone experiences.",
  },
  {
    name: "Vihan Patange",
    role: "Co-founder",
    tagline: "Joined Devansh as Co-founder",
    bio: "Joined Devansh as co-founder to spearhead predictive wait-time algorithms, customer flow intelligence, and multi-counter analytics.",
  },
];

const achievements = [
  {
    icon: Award,
    title: "Inventure · IIT Gandhinagar",
    desc: "Incubated and supported at IIT Gandhinagar as a social and commercial customer flow innovation.",
  },
  {
    icon: ShieldCheck,
    title: "100% Hardware-Free",
    desc: "Eliminates expensive paper slips, kiosk machines, and clunky hardware with pure browser tech.",
  },
  {
    icon: Sparkles,
    title: "Zero-App Remote Waiting",
    desc: "Customers join with a simple QR scan and hold their place from home, car, or a nearby cafe.",
  },
];

const AboutSection = () => (
  <section id="about" className="section-padding soft-bg relative overflow-hidden" aria-label="About Qblink">
    <div className="section-container">
      <SectionHeading
        badge="About Qblink · Leadership & Story"
        title="Started by Devansh. Powered by a Dedicated Team."
        subtitle="Incubated at Inventure, IIT Gandhinagar — transforming chaotic waiting into intelligent, hardware-free flow."
      />

      <AnimatedSection>
        <div className="bg-background rounded-3xl p-6 sm:p-10 md:p-12 card-shadow max-w-5xl mx-auto border border-border/60">
          {/* Origin Story Narrative */}
          <div className="space-y-4 text-muted-foreground leading-relaxed text-base sm:text-lg mb-10">
            <p>
              <strong className="text-foreground font-semibold">Qblink was started by Devansh</strong> with a single conviction: waiting in physical lines is an obsolete relic in a smartphone-first world. People were wasting precious hours in packed clinic waiting rooms, crowded restaurant lobbies, and salon counters while holding powerful connected devices in their hands.
            </p>
            <p>
              Devansh built the initial platform from the ground up to eradicate physical queues without forcing anyone to buy hardware kiosks or install proprietary apps. Devansh was subsequently joined by co-founders <strong className="text-foreground">Mithil</strong>, <strong className="text-foreground">Aarav</strong>, and <strong className="text-foreground">Vihan Patange</strong> to scale Qblink into a full-fledged customer flow intelligence platform.
            </p>
          </div>

          {/* Incubation Callout Banner */}
          <div className="mb-10 p-5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-teal-700 dark:text-teal-300 font-semibold">
                  Official Recognition
                </p>
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Incubated at Inventure · IIT Gandhinagar
                </h4>
              </div>
            </div>
            <span className="inline-flex items-center text-xs text-muted-foreground font-medium">
              Social & Healthcare Flow Initiative
            </span>
          </div>

          {/* Founders Grid */}
          <div className="mb-10">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-5">
              Founding Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className={`rounded-2xl p-6 transition-all duration-300 border ${
                    member.highlight
                      ? "bg-primary/[0.04] border-primary/40 shadow-sm relative overflow-hidden"
                      : "bg-muted/30 border-border/50 hover:border-border"
                  }`}
                >
                  {member.highlight && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                      Started Qblink
                    </div>
                  )}
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg leading-snug">
                        {member.name}
                      </h4>
                      <p className="text-xs font-semibold text-primary">
                        {member.role}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {member.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Achievements Grid */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
            {achievements.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-border/30">
                <item.icon className="w-5 h-5 text-primary mb-2" />
                <h5 className="font-semibold text-foreground text-sm mb-1">{item.title}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission & Vision Footer */}
          <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>Built with care in India · Hardware-free by conviction</span>
            </div>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline group"
            >
              <span>Explore our full founders' journey, vision & story</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default AboutSection;
