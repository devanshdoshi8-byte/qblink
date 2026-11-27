import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  className?: string;
  size?: "sm" | "md";
  overStage?: boolean;
};

/**
 * Quick sun/moon theme toggle with explicit high-contrast surfaces
 * over both the dark hero stage and scrolled light/dark navbars.
 */
export const ThemeToggle = ({ className = "", size = "md", overStage = false }: Props) => {
  const { theme, toggle } = useTheme();
  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const icon = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  const surfaceClass =
    overStage || theme === "dark"
      ? "border-slate-700 bg-slate-900/90 text-slate-100 hover:border-primary hover:text-primary"
      : "border-slate-300 bg-slate-100 text-slate-900 hover:border-primary hover:text-primary";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      className={`no-theme-transition relative inline-flex items-center justify-center ${dim} rounded-full border transition-colors ${surfaceClass} ${className}`}
    >
      <Sun
        className={`${icon} absolute transition-all duration-500 ${
          theme === "dark" ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`${icon} absolute transition-all duration-500 ${
          theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        }`}
      />
    </button>
  );
};