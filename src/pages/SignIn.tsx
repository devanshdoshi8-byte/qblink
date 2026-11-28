import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Mail, Lock, Phone, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";
import { COUNTRY_CODES, normalizePhone, phoneToEmail, isValidPhone } from "@/lib/phoneAuth";
import { resolveUserDashboard, setLastActiveMode } from "@/lib/auth/roles";
import { setPending } from "@/lib/auth/pendingAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getSavedCustomerDetails, saveCustomerDetails } from "@/lib/storage/cookieStorage";

const SignIn = () => {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const nextUrl = searchParams.get("next");
  const safeNext = nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : null;
  const rawRole = searchParams.get("role");
  const initialRole: "customer" | "business" | null =
    rawRole === "customer" || rawRole === "business" ? rawRole : null;
  const [selectedRole, setSelectedRole] = useState<"customer" | "business" | null>(initialRole);

  useEffect(() => {
    if (rawRole === "customer" || rawRole === "business") {
      setSelectedRole(rawRole);
    }
  }, [rawRole]);

  const signupHref = safeNext
    ? `/auth/customer?next=${encodeURIComponent(safeNext)}`
    : selectedRole === "customer"
    ? "/auth/customer"
    : selectedRole === "business"
    ? "/auth/business"
    : "/auth";

  // Prefill phone and email from saved cookies so user never has to re-type
  useEffect(() => {
    try {
      const saved = getSavedCustomerDetails();
      if (saved.phone) setPhone(saved.phone);
      if (saved.email) setEmail(saved.email);
    } catch {}
  }, []);

  useEffect(() => {
    if (user && !authLoading && !roleLoading && !adminLoading) {
      if (safeNext) {
        navigate(safeNext, { replace: true });
        return;
      }
      if (selectedRole === "customer") {
        setLastActiveMode("customer");
        navigate("/customer-dashboard", { replace: true });
        return;
      }
      if (selectedRole === "business" && roles.includes("business")) {
        setLastActiveMode("business");
        navigate("/dashboard", { replace: true });
        return;
      }
      const target = resolveUserDashboard(roles, isAdmin);
      navigate(target, { replace: true });
    }
  }, [user, roles, authLoading, roleLoading, adminLoading, isAdmin, navigate, safeNext, selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    let loginEmail = email.trim();
    if (mode === "phone") {
      if (!isValidPhone(phone)) {
        setErrorMsg("Enter a valid WhatsApp number (at least 7 digits).");
        setLoading(false);
        return;
      }
      loginEmail = phoneToEmail(normalizePhone(countryCode, phone));
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        const raw = (error.message || "").toLowerCase();
        let msg = mode === "phone"
          ? "We couldn't sign you in. Check your number and password."
          : "We couldn't sign you in. Check your email and password.";
        if (raw.includes("invalid login")) {
          msg = mode === "phone"
            ? "That number and password don't match. Try again or create an account."
            : "That email and password don't match. Try again or reset your password.";
        } else if (raw.includes("email not confirmed") || raw.includes("not confirmed")) {
          msg = "Please verify your account first, then sign in.";
        } else if (raw.includes("rate") || raw.includes("too many")) {
          msg = "Too many attempts. Please wait a moment and try again.";
        } else if (raw.includes("network") || raw.includes("fetch")) {
          msg = "Network issue. Check your connection and try again.";
        }
        setErrorMsg(msg);
        toast.error(msg);
        setLoading(false);
      } else {
        try {
          saveCustomerDetails({
            phone: mode === "phone" ? phone.trim() : undefined,
            email: mode === "email" ? email.trim() : undefined,
          });
        } catch {}
        toast.success("Welcome back!");
        if (selectedRole) {
          setLastActiveMode(selectedRole);
        }
        // Keep loading while useEffect routes; safety fallback if routing lags
        setTimeout(() => {
          if (window.location.pathname.includes("/auth/signin")) {
            navigate(
              safeNext ||
                (selectedRole === "customer"
                  ? "/customer-dashboard"
                  : resolveUserDashboard(roles, isAdmin))
            );
          }
        }, 2000);
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

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
    <div className="min-h-screen soft-bg flex items-center justify-center px-4 py-10">
      <SEO title="Sign in — Qblink" description="Sign in to your Qblink account to manage queues or track your spot." path="/auth/signin" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logo} alt="Qblink" className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-2xl font-bold text-foreground">Qblink</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your {selectedRole === "customer" ? "customer" : selectedRole === "business" ? "business" : "customer or business"} Qblink account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/70" role="group" aria-label="Account type">
            <button
              type="button"
              onClick={() => {
                setSelectedRole(selectedRole === "customer" ? null : "customer");
                setErrorMsg(null);
              }}
              className={`py-2 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                selectedRole === "customer"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole(selectedRole === "business" ? null : "business");
                setErrorMsg(null);
              }}
              className={`py-2 min-h-[38px] rounded-lg text-xs font-semibold transition ${
                selectedRole === "business"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Business
            </button>
          </div>

          <GoogleSignInButton
            disabled={loading}
            onBeforeOAuth={() => {
              setErrorMsg(null);
              if (safeNext) setPending("next", safeNext);
              if (selectedRole) setPending("role", selectedRole);
            }}
            onError={(msg) => setErrorMsg(msg)}
          />

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-border" />
            <span className="mx-3 shrink-0 text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-grow border-t border-border" />
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted">
            <button
              type="button"
              onClick={() => { setMode("phone"); setErrorMsg(null); }}
              className={`py-2 rounded-lg text-sm font-medium transition ${mode === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => { setMode("email"); setErrorMsg(null); }}
              className={`py-2 rounded-lg text-sm font-medium transition ${mode === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Email
            </button>
          </div>

          {mode === "phone" ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-0">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                    required
                    placeholder="98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/15 p-3 flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-200 font-medium leading-snug">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to={signupHref} className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
