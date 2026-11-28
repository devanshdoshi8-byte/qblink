import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Monogram } from "./Monogram";
import { Button } from "@/components/ui/button";

const marqueeItems = [
  "No app",
  "No hardware",
  "1st month free",
  "₹499/mo self-sustainable",
  "Inventure · IIT Gandhinagar",
  "Live position",
  "Under 2 min setup",
  "Browser-native",
];

export const Signature = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    try {
      navigator.clipboard?.writeText("teamqblink@gmail.com");
    } catch {
      // ignore clipboard errors in restricted contexts
    }
    setCopied(true);
    toast.success("Copied!");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="contact" className="relative ink-surface overflow-hidden pb-24 xl:pb-0">
      {/* marquee */}
      <div className="border-y border-glow/20 overflow-hidden">
        <div className="flex gap-10 sm:gap-16 animate-marquee font-display text-3xl sm:text-5xl lg:text-6xl text-cream/20 py-4 sm:py-6 whitespace-nowrap" style={{ animationDuration: "55s" }}>
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="flex items-center gap-10 sm:gap-16">
              {t}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-glow/60" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      {/* CTA + signature */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[hsl(var(--brand-navy)/0.72)] via-[hsl(var(--brand-navy)/0.55)] to-[hsl(var(--brand-navy)/0.88)]"
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-24 py-14 sm:py-24 text-center relative z-10">
          <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-cream leading-[0.95]">
            Give an hour
            <br />
            <span className="text-glow italic font-normal">back.</span>
          </h2>
          <p className="mt-5 sm:mt-8 text-sm sm:text-base text-cream/75 max-w-lg mx-auto">
            1st month is 100% free. Setup takes two minutes. Thereafter just ₹499/mo to self-sustain server and SMS costs.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3.5 sm:gap-4 justify-center items-stretch sm:items-center">
            <Link
              to="/auth/business"
              className="bg-glow text-ink font-mono-caps min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-4 rounded-xl hover:bg-cream transition-colors text-center"
            >
              Start 1st month free →
            </Link>
            <Button
              variant="outline"
              onClick={() => navigate("/onboarding")}
              className="font-mono-caps min-h-[48px] w-full max-w-full rounded-xl border-glow/50 bg-glow/10 px-5 py-4 text-cream hover:bg-glow hover:text-ink sm:w-auto sm:px-6"
            >
              Walk through it first
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-glow/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-mono-caps text-cream/30 mb-3 text-xs">Product</div>
            <div className="space-y-2">
              <a href="/#product" className="block text-cream/60 hover:text-glow transition-colors">How it works</a>
              <a href="/#pilots" className="block text-cream/60 hover:text-glow transition-colors">Mumbai Pilots</a>
              <a href="/#pricing" className="block text-cream/60 hover:text-glow transition-colors">Pricing (₹499/mo)</a>
            </div>
          </div>
          <div>
            <div className="font-mono-caps text-cream/30 mb-3 text-xs">Industries</div>
            <div className="space-y-2">
              <Link to="/industries" className="block text-cream/60 hover:text-glow transition-colors">Clinics &amp; OPDs</Link>
              <Link to="/industries" className="block text-cream/60 hover:text-glow transition-colors">Salons &amp; Spas</Link>
              <Link to="/industries" className="block text-cream/60 hover:text-glow transition-colors">Restaurants</Link>
            </div>
          </div>
          <div>
            <div className="font-mono-caps text-cream/30 mb-3 text-xs">Company</div>
            <div className="space-y-2">
              <Link to="/about" className="block text-cream/60 hover:text-glow transition-colors">About &amp; Founders</Link>
              <a href="/#faq" className="block text-cream/60 hover:text-glow transition-colors">FAQ</a>
              <Link to="/affiliate" className="block text-cream/60 hover:text-glow transition-colors">Affiliate</Link>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 text-cream/70 hover:text-glow transition-colors text-left"
              >
                <span>teamqblink@gmail.com</span>
                {copied ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-glow/20 px-2 py-0.5 text-[10px] font-mono-caps text-glow">
                    <Check className="w-2.5 h-2.5" /> Copied!
                  </span>
                ) : (
                  <Copy className="w-3 h-3 opacity-60" aria-hidden />
                )}
              </button>
            </div>
          </div>
          <div>
            <div className="font-mono-caps text-cream/30 mb-3 text-xs">Get started</div>
            <div className="space-y-2">
              <Link to="/auth" className="block text-cream/60 hover:text-glow transition-colors">Sign up free</Link>
              <Link to="/auth/signin" className="block text-cream/60 hover:text-glow transition-colors">Sign in</Link>
              <Link to="/pitch" className="block text-cream/60 hover:text-glow transition-colors">Live demo</Link>
            </div>
          </div>
        </div>
      </div>

      {/* signature block */}
      <div className="border-t border-glow/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-24 pt-8 pb-28 xl:pb-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-cream/50 font-mono-caps text-xs">
          <div className="flex items-center gap-3">
            <Monogram className="w-6 h-6 text-glow" />
            <span>Qblink · Incubated at Inventure, IIT Gandhinagar</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-glow transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-glow transition-colors">Terms of Service</Link>
          </div>
          <span className="text-cream/40">1st Month Free · ₹499/mo Self-Sustainable.</span>
        </div>
      </div>
    </footer>
  );
};
