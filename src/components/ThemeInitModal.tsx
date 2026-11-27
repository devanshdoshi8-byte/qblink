import { Moon, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

/**
 * First-visit appearance picker. Rendered globally; only shows itself
 * when the user has never chosen a theme. Both options are visually
 * equal — neither is pre-selected. Once picked, we never ask again.
 */
export const ThemeInitModal = () => {
  const { needsChoice, setTheme } = useTheme();
  const { pathname } = useLocation();
  // Public customer journey (QR scan / shared link / kiosk) must be
  // zero-friction — never interrupt it with the appearance picker.
  const isPublicCustomerRoute =
    pathname.startsWith("/join") ||
    pathname.startsWith("/display") ||
    pathname.startsWith("/pickup");
  if (!needsChoice || isPublicCustomerRoute) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-init-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Neutral scrim — works in both themes because it uses a fixed dark tint */}
      <div className="absolute inset-0 bg-[hsl(var(--brand-navy)/0.78)] backdrop-blur-md" />

      <div
        className="no-theme-transition relative w-full max-w-lg rounded-2xl overflow-hidden border border-[hsl(var(--brand-cream)/0.14)] bg-[hsl(var(--brand-navy)/0.97)] shadow-2xl animate-fade-in"
      >
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="font-mono-caps text-[hsl(var(--brand-glow))] tracking-[0.25em] text-[0.72rem]">
            Welcome to Qblink
          </div>
          <h2
            id="theme-init-title"
            className="mt-4 font-display text-[2rem] leading-tight text-[hsl(var(--brand-cream))]"
          >
            Choose your appearance
          </h2>
          <p className="mt-3 text-sm text-[hsl(var(--brand-cream)/0.72)] max-w-xs mx-auto leading-relaxed">
            Pick the look that feels right. You can switch anytime from the menu.
          </p>
        </div>

        <div className="px-6 pb-8 grid grid-cols-2 gap-4">
          <ChoiceCard
            label="Light"
            hint="Clean · bright · airy"
            onClick={() => setTheme("light")}
            preview="light"
          />
          <ChoiceCard
            label="Dark"
            hint="Premium · cinematic · immersive"
            onClick={() => setTheme("dark")}
            preview="dark"
          />
        </div>
      </div>
    </div>
  );
};

const ChoiceCard = ({
  label,
  hint,
  preview,
  onClick,
}: {
  label: string;
  hint: string;
  preview: "light" | "dark";
  onClick: () => void;
}) => {
  const isLight = preview === "light";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-xl overflow-hidden border border-[hsl(var(--brand-cream)/0.14)] hover:border-[hsl(var(--brand-glow)/0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-glow))] transition-colors"
    >
      <div
        className="aspect-[4/3] w-full flex items-center justify-center relative"
        style={{
          background: isLight
            ? "#fbfaf9"
            : "#0e1e34",
        }}
      >
        {isLight ? (
          <Sun className="w-10 h-10" style={{ color: "#10637f" }} strokeWidth={1.5} />
        ) : (
          <Moon className="w-10 h-10" style={{ color: "#51c2c2" }} strokeWidth={1.5} />
        )}

        {/* mock content lines */}
        <div className="absolute left-3 right-3 bottom-3 space-y-1.5">
          <div
            className="h-1.5 rounded-full"
            style={{ background: isLight ? "#0e1e3426" : "#f4f2eb33", width: "70%" }}
          />
          <div
            className="h-1.5 rounded-full"
            style={{ background: isLight ? "#0e1e3414" : "#f4f2eb1f", width: "50%" }}
          />
        </div>
      </div>

      <div className="bg-[hsl(var(--brand-navy))] border-t border-[hsl(var(--brand-cream)/0.1)] px-4 py-3 text-left">
        <div className="font-display text-lg text-[hsl(var(--brand-cream))] leading-none">
          {label}
        </div>
        <div className="font-mono-caps text-[hsl(var(--brand-cream)/0.65)] mt-1.5 tracking-[0.2em] text-[0.62rem]">
          {hint}
        </div>
      </div>
    </button>
  );
};