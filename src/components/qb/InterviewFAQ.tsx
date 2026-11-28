import { useState } from "react";

const qa = [
  {
    q: "Who started QBlink and who are the founders?",
    a: "Devansh (Founder & Creator) started Qblink to eliminate chaotic waiting lines with a browser-native customer flow intelligence platform. He was subsequently joined by co-founders Mithil, Aarav, and Vihan Patange to scale Qblink across clinics, salons, restaurants, and walk-in desks.",
  },
  {
    q: "What are Qblink's key achievements and recognition?",
    a: "Qblink is incubated at Inventure, IIT Gandhinagar and placed 2nd Globally at the International Design Championship 2026. It has already been pilot-validated on-ground across Mumbai clinics with 109+ served tokens.",
  },
  {
    q: "Is Qblink free to use?",
    a: "Your first month is 100% free with all features unlocked. Thereafter, Qblink operates as a self-sustainable social initiative incubated at Inventure, IIT Gandhinagar at just ₹499/month strictly covering raw server, SMS, and database costs (₹0 founder profit).",
  },
  {
    q: "Do customers or businesses need apps or hardware?",
    a: "None. Customers simply scan a QR code or open a link in whatever browser is already on their phone, while businesses manage the queue from any existing phone, tablet, or laptop.",
  },
  {
    q: "Can walk-ins and remote digital joiners be managed together?",
    a: "Yes. Customers can join remotely from home or their car, and front-desk staff can add walk-ins into the exact same unified queue across single or multiple counters.",
  },
  {
    q: "How does the wait estimate stay accurate, and what happens at night?",
    a: "Qblink continuously tracks your average service pace and live queue position to calculate dynamic ETAs, and automatically resets queue tokens back to #1 every night at midnight (12:00 AM) in your local timezone.",
  },
  {
    q: "How fast is setup?",
    a: "Under two minutes from account creation to your first live QR standee. No training or onboarding calls required.",
  },
];

export const InterviewFAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative deep-surface py-24 sm:py-32" aria-label="Interview">
      <div className="max-w-5xl mx-auto px-6 lg:px-24">
        <div className="font-mono-caps text-glow/80 mb-4">Ch. 09 · Questions</div>
        <h2 className="font-display text-4xl sm:text-5xl text-cream leading-tight max-w-2xl">
          Answers without the fluff.
        </h2>

        <div className="mt-16 space-y-8">
          {qa.map((row, i) => (
            <div key={i} className="border-b border-glow/15 pb-8">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-6 items-baseline"
                aria-expanded={open === i}
              >
                <span className="font-mono-caps text-glow/70">
                  Q · {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-xl sm:text-2xl text-cream leading-snug italic">
                  {row.q}
                </span>
                <span className="font-mono-caps text-glow/60">
                  {open === i ? "–" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="grid grid-cols-[auto_1fr_auto] gap-6 mt-6 animate-fade-in">
                  <span className="font-mono-caps text-cream/40">A ·</span>
                  <p className="text-cream/75 leading-relaxed text-lg">{row.a}</p>
                  <span />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
