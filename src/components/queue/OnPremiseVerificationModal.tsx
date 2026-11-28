import React, { useState, useEffect } from "react";
import { MapPin, ShieldCheck, KeyRound, Crosshair, AlertCircle, Loader2, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  OnPremiseConfig,
  getLocationSnapshot,
  verifyOnPremiseEntry,
  getCounterCodeRateLimitStatus,
  recordFailedCounterCodeAttempt,
  clearCounterCodeAttempts,
} from "@/lib/onPremiseVerification";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  queueId: string;
  businessName: string;
  config: OnPremiseConfig;
  onVerified: () => void;
}

export const OnPremiseVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  queueId,
  businessName,
  config,
  onVerified,
}) => {
  const [step, setStep] = useState<"choose" | "checking_gps" | "code_fallback">("choose");
  const [code, setCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState({ isBlocked: false, remainingSeconds: 0 });

  useEffect(() => {
    if (isOpen) {
      setStep("choose");
      setCode("");
      setGpsError(null);
      setRateLimitInfo(getCounterCodeRateLimitStatus());
    }
  }, [isOpen]);

  // Periodic timer for rate limit countdown if blocked
  useEffect(() => {
    if (!rateLimitInfo.isBlocked) return;
    const interval = setInterval(() => {
      const status = getCounterCodeRateLimitStatus();
      setRateLimitInfo(status);
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitInfo.isBlocked]);

  if (!isOpen) return null;

  const handleGpsCheck = async () => {
    setStep("checking_gps");
    setGpsError(null);

    const loc = await getLocationSnapshot({
      timeoutMs: 8000,
      highAccuracy: true,
      maxAcceptableAccuracyMeters: (config.radius_meters || 250) * 1.5,
    });

    if (loc.ok === false) {
      // Graceful fallback to code: Never trap a customer in GPS retry loops
      setGpsError(loc.message);
      setStep("code_fallback");
      return;
    }

    const { latitude, longitude } = loc.coords;
    const res = await verifyOnPremiseEntry({
      queueId,
      latitude,
      longitude,
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });

    if (res.allowed) {
      toast.success("On-premise location verified");
      onVerified();
      onClose();
    } else {
      setGpsError(res.message || `You appear to be outside the ${config.radius_meters || 250}m radius.`);
      setStep("code_fallback");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) return;

    const rateStatus = getCounterCodeRateLimitStatus();
    if (rateStatus.isBlocked) {
      toast.error(`Too many incorrect attempts. Please wait ${rateStatus.remainingSeconds}s.`);
      return;
    }

    setVerifyingCode(true);
    const res = await verifyOnPremiseEntry({
      queueId,
      counterCode: clean,
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });
    setVerifyingCode(false);

    if (res.allowed) {
      clearCounterCodeAttempts();
      toast.success("Counter code verified");
      onVerified();
      onClose();
    } else {
      recordFailedCounterCodeAttempt();
      setRateLimitInfo(getCounterCodeRateLimitStatus());
      toast.error(res.message || "Incorrect counter code. Please check with reception.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 text-card-foreground">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close on-premise verification"
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "choose" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Verify You're at the Business</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Remote joining is disabled for this queue. A quick 1-time check verifies you're near{" "}
                <strong className="text-foreground">{businessName}</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Checked once strictly to confirm distance. Your location is never saved or tracked.</span>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                onClick={handleGpsCheck}
                className="w-full gradient-bg text-primary-foreground font-semibold py-3 h-11 rounded-xl shadow-md gap-2"
              >
                <Crosshair className="w-4 h-4" /> Verify My Location (1-Tap)
              </Button>

              <button
                type="button"
                onClick={() => setStep("code_fallback")}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" /> Or enter 4-digit Counter Code
              </button>
            </div>
          </div>
        )}

        {step === "checking_gps" && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">Checking distance to {businessName}...</h3>
            <p className="text-xs text-muted-foreground">Please allow the one-time browser location prompt.</p>
          </div>
        )}

        {step === "code_fallback" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Back to location check"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-foreground">Enter Counter Code</h3>
            </div>

            {gpsError && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="leading-snug">{gpsError}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Please enter the 4-digit code displayed on the physical waiting-room screen or ask reception:
            </p>

            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="4-digit code"
                autoFocus
                disabled={rateLimitInfo.isBlocked || verifyingCode}
                className="w-full text-center font-mono text-2xl font-bold tracking-widest py-3 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground placeholder:font-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {rateLimitInfo.isBlocked && (
                <p className="text-[11px] text-destructive text-center mt-1.5 font-medium">
                  Too many attempts. Please retry in {rateLimitInfo.remainingSeconds}s or ask staff.
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={code.length < 3 || verifyingCode || rateLimitInfo.isBlocked}
              className="w-full gradient-bg text-primary-foreground font-semibold py-3 h-11 rounded-xl shadow-md gap-2"
            >
              {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {verifyingCode ? "Verifying..." : "Verify Code & Join Queue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OnPremiseVerificationModal;
