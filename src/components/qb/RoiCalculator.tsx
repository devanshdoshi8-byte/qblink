import React from "react";
import { Link } from "react-router-dom";
import {
  Calculator,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Copy,
  ArrowRight,
  CircleHelp,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
type Industry =
  "clinic" | "restaurant" | "salon" | "diagnostic" | "retail" | "custom";
type Currency = "INR" | "USD";
interface IndustryPreset {
  id: Industry;
  label: string;
  visitorTerm: string;
  valueTerm: string;
  defaultDailyVisitors: number;
  defaultAvgValue: number;
  defaultWalkawayRate: number;
  defaultTargetRate: number;
  defaultOperatingDays: number;
}
interface ScenarioInputs {
  dailyVisitors: number;
  avgCustomerValue: number;
  currentWalkawayRate: number;
  targetWalkawayRate: number;
  operatingDaysPerMonth: number;
  currency: Currency;
}
interface RoiCalculatorProps {
  initialIndustry?: Industry;
  className?: string;
}
const industryPresets: Record<Industry, IndustryPreset> = {
  clinic: {
    id: "clinic",
    label: "🏥 Clinic & OPD",
    visitorTerm: "Daily Patients",
    valueTerm: "Avg. Patient Fee / Ticket",
    defaultDailyVisitors: 80,
    defaultAvgValue: 600,
    defaultWalkawayRate: 12,
    defaultTargetRate: 6,
    defaultOperatingDays: 26,
  },
  restaurant: {
    id: "restaurant",
    label: "☕ Dining & F&B",
    visitorTerm: "Daily Dining Guests",
    valueTerm: "Avg. Bill per Guest",
    defaultDailyVisitors: 150,
    defaultAvgValue: 450,
    defaultWalkawayRate: 15,
    defaultTargetRate: 7,
    defaultOperatingDays: 28,
  },
  salon: {
    id: "salon",
    label: "💇 Salon & Spa",
    visitorTerm: "Daily Salon Visitors",
    valueTerm: "Avg. Service Value",
    defaultDailyVisitors: 45,
    defaultAvgValue: 850,
    defaultWalkawayRate: 10,
    defaultTargetRate: 4,
    defaultOperatingDays: 26,
  },
  diagnostic: {
    id: "diagnostic",
    label: "🔬 Diagnostic Lab",
    visitorTerm: "Daily Lab Patients",
    valueTerm: "Avg. Test Booking Value",
    defaultDailyVisitors: 100,
    defaultAvgValue: 1200,
    defaultWalkawayRate: 8,
    defaultTargetRate: 3,
    defaultOperatingDays: 26,
  },
  retail: {
    id: "retail",
    label: "🛍️ Retail Store",
    visitorTerm: "Daily Store Walk-ins",
    valueTerm: "Avg. Basket Transaction",
    defaultDailyVisitors: 200,
    defaultAvgValue: 350,
    defaultWalkawayRate: 14,
    defaultTargetRate: 6,
    defaultOperatingDays: 30,
  },
  custom: {
    id: "custom",
    label: "🏢 Custom Business",
    visitorTerm: "Daily Walk-in Visitors",
    valueTerm: "Avg. Customer Value",
    defaultDailyVisitors: 120,
    defaultAvgValue: 500,
    defaultWalkawayRate: 10,
    defaultTargetRate: 5,
    defaultOperatingDays: 26,
  },
};
function normalizeInputs(e: ScenarioInputs): ScenarioInputs {
  const t = Math.max(0, Math.min(5e4, Number(e.dailyVisitors) || 0)),
    n = Math.max(0, Math.min(1e6, Number(e.avgCustomerValue) || 0)),
    r = Math.max(0, Math.min(100, Number(e.currentWalkawayRate) || 0)),
    i = Math.max(0, Math.min(r, Number(e.targetWalkawayRate) || 0)),
    s = Math.max(
      1,
      Math.min(31, Math.round(Number(e.operatingDaysPerMonth) || 26)),
    ),
    a = e.currency === "USD" ? "USD" : "INR";
  return {
    dailyVisitors: t,
    avgCustomerValue: n,
    currentWalkawayRate: r,
    targetWalkawayRate: i,
    operatingDaysPerMonth: s,
    currency: a,
  };
}
function calculateScenario(e: ScenarioInputs) {
  const t = normalizeInputs(e),
    n = Math.max(
      0,
      Math.round((t.currentWalkawayRate - t.targetWalkawayRate) * 10) / 10,
    ),
    r = t.currentWalkawayRate / 100,
    i = n / 100,
    s = Math.round(t.dailyVisitors * r),
    a = Math.round(s * t.operatingDaysPerMonth),
    o = Math.round(a * 12),
    l = Math.round(t.dailyVisitors * t.avgCustomerValue * r),
    u = Math.round(l * t.operatingDaysPerMonth),
    c = Math.round(u * 12),
    d = Math.round(t.dailyVisitors * i * t.operatingDaysPerMonth),
    h = Math.round(d * 12),
    p = Math.round(
      t.dailyVisitors * t.avgCustomerValue * i * t.operatingDaysPerMonth,
    ),
    v = Math.round(p * 12),
    g = t.currency === "USD" ? "$" : "₹";
  return {
    dailyLostCustomers: s,
    monthlyLostCustomers: a,
    annualLostCustomers: o,
    dailyRevenueExposure: l,
    monthlyRevenueExposure: u,
    annualRevenueExposure: c,
    rateReductionPercent: n,
    monthlyCustomersRetained: d,
    annualCustomersRetained: h,
    monthlyOpportunityAddressed: p,
    annualOpportunityAddressed: v,
    currencySymbol: g,
  };
}
function formatCurrency(e: number, t: Currency) {
  if (isNaN(e) || !isFinite(e)) return t === "USD" ? "$0" : "₹0";
  const n = t === "USD" ? "$" : "₹",
    r = Math.abs(e);
  return t === "INR"
    ? r >= 1e7
      ? `${n}${(e / 1e7).toFixed(2)} Cr`
      : r >= 1e5
        ? `${n}${(e / 1e5).toFixed(2)} Lakh`
        : `${n}${Math.round(e).toLocaleString("en-IN")}`
    : r >= 1e6
      ? `${n}${(e / 1e6).toFixed(2)}M`
      : r >= 1e3
        ? `${n}${(e / 1e3).toFixed(1)}k`
        : `${n}${Math.round(e).toLocaleString("en-US")}`;
}
const vibrate = (duration: number | number[] = 15) => {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator)
      navigator.vibrate(duration);
  } catch {}
};
const RoiCalculator = ({
  initialIndustry = "clinic",
  className = "",
}: RoiCalculatorProps) => {
  const [industry, setIndustry] = React.useState<Industry>(initialIndustry),
    [currency, setCurrency] = React.useState<Currency>("INR"),
    preset = industryPresets[industry],
    [dailyVisitors, setDailyVisitors] = React.useState(
      preset.defaultDailyVisitors,
    ),
    [avgCustomerValue, setAvgCustomerValue] = React.useState(
      preset.defaultAvgValue,
    ),
    [currentWalkawayRate, setCurrentWalkawayRate] = React.useState(
      preset.defaultWalkawayRate,
    ),
    [targetWalkawayRate, setTargetWalkawayRate] = React.useState(
      preset.defaultTargetRate,
    ),
    [operatingDays, setOperatingDays] = React.useState(
      preset.defaultOperatingDays,
    ),
    [showFormula, setShowFormula] = React.useState(!1),
    [copied, setCopied] = React.useState(!1),
    selectIndustry = (A: Industry) => {
      setIndustry(A);
      const O = industryPresets[A];
      (setDailyVisitors(O.defaultDailyVisitors),
        setAvgCustomerValue(O.defaultAvgValue),
        setCurrentWalkawayRate(O.defaultWalkawayRate),
        setTargetWalkawayRate(O.defaultTargetRate),
        setOperatingDays(O.defaultOperatingDays));
    },
    resetDefaults = () => {
      const A = industryPresets[industry];
      (setDailyVisitors(A.defaultDailyVisitors),
        setAvgCustomerValue(A.defaultAvgValue),
        setCurrentWalkawayRate(A.defaultWalkawayRate),
        setTargetWalkawayRate(A.defaultTargetRate),
        setOperatingDays(A.defaultOperatingDays),
        toast.success("Assumptions reset to industry defaults"));
    },
    results = calculateScenario({
      dailyVisitors: dailyVisitors,
      avgCustomerValue: avgCustomerValue,
      currentWalkawayRate: currentWalkawayRate,
      targetWalkawayRate: targetWalkawayRate,
      operatingDaysPerMonth: operatingDays,
      currency: currency,
    }),
    copySummary = () => {
      const A = `[Qblink Illustrative ROI Scenario]
Industry: ${preset.label}
Daily ${preset.visitorTerm}: ${dailyVisitors}
Avg. Ticket: ${currency === "USD" ? "$" : "₹"}${avgCustomerValue}
Assumed Walkaway Rate: ${currentWalkawayRate}%
Operating Days: ${operatingDays} days/mo
---
Illustrative Annual Revenue Exposure: ${formatCurrency(results.annualRevenueExposure, currency)}
Illustrative Monthly Revenue Exposure: ${formatCurrency(results.monthlyRevenueExposure, currency)}
Estimated Monthly Lost ${preset.visitorTerm}: ${results.monthlyLostCustomers}
---
Scenario Target (${targetWalkawayRate}% Walkaway):
Potential Annual Opportunity Addressed: ${formatCurrency(results.annualOpportunityAddressed, currency)}
Potential Monthly Retained ${preset.visitorTerm}: ${results.monthlyCustomersRetained}
(Note: Scenario estimate based on user assumptions. Not a measured Qblink result.)`;
      (navigator.clipboard.writeText(A),
        setCopied(!0),
        vibrate(20),
        toast.success("Scenario summary copied to clipboard"),
        setTimeout(() => setCopied(!1), 3e3));
    };
  return (
    <section
      id="roi-calculator"
      className={`w-full max-w-6xl mx-auto ${className}`}
    >
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-10 card-shadow overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>{"Economic Scenario Estimator"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {"How Much Is Waiting Costing Your Business?"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            {
              "Waiting creates an opportunity cost when walk-in customers leave before being served. Adjust the assumptions below to estimate the potential value of improving customer flow."
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-border/60">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {(Object.keys(industryPresets) as Industry[]).map((A) => {
              const O = industryPresets[A],
                I = industry === A;
              return (
                  <button
                    onClick={() => selectIndustry(A)}
                    className={`px-3.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold whitespace-nowrap transition-all ${I ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    key={A}
                  >
                  {O.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs text-muted-foreground font-semibold">
              {"Currency:"}
            </span>
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border">
              {(["INR", "USD"] as Currency[]).map((A) => (
                <button
                  onClick={() => setCurrency(A)}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-colors ${currency === A ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                  key={A}
                >
                  {A === "INR" ? "₹ INR" : "$ USD"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {"1. Your Business Assumptions"}
              </h3>
              <button
                onClick={resetDefaults}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors min-h-[36px] px-2 py-1 rounded-lg"
              >
                <RotateCcw className="w-3 h-3" />
                {" Reset Defaults"}
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label
                  htmlFor="daily-visitors-input"
                  className="text-foreground"
                >
                  {preset.visitorTerm}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="daily-visitors-input"
                    type="number"
                    min="1"
                    max="5000"
                    value={dailyVisitors || ""}
                    onChange={(A) =>
                      setDailyVisitors(
                        Math.max(0, parseInt(A.target.value) || 0),
                      )
                    }
                    className="w-20 px-2.5 py-1 text-right font-mono font-bold text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-muted-foreground text-xs">
                    {"/ day"}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                aria-label={preset.visitorTerm}
                value={dailyVisitors}
                onChange={(A) => setDailyVisitors(parseInt(A.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{"10"}</span>
                <span>{"250"}</span>
                <span>{"500+"}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="avg-value-input" className="text-foreground">
                  {preset.valueTerm}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground font-mono">
                    {results.currencySymbol}
                  </span>
                  <input
                    id="avg-value-input"
                    type="number"
                    min="1"
                    max="50000"
                    value={avgCustomerValue || ""}
                    onChange={(A) =>
                      setAvgCustomerValue(
                        Math.max(0, parseInt(A.target.value) || 0),
                      )
                    }
                    className="w-24 px-2.5 py-1 text-right font-mono font-bold text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                aria-label={preset.valueTerm}
                value={avgCustomerValue}
                onChange={(A) => setAvgCustomerValue(parseInt(A.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {results.currencySymbol}
                  {"50"}
                </span>
                <span>
                  {results.currencySymbol}
                  {"1,500"}
                </span>
                <span>
                  {results.currencySymbol}
                  {"3,000+"}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="walkaway-slider" className="text-foreground">
                  {"Estimated Queue Walkaway Rate"}
                </label>
                <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {currentWalkawayRate}
                  {"%"}
                </span>
              </div>
              <input
                id="walkaway-slider"
                type="range"
                min="1"
                max="35"
                step="1"
                aria-label="Estimated Queue Walkaway Rate"
                value={currentWalkawayRate}
                onChange={(A) =>
                  setCurrentWalkawayRate(parseInt(A.target.value))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">
                {
                  "Estimated % of customers who walk away or abandon when seeing a congested physical queue."
                }
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label htmlFor="target-slider" className="text-foreground">
                  {"Scenario Target Walkaway Rate"}
                </label>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {targetWalkawayRate}
                  {"%"}
                </span>
              </div>
              <input
                id="target-slider"
                type="range"
                min="0"
                max={Math.max(1, currentWalkawayRate)}
                step="1"
                aria-label="Scenario Target Walkaway Rate"
                value={targetWalkawayRate}
                onChange={(A) =>
                  setTargetWalkawayRate(parseInt(A.target.value))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">
                {
                  "Target walkaway rate under an improved digital flow scenario (Reduction: -"
                }
                {results.rateReductionPercent}
                {"%)."}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold px-1">
              <label
                htmlFor="operating-days-select"
                className="text-muted-foreground"
              >
                {"Operating Days per Month"}
              </label>
              <select
                id="operating-days-select"
                aria-label="Operating Days per Month"
                value={operatingDays}
                onChange={(A) => setOperatingDays(parseInt(A.target.value))}
                className="px-3 py-1 rounded-lg bg-muted/60 border border-border text-foreground font-mono font-bold text-xs"
              >
                <option value={22}>{"22 days (Mon–Fri)"}</option>
                <option value={26}>{"26 days (6 days/wk)"}</option>
                <option value={28}>{"28 days"}</option>
                <option value={30}>{"30 days (Full month)"}</option>
              </select>
            </div>
          </div>
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {"2. Illustrative Scenario Results"}
            </h3>
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-primary/30 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    {"Illustrative Annual Revenue Exposure"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {"Assumed Cost"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  {"Estimated revenue tied to the assumed "}
                  {currentWalkawayRate}
                  {"% walkaway rate"}
                </p>
                <div className="my-2">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-mono font-black text-3xl sm:text-5xl text-white tracking-tight block"
                    key={results.annualRevenueExposure}
                  >
                    {formatCurrency(results.annualRevenueExposure, currency)}
                  </motion.span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {"per year (based on your inputs)"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-5 mt-5 border-t border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    {"Monthly Exposure"}
                  </span>
                  <span className="font-mono font-bold text-lg text-white">
                    {formatCurrency(results.monthlyRevenueExposure, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    {"Monthly Lost "}
                    {preset.visitorTerm}
                  </span>
                  <span className="font-mono font-bold text-lg text-white">
                    {"~"}
                    {results.monthlyLostCustomers}
                    {" guests"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-foreground space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {" Scenario Improvement ("}
                  {currentWalkawayRate}
                  {"% → "}
                  {targetWalkawayRate}
                  {"%)"}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                  {"-"}
                  {results.rateReductionPercent}
                  {"% Walkaway"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {"Potential Annual Opportunity"}
                  </span>
                  <span className="font-mono font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(
                      results.annualOpportunityAddressed,
                      currency,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    {"Potential Retained Guests"}
                  </span>
                  <span className="font-mono font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                    {"+"}
                    {results.monthlyCustomersRetained}
                    {" / mo"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {"Illustrative opportunity if queue visibility helps retain "}
                {results.rateReductionPercent}
                {"% more walk-in guests."}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2.5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>{"Illustrative Scenario Only:"}</strong>
                {
                  " This calculator converts user-entered assumptions into mathematical projections. It does not represent measured Qblink commercial results, guaranteed revenue recovery, or past pilot metrics."
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={copySummary}
                className="flex-1 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copied ? "Copied Scenario Summary" : "Copy Scenario Digest"}
                </span>
              </button>
              <Link
                to="/auth"
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all text-center"
              >
                <span>{"Start Free"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="w-full flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <CircleHelp className="w-4 h-4 text-primary" />
              {"How is this calculated? View mathematical formula"}
            </span>
            {showFormula ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {showFormula && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-xs text-muted-foreground space-y-3 pt-4"
              >
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 font-mono text-[11px] space-y-2">
                  <p className="text-foreground font-bold">
                    {"1. Daily Revenue Exposure:"}
                  </p>
                  <p className="pl-4 text-primary">
                    {"= Daily "}
                    {preset.visitorTerm}
                    {" ("}
                    {dailyVisitors}
                    {") × Avg. Ticket ("}
                    {results.currencySymbol}
                    {avgCustomerValue}
                    {") × Assumed Walkaway ("}
                    {currentWalkawayRate}
                    {"%)"}
                    <br />
                    {"= "}
                    {results.currencySymbol}
                    {(
                      dailyVisitors *
                      avgCustomerValue *
                      (currentWalkawayRate / 100)
                    ).toLocaleString()}
                    {" / day"}
                  </p>
                  <p className="text-foreground font-bold pt-1">
                    {"2. Annual Revenue Exposure:"}
                  </p>
                  <p className="pl-4 text-primary">
                    {"= Daily Exposure ("}
                    {results.currencySymbol}
                    {(
                      dailyVisitors *
                      avgCustomerValue *
                      (currentWalkawayRate / 100)
                    ).toLocaleString()}
                    {") × Operating Days ("}
                    {operatingDays}
                    {") × 12 months"}
                    <br />
                    {"= "}
                    {results.currencySymbol}
                    {results.annualRevenueExposure.toLocaleString()}
                    {" / year"}
                  </p>
                  <p className="text-foreground font-bold pt-1">
                    {"3. Scenario Opportunity Addressed ("}
                    {currentWalkawayRate}
                    {"% → "}
                    {targetWalkawayRate}
                    {"%):"}
                  </p>
                  <p className="pl-4 text-emerald-600 dark:text-emerald-400">
                    {"= Daily "}
                    {preset.visitorTerm}
                    {" ("}
                    {dailyVisitors}
                    {") × Avg. Ticket ("}
                    {results.currencySymbol}
                    {avgCustomerValue}
                    {") × Rate Reduction ("}
                    {results.rateReductionPercent}
                    {"%) × Operating Days ("}
                    {operatingDays}
                    {") × 12 months"}
                    <br />
                    {"= "}
                    {results.currencySymbol}
                    {results.annualOpportunityAddressed.toLocaleString()}
                    {" / year"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
export { RoiCalculator };
export default RoiCalculator;
