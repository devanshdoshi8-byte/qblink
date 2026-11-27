import { motion } from "framer-motion";
import BorderGlow from "@/components/reactbits/BorderGlow";

const notes = [
  {
    title: "\"How long?\"",
    body: "The same question, all day. Every answer is a guess. Every guess is a promise you'll be judged on.",
    tag: "Front desk",
    rot: "-3deg",
    offset: "translate-y-0",
  },
  {
    title: "Two queues, one counter.",
    body: "Walk-ins and phone-ins fight for the same spot. Someone always loses. Usually it's the customer standing right in front of you.",
    tag: "Salon owner",
    rot: "2deg",
    offset: "translate-y-6 lg:translate-y-12",
  },
  {
    title: "The 6pm crush.",
    body: "Peak hour is 90 minutes of triage. Staff stops selling and starts apologising. Revenue leaks out the door.",
    tag: "Clinic manager",
    rot: "-1.5deg",
    offset: "-translate-y-2 lg:-translate-y-6",
  },
];

export const StaffNotes = () => (
  <section
    className="relative deep-surface py-24 sm:py-32 overflow-hidden"
    aria-label="Operational reality"
  >
    <div className="max-w-7xl mx-auto px-6 lg:px-24">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl text-cream max-w-2xl leading-tight">
            The notes we heard, pinned to the back of the counter.
          </h2>
        </div>
        <div className="font-mono-caps text-cream/40 max-w-xs">
          Field interviews · 42 businesses · Mumbai + Pune + Bangalore
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
        {notes.map((n, i) => (
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            key={i}
            className={`${n.offset}`}
            style={{ transform: `rotate(${n.rot})` }}
          >
            <BorderGlow
              backgroundColor="#f3f1ec"
              surfaceTheme="light"
              borderRadius={16}
              glowColor="195 78 28"
              colors={["#10637f", "#51c2c2", "#0e1e34"]}
              className="h-full"
            >
              <div className="p-8 h-full flex flex-col">
                <div className="font-mono-caps text-ink/50 mb-4">Note 0{i + 1}</div>
                <div className="font-display text-2xl text-ink leading-snug italic">
                  {n.title}
                </div>
                <p className="text-ink/70 mt-4 leading-relaxed flex-1">{n.body}</p>
                <div className="mt-8 pt-4 border-t border-dashed border-ink/25 font-mono-caps text-ink/50">
                  — {n.tag}
                </div>
              </div>
            </BorderGlow>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);