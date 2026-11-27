/**
 * Adaptive Recharts color palette bound to CSS custom properties (--chart-1..6).
 * Light and Dark values are calibrated in src/index.css for >= 3:1 graphical contrast.
 */
export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  positive: "hsl(var(--chart-3))",
  amber: "hsl(var(--chart-4))",
  slate: "hsl(var(--chart-5))",
  rose: "hsl(var(--chart-6))",
} as const;

export const CHART_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.positive,
  CHART_COLORS.amber,
  CHART_COLORS.slate,
  CHART_COLORS.rose,
] as const;
