import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Users, BarChart3, Ticket, Settings, LogOut, UtensilsCrossed, BookOpen, History, Activity, Sparkles, Shield } from "lucide-react";
import { SkeletonAppShell } from "@/components/skeletons/DashboardSkeletons";
import logo from "@/assets/qblink-logo.png";
import { supportsPickup } from "@/lib/categories";
import { setLastActiveMode } from "@/lib/auth/roles";
import AIAssistant from "@/components/AIAssistant";
import MobileBottomNav from "@/components/MobileBottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import BusinessPageContainer from "@/components/business/BusinessPageContainer";
import OverflowWarning from "@/components/business/OverflowWarning";

interface Business {
  id: string;
  name: string;
  category: string | null;
}

const BASE_NAV = [
  { to: "/dashboard", label: "Queue Manager", icon: Users },
  { to: "/dashboard/insights", label: "Insights", icon: Sparkles },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/queue-health", label: "Queue Health", icon: Activity },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/tokens", label: "Tokens", icon: Ticket },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const PICKUP_NAV = [
  { to: "/dashboard/menu", label: "Menu", icon: BookOpen },
  { to: "/dashboard/pickup", label: "Pickup Orders", icon: UtensilsCrossed },
];

interface Props {
  children: (business: Business) => ReactNode;
}

const BusinessLayout = ({ children }: Props) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const isDemo = new URLSearchParams(location.search).get("demo") === "true";
  const [business, setBusiness] = useState<Business | null>(() => {
    if (isDemo) {
      return {
        id: "demo-clinic-business",
        name: "Dr. Ambrish Patange OPD & Clinic",
        category: "clinic",
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) {
      setBusiness({
        id: "demo-clinic-business",
        name: "Dr. Ambrish Patange OPD & Clinic",
        category: "clinic",
      });
      setLoading(false);
      return;
    }
    if (!authLoading && !user) navigate("/auth/signin");
    // Accounts without business/admin role (including empty roles: []) are sent to register a business.
    if (!roleLoading && user && !roles.includes("business") && !roles.includes("admin")) {
      navigate("/auth/business");
    }
  }, [user, roles, authLoading, roleLoading, navigate, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    if (user) {
      setLastActiveMode("business");
      supabase.from("businesses").select("*").eq("owner_id", user.id).limit(1).maybeSingle()
        .then(({ data }) => {
          setBusiness(data as Business);
          setLoading(false);
        });
    }
  }, [user, isDemo]);

  if (authLoading || (!isDemo && roleLoading) || loading) return <SkeletonAppShell />;

  if (!isDemo && (!user || (!roles.includes("business") && !roles.includes("admin")))) {
    return <SkeletonAppShell />;
  }

  if (!business) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-muted-foreground mb-4">No business found for your account.</p>
        <Link to="/auth/business" className="text-primary font-semibold hover:underline">Register a business</Link>
      </div>
    </div>
  );

  // Pickup/menu only for restaurants/cafes
  const NAV = supportsPickup(business.category)
    ? [BASE_NAV[0], ...PICKUP_NAV, ...BASE_NAV.slice(1)]
    : BASE_NAV;

  return (
    <div className="min-h-screen soft-bg flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border p-4">
        <Link to="/" className="flex items-center gap-2 mb-6 px-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-bold text-foreground">Qblink</span>
        </Link>

        <div className="bg-muted/50 rounded-xl p-3 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            {business.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{business.name}</p>
            <p className="text-xs text-muted-foreground truncate">{business.category || "Business"}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors mb-2"
          >
            <Shield className="w-4 h-4 shrink-0" /> Admin Panel
          </Link>
        )}

        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Qblink" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-foreground text-sm truncate max-w-[200px]">{business.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="Admin Panel"
              >
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            <button onClick={signOut} className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 lg:pt-8 pb-28 md:pb-8 overflow-x-hidden">
        <BusinessPageContainer>
          <OfflineBanner />
          {children(business)}
        </BusinessPageContainer>
      </main>
      <AIAssistant mode="business" businessId={business.id} />
      <OverflowWarning />
      <MobileBottomNav
        items={[
          ...NAV.map(({ to, label, icon }) => ({ to, label, icon, end: true })),
          ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield, end: false }] : []),
        ]}
      />
    </div>
  );
};

export default BusinessLayout;
