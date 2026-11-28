import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, Play, Activity, Tv, Layers, DollarSign, X, ArrowRight, Download } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { savePreferredRole } from "@/lib/storage/cookieStorage";
import { QBlinkWordmark } from "@/components/qb/QBlinkWordmark";
import { motion, AnimatePresence } from "framer-motion";

const openInstall = () => window.dispatchEvent(new Event("qb:open-install"));

const demoLinks = [
  {
    title: "Dual-Device Pitch Simulator",
    href: "/pitch",
    desc: "Interactive live sync between phone pass & staff terminal",
    icon: Play,
    badge: "Stage Ready",
    badgeColor: "bg-success-soft text-success border-success/30",
  },
  {
    title: "Chaos to Clarity Story",
    href: "/chaos-to-clarity",
    desc: "10-second visual before & after walk-in transformation",
    icon: Activity,
    badge: "10s Pitch",
    badgeColor: "bg-warning-soft text-warning border-warning/30",
  },
  {
    title: "4-Industry Spatial Morphing",
    href: "/industries",
    desc: "Clinic, Restaurant, Salon & Civic preset simulator",
    icon: Layers,
    badge: "Multi-Industry",
    badgeColor: "bg-info-soft text-info border-info/30",
  },
  {
    title: "Illustrative ROI Calculator",
    href: "/roi",
    desc: "Interactive footfall recovery & economic model",
    icon: DollarSign,
    badge: "Business Model",
    badgeColor: "bg-primary/10 text-primary border-primary/25",
  },
  {
    title: "Scan & Go Public TV Display",
    href: "/display/demo",
    desc: "Full-screen kiosk mode with voice announcer & live QR",
    icon: Tv,
    badge: "Kiosk Mode",
    badgeColor: "bg-primary/10 text-primary border-primary/25",
  },
];

const rawLinks = [
  { label: "Product", href: "#product" },
  { label: "Pilots", href: "#pilots" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/**
 * Combined TopNav — fuses QBlinkWordmark, Interactive Live Demos dropdown,
 * PillNav + GlassSurface, Inventure IIT Gandhinagar recognition badge,
 * Auth-aware Dashboard routing, and responsive mobile drawer without overflow.
 */
export const TopNav = () => {
  const { user } = useAuth();
  const { roles } = useUserRole();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const businessHref = user
    ? (roles.includes("business") ? "/dashboard" : "/auth/business")
    : "/auth/business";

  const links = rawLinks.map((l) => ({
    ...l,
    href: l.href.startsWith("#") ? (isHome ? l.href : `/${l.href}`) : l.href,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDemosOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDemosOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-[4.5rem] flex items-center gap-3 sm:gap-5">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-h-[44px]" aria-label="Qblink home">
            <QBlinkWordmark textClassName={`text-lg sm:text-xl ${scrolled ? "text-foreground" : "stage-text"}`} />
            <span className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25 whitespace-nowrap">
              Inventure · IIT Gandhinagar
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-3 text-sm">
            {/* Interactive Demos Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDemosOpen(!demosOpen)}
                className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  demosOpen
                    ? "text-primary bg-primary/10"
                    : scrolled
                    ? "text-foreground hover:text-primary"
                    : "stage-muted hover:text-[hsl(var(--brand-cream))]"
                }`}
                aria-expanded={demosOpen}
              >
                <span>Live Demos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${demosOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {demosOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-2.5 shadow-2xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Interactive Pitch & Product Demos
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Live
                      </span>
                    </div>

                    <div className="space-y-1">
                      {demoLinks.map((demo) => {
                        const Icon = demo.icon;
                        return (
                          <Link
                            key={demo.href}
                            to={demo.href}
                            onClick={() => setDemosOpen(false)}
                            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-900/90 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-xs font-semibold text-slate-100 group-hover:text-primary transition-colors truncate">
                                  {demo.title}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${demo.badgeColor}`}>
                                  {demo.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                                {demo.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav aria-label="Primary" className="flex items-center gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-full px-3 py-2 transition-colors ${
                    scrolled ? "text-foreground hover:bg-muted" : "stage-text hover:bg-primary/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              onClick={openInstall}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                scrolled ? "text-muted-foreground hover:text-foreground" : "stage-muted hover:text-[hsl(var(--brand-cream))]"
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Install App
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link
              to="/pitch"
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                scrolled
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-primary/40 bg-primary/20 text-[hsl(var(--brand-cream))] hover:bg-primary/30"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>Pitch Demo</span>
            </Link>
            {user ? (
              <Link
                to={roles.includes("business") ? "/dashboard" : "/customer-dashboard"}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className={`hidden sm:inline-block text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    scrolled ? "text-foreground hover:bg-muted" : "stage-text hover:bg-[hsl(var(--brand-cream)/0.1)]"
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to={businessHref}
                  onClick={() => savePreferredRole("business")}
                  className="hidden sm:inline-flex items-center text-sm font-medium px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Start 1st Month Free
                </Link>
                <Link
                  to="/customer-dashboard"
                  className="sm:hidden inline-flex items-center text-xs font-semibold px-3 py-2 min-h-[40px] rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Join queue
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className={`xl:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg ${scrolled ? "text-foreground" : "stage-text"}`}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Drawer */}
        <div
          className={`xl:hidden overflow-hidden transition-all duration-300 ease-out ${
            open ? "max-h-[85vh] overflow-y-auto" : "max-h-0"
          }`}
        >
          <div className="bg-background border-b border-border px-5 pb-24 pt-2 space-y-4">
            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25">
                Incubated at Inventure · IIT Gandhinagar
              </span>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Interactive Demos
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {demoLinks.map((d) => (
                  <Link
                    key={d.href}
                    to={d.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/70 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <span className="font-semibold">{d.title}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${d.badgeColor}`}>
                      {d.badge}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Explore
              </p>
              <div className="space-y-1">
                {links.map((l) =>
                  l.href.startsWith("/") && !l.href.startsWith("/#") ? (
                    <Link
                      key={l.href}
                      to={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center min-h-[44px] py-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center min-h-[44px] py-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </a>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openInstall();
                  }}
                  className="flex items-center gap-2 min-h-[44px] py-2 text-sm text-foreground hover:text-primary transition-colors w-full text-left"
                >
                  <Download className="w-4 h-4" /> Install App
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2.5">
                <ThemeToggle />
                <span className="text-xs font-medium text-muted-foreground">Appearance</span>
              </div>
              {user ? (
                <Link
                  to={roles.includes("business") ? "/dashboard" : "/customer-dashboard"}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center min-h-[44px] px-3 text-sm font-semibold text-primary"
                >
                  Dashboard →
                </Link>
              ) : (
                <Link to="/auth/signin" onClick={() => setOpen(false)} className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-foreground">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Mobile Action Bar on Home */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-lg border-t border-border flex items-center gap-2.5">
        <Link
          to="/pitch"
          className="flex-1 min-h-[44px] px-3 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Try Pitch Demo</span>
        </Link>
        <Link
          to={businessHref}
          onClick={() => savePreferredRole("business")}
          className="flex-1 min-h-[44px] px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs text-center flex items-center justify-center gap-1 shadow-sm"
        >
          <span>Start 1st Month Free</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </>
  );
};
