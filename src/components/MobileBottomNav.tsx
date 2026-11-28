import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LucideIcon, MoreHorizontal, X } from "lucide-react";

export interface BottomNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface Props {
  items: BottomNavItem[];
}

/**
 * App-style bottom navigation. Mobile-only (hidden md+).
 * When items > 5, displays the first 4 items + a "More" drawer.
 */
const MobileBottomNav = ({ items }: Props) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const needsMore = items.length > 5;
  const primaryTabs = needsMore ? items.slice(0, 4) : items;
  const secondaryTabs = needsMore ? items.slice(4) : [];
  const isMoreActive = secondaryTabs.some((t) =>
    t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)
  );

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-card border-t border-border rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="font-bold text-foreground text-sm">More Options</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryTabs.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "gradient-bg text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around max-w-xl mx-auto px-1">
          {primaryTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[11px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="leading-tight truncate max-w-full">{label}</span>
            </NavLink>
          ))}

          {needsMore && (
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[11px] font-medium transition-colors ${
                isMoreActive || moreOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="leading-tight truncate max-w-full">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
