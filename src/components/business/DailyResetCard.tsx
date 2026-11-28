import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sunrise,
  Clock,
  Globe,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  CalendarDays,
  Info
} from "lucide-react";
import {
  DailyResetConfig,
  defaultDailyResetConfig,
  normalizeDailyResetConfig,
  POPULAR_TIMEZONES,
  RESET_TIME_PRESETS,
  formatResetTimeLabel,
  formatTimezoneShort
} from "@/lib/dailyReset";

interface Props {
  businessId: string;
}

export default function DailyResetCard({ businessId }: Props) {
  const [config, setConfig] = useState<DailyResetConfig>(defaultDailyResetConfig());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTime, setCustomTime] = useState(false);
  const [showManualInfo, setShowManualInfo] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("settings")
        .eq("id", businessId)
        .maybeSingle();

      if (!active) return;
      if (!error && data) {
        const parsed = normalizeDailyResetConfig((data as any)?.settings);
        setConfig(parsed);
        const isPreset = RESET_TIME_PRESETS.some(p => p.value === parsed.time);
        setCustomTime(!isPreset);
      }
      setLoaded(true);
    })();

    return () => { active = false; };
  }, [businessId]);

  const save = async () => {
    setSaving(true);
    try {
      const { data: current } = await supabase
        .from("businesses")
        .select("settings")
        .eq("id", businessId)
        .maybeSingle();

      const currentSettings = ((current as any)?.settings as any) || {};
      const updatedSettings = {
        ...currentSettings,
        daily_reset: config,
      };

      const { error } = await supabase
        .from("businesses")
        .update({ settings: updatedSettings } as any)
        .eq("id", businessId);

      if (error) throw error;
      toast.success("Daily reset schedule saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save daily reset schedule");
    } finally {
      setSaving(false);
    }
  };

  const useDeviceTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setConfig(prev => ({ ...prev, timezone: tz }));
        toast.info(`Timezone updated to ${tz}`);
      }
    } catch {
      toast.error("Could not detect device timezone");
    }
  };

  const timeLabel = formatResetTimeLabel(config.time);
  const tzShort = formatTimezoneShort(config.timezone);

  return (
    <div className="min-w-0 bg-card rounded-2xl p-4 sm:p-6 card-shadow lg:col-span-2 border border-border/80">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
            <Sunrise className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base md:text-lg">Daily Queue Reset & Schedule</h2>
            <p className="text-xs text-muted-foreground">
              Automatically closes each business day, archives history, and resets tokens to #1 for tomorrow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              config.enabled ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${config.enabled ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
            {config.enabled ? `Auto-resets at ${timeLabel} (${tzShort})` : "Manual Mode (Paused)"}
          </span>
        </div>
      </div>

      {!loaded ? (
        <div className="h-44 rounded-xl bg-muted/40 animate-pulse mt-4" />
      ) : (
        <div className="space-y-5 mt-4">
          {/* Main enable toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
            <div className="space-y-0.5 max-w-xl">
              <label htmlFor="daily-reset-toggle" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
                <span>Automated Daily Reset</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Recommended
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                When enabled, your queue resets quietly in the background at night. You don't have to remember to press "Start New Day" at closing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                id="daily-reset-toggle"
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Time & Timezone controls */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${config.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            {/* Reset Time selection */}
            <div className="min-w-0 space-y-2 p-4 rounded-xl border border-border bg-background/50">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  Scheduled Reset Time
                </label>
                <button
                  type="button"
                  onClick={() => setCustomTime(v => !v)}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {customTime ? "Use preset time" : "Custom time"}
                </button>
              </div>

              {!customTime ? (
                <select
                  aria-label="Scheduled Reset Time"
                  value={config.time}
                  onChange={e => setConfig(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full min-w-0 max-w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {RESET_TIME_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label="Custom Reset Time"
                    value={config.time}
                    onChange={e => setConfig(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full min-w-0 text-sm px-3 py-2 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({formatResetTimeLabel(config.time)})
                  </span>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Most clinics and walk-in businesses reset at midnight (12:00 AM). Nightclubs and late cafes can select 3:00 AM.
              </p>
            </div>

            {/* Timezone selection */}
            <div className="min-w-0 space-y-2 p-4 rounded-xl border border-border bg-background/50">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" />
                  Business Timezone
                </label>
                <button
                  type="button"
                  onClick={useDeviceTimezone}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Detect device
                </button>
              </div>

              <select
                aria-label="Business Timezone"
                value={config.timezone}
                onChange={e => setConfig(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full min-w-0 max-w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {POPULAR_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
                {!POPULAR_TIMEZONES.some(t => t.value === config.timezone) && (
                  <option value={config.timezone}>{config.timezone}</option>
                )}
              </select>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your queue calculates midnight based on this local time ({tzShort}).
              </p>
            </div>
          </div>

          {/* Activity safeguard checkbox */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="only-if-active"
              checked={config.only_if_active ?? true}
              onChange={e => setConfig(prev => ({ ...prev, only_if_active: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary/30"
            />
            <label htmlFor="only-if-active" className="text-xs text-muted-foreground cursor-pointer">
              Only archive days that had customer activity (prevents creating empty history logs on closed days).
            </label>
          </div>

          {/* Visual explainer grid */}
          <div className="bg-muted/30 border border-border/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-warning" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                What happens at {timeLabel} every night:
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-card border border-border/60 rounded-xl space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-primary" /> Token #1 Reset
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your queue counters reset to 0 so tomorrow's first walk-in customer receives Token #1.
                </p>
              </div>

              <div className="p-3 bg-card border border-border/60 rounded-xl space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-success" /> Session Archived
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Today's total visitors, served count, and average wait time are saved to Queue History.
                </p>
              </div>

              <div className="p-3 bg-card border border-border/60 rounded-xl space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-info" /> No-Show Cleanup
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Any leftover customers who never arrived or weren't served are marked as no-show.
                </p>
              </div>

              <div className="p-3 bg-card border border-border/60 rounded-xl space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-warning" /> 100% Automated
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Runs silently in the cloud. You can still tap "Start New Day" manually on the dashboard anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Changes apply immediately across all your queues.
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="gradient-bg text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Schedule"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
