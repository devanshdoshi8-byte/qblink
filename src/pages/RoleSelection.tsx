import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Building2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { resolveUserDashboard } from "@/lib/auth/roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const RoleSelection = () => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading && !roleLoading && !adminLoading) {
      const dest = resolveUserDashboard(roles, isAdmin);
      navigate(dest, { replace: true });
    }
  }, [user, roles, isAdmin, authLoading, roleLoading, adminLoading, navigate]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen soft-bg flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">
          {user ? "Redirecting to your dashboard..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen soft-bg flex flex-col items-center justify-center px-4 py-10">
      <SEO title="Get Started — Qblink" description="Join Qblink as a customer or business and start managing walk-in queues today." path="/auth" />
      <header className="w-full max-w-5xl flex items-center justify-between mb-12">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-xl font-bold text-foreground">Qblink</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/signin" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </header>

      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Join Qblink</h1>
        <p className="text-lg text-muted-foreground">How would you like to use Qblink?</p>
      </div>

      <div className={`w-full max-w-5xl grid gap-6 ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-2 max-w-3xl"}`}>
        <Link
          to="/auth/customer"
          className="group bg-card rounded-3xl p-8 card-shadow hover:elevated-shadow transition-all border border-border hover:border-primary/40"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Customer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Find businesses, join queues remotely, and skip the wait. Get notified when it's your turn.
          </p>
          <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
            Get Started <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/auth/business"
          className="group bg-card rounded-3xl p-8 card-shadow hover:elevated-shadow transition-all border border-border hover:border-secondary/40"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
            <Building2 className="w-7 h-7 text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Business</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Manage your customer queue digitally, reduce crowding, and provide a better experience.
          </p>
          <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm group-hover:gap-3 transition-all">
            Register Business <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className="group bg-card rounded-3xl p-8 card-shadow hover:elevated-shadow transition-all border border-border hover:border-primary/40"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Admin Panel</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Manage the Qblink platform — monitor businesses, customers, queues, and revenue across the network.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
              Open Admin <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-10 text-center">
        By signing up, you agree to our{" "}
        <button
          type="button"
          onClick={() => setLegalModal("terms")}
          className="text-primary hover:underline font-medium focus:outline-none"
        >
          Terms of Service
        </button>{" "}
        and{" "}
        <button
          type="button"
          onClick={() => setLegalModal("privacy")}
          className="text-primary hover:underline font-medium focus:outline-none"
        >
          Privacy Policy
        </button>
      </p>

      <Dialog open={legalModal !== null} onOpenChange={(open) => !open && setLegalModal(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {legalModal === "terms" ? "Terms of Service" : "Privacy Policy"}
            </DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed pt-3 space-y-2 text-muted-foreground">
              {legalModal === "terms" ? (
                <>
                  <p>
                    <strong>1. Acceptance:</strong> By joining Qblink queues or registering a business account, you agree to use the service in accordance with fair queueing practices.
                  </p>
                  <p>
                    <strong>2. Hardware-Free Service:</strong> Qblink operates in real-time over web and mobile browsers without requiring physical hardware installation.
                  </p>
                  <p>
                    <strong>3. Acceptable Use:</strong> Spamming queue slots, abusing notifications, or attempting unauthorized access is strictly prohibited.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Data Protection:</strong> We do not sell your personal information to third parties. Customer queue visits are scoped solely to the businesses you interact with.
                  </p>
                  <p>
                    <strong>2. Phone & Email Privacy:</strong> Contact information is used strictly for queue alerts, SMS updates, and authenticated access.
                  </p>
                  <p>
                    <strong>3. Real-Time Signals:</strong> Live queue updates utilize privacy-safe identifiers so your identity is never exposed on public kiosk displays.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleSelection;
