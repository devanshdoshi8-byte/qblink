import React, { useState } from "react";
import { MapPin, ShieldCheck, KeyRound, RotateCcw, Crosshair, Check, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { OnPremiseConfig, DEFAULT_RADIUS_METERS, generateCounterCode } from "@/lib/onPremiseVerification";
import InfoHint from "@/components/InfoHint";
import { Button } from "@/components/ui/button";

interface Props {
  remoteJoiningEnabled: boolean;
  config: OnPremiseConfig;
  onSave: (config: OnPremiseConfig) => Promise<void>;
}

export const OnPremiseJoiningCard: React.FC<Props> = ({
  remoteJoiningEnabled,
  config,
  onSave,
}) => {
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  const enabled = Boolean(config?.enabled);
  const radius = config?.radius_meters || DEFAULT_RADIUS_METERS;
  const counterCode = config?.counter_code || "1234";
  const hasCoords = typeof config?.latitude === "number" && typeof config?.longitude === "number";

  const handleToggle = async (val: boolean) => {
    setSaving(true);
    try {
      const next: OnPremiseConfig = {
        ...config,
        enabled: val,
        radius_meters: config?.radius_meters || DEFAULT_RADIUS_METERS,
        counter_code: config?.counter_code || generateCounterCode(),
        counter_code_updated_at: config?.counter_code_updated_at || new Date().toISOString(),
      };
      await onSave(next);
      toast.success(val ? "On-premise verification enabled" : "On-premise verification disabled");
    } catch {
      toast.error("Failed to update on-premise setting");
    } finally {
      setSaving(false);
    }
  };

  const handleRadiusChange = async (val: number) => {
    const next: OnPremiseConfig = {
      ...config,
      radius_meters: val,
    };
    await onSave(next);
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setCapturing(false);
        const { latitude, longitude } = pos.coords;
        const next: OnPremiseConfig = {
          ...config,
          latitude,
          longitude,
        };
        await onSave(next);
        toast.success(`Premises location captured (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setCapturing(false);
        toast.error(`Unable to capture location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRegenerateCode = async () => {
    const newCode = generateCounterCode();
    const next: OnPremiseConfig = {
      ...config,
      counter_code: newCode,
      counter_code_updated_at: new Date().toISOString(),
    };
    await onSave(next);
    toast.success(`New counter code generated: ${newCode}`);
  };

  return (
    <div className="min-w-0 bg-card rounded-2xl p-4 sm:p-6 card-shadow border border-border/80">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground text-base">On-Premise Joining</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Optional
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Location verification and Counter Code</p>
          </div>
        </div>

        {/* Info Hint */}
        <InfoHint
          title="What is On-Premise Joining?"
          description="When remote joining is switched off, customers must verify that they are at your business before receiving a queue token."
          example="Customers use a 1-time location check (250m) or enter the Counter Code shown on your counter display."
        />
      </div>

      {/* Visual Explainer Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5 text-xs space-y-3">
        <div>
          <span className="font-bold text-foreground block mb-0.5">What is it?</span>
          <p className="text-muted-foreground leading-relaxed">
            When remote joining is switched off, customers must verify that they are at your business before receiving a queue token.
          </p>
        </div>
        <div>
          <span className="font-bold text-foreground block mb-0.5">How does it work?</span>
          <p className="text-muted-foreground leading-relaxed">
            Customers can use a one-time location check within your configured radius or enter the Counter Code displayed at your physical premises.
          </p>
        </div>
        <div>
          <span className="font-bold text-foreground block mb-0.5">What does it help prevent?</span>
          <p className="text-muted-foreground leading-relaxed">
            It helps discourage people from joining remotely when your business only wants on-site queue entries, keeping the queue more representative of customers actually waiting.
          </p>
        </div>
      </div>

      {/* Remote Joining Status Banner */}
      {remoteJoiningEnabled ? (
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 mb-4 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground leading-relaxed">
            <strong>Remote Joining is currently ON.</strong> Customers can join from anywhere. On-premise verification will automatically apply whenever Remote Joining is switched OFF.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs flex items-start gap-2.5 text-foreground">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
            <strong>Remote Joining is OFF.</strong> On-premise verification is active to allow physical visitors to join while preventing remote line-jumping.
          </p>
        </div>
      )}

      {/* Main Toggle Row */}
      <div className="rounded-xl border border-border bg-background/50 p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Require on-site verification</p>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {enabled ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only applies when Remote Joining is OFF.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleToggle(!enabled)}
            aria-label="Toggle on-site verification"
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              enabled ? "gradient-bg" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${
                enabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Controls when Enabled */}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-border/60 animate-in fade-in duration-200">
          {/* Radius & Location setup */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Permitted Radius
              </span>
              <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {radius} metres {radius === 250 ? "(Recommended)" : ""}
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={radius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>100m (Tight)</span>
              <span>250m (Default)</span>
              <span>1 km (Broad campus)</span>
            </div>

            {/* Location capture */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs">
                <span className="text-muted-foreground block text-[11px]">Business Location Coordinates:</span>
                {hasCoords ? (
                  <span className="font-mono text-xs text-foreground font-semibold">
                    {config.latitude?.toFixed(4)}, {config.longitude?.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" /> Not set yet
                  </span>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={capturing}
                onClick={handleCaptureLocation}
                className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Crosshair className={`w-3.5 h-3.5 ${capturing ? "animate-spin" : ""}`} />
                {capturing ? "Capturing..." : hasCoords ? "Update Location" : "Capture Current Location"}
              </Button>
            </div>
          </div>

          {/* In-Store Counter Code Fallback */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> In-Store Counter Code (Fallback)
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Customers enter this code if their location check fails or GPS is denied.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegenerateCode}
                title="Generate new code"
                aria-label="Generate new code"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-card rounded-xl border border-border p-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Today's Code
                </span>
                <span className="font-mono font-extrabold text-2xl tracking-widest text-primary">
                  {counterCode}
                </span>
              </div>

              <div className="text-right text-[11px] text-muted-foreground max-w-[200px]">
                Displayed automatically on your physical waiting-room display.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnPremiseJoiningCard;
