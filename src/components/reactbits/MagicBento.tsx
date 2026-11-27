import React, {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useOptionalTheme } from "@/hooks/useTheme";

export interface MagicBentoCard {
  id?: string;
  title: string;
  value?: string | number;
  description?: string;
  label?: string;
  icon?: ReactNode;
  accent?: boolean;
  colSpan?: number;
  rowSpan?: number;
  onClick?: () => void;
  footer?: ReactNode;
}

export interface MagicBentoProps {
  cards?: MagicBentoCard[];
  children?: ReactNode;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  clickEffect?: boolean;
  glowColor?: string;
  className?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const DEFAULT_CARDS: MagicBentoCard[] = [
  {
    label: "Live Flow",
    title: "Real-Time Queue",
    value: "Active",
    description: "Instant browser tokens with zero hardware.",
  },
  {
    label: "Throughput",
    title: "Served Today",
    value: "148",
    description: "Steady counter cadence across peak hours.",
  },
  {
    label: "Latency",
    title: "Avg Wait",
    value: "6m",
    description: "Customers arrive right as their turn opens.",
  },
  {
    label: "Retention",
    title: "Completion Rate",
    value: "97%",
    description: "Proactive alerts prevent walk-aways.",
  },
];

interface BentoTileProps {
  card: MagicBentoCard;
  radius: number;
  rowHeight: number;
  enableBorderGlow: boolean;
  enableSpotlight: boolean;
  spotlightRadius: number;
  clickEffect: boolean;
  glowRgb: string;
  isDark: boolean;
}

const BentoTile: React.FC<BentoTileProps> = ({
  card,
  radius,
  rowHeight,
  enableBorderGlow,
  enableSpotlight,
  spotlightRadius,
  clickEffect,
  glowRgb,
  isDark,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const tileRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = tileRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPointer({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointer((prev) => ({ ...prev, active: false }));
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (clickEffect && !prefersReducedMotion && tileRef.current) {
        const rect = tileRef.current.getBoundingClientRect();
        const id = Date.now() + Math.random();
        setRipples((prev) => [
          ...prev.slice(-3),
          { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
        ]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 550);
      }
      card.onClick?.();
    },
    [clickEffect, prefersReducedMotion, card]
  );

  const baseBorder = isDark ? "rgba(81, 194, 194, 0.16)" : "rgba(16, 99, 127, 0.14)";
  const borderBackground =
    enableBorderGlow && pointer.active
      ? `radial-gradient(${Math.round(spotlightRadius * 0.8)}px circle at ${pointer.x}px ${pointer.y}px, rgba(${glowRgb}, ${
          isDark ? 0.72 : 0.55
        }), ${baseBorder} 68%)`
      : baseBorder;

  const spotlightBackground =
    enableSpotlight && pointer.active
      ? `radial-gradient(${spotlightRadius}px circle at ${pointer.x}px ${pointer.y}px, rgba(${glowRgb}, ${
          isDark ? 0.14 : 0.09
        }), transparent 65%)`
      : "none";

  const spanStyle: CSSProperties = {
    minHeight: `${rowHeight}px`,
    borderRadius: `${radius}px`,
    background: borderBackground,
    gridColumn: card.colSpan ? `span ${card.colSpan} / span ${card.colSpan}` : undefined,
    gridRow: card.rowSpan ? `span ${card.rowSpan} / span ${card.rowSpan}` : undefined,
  };

  return (
    <div
      ref={tileRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      role={card.onClick ? "button" : undefined}
      tabIndex={card.onClick ? 0 : undefined}
      onKeyDown={
        card.onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.onClick?.();
              }
            }
          : undefined
      }
      style={spanStyle}
      className={`relative min-w-0 p-[1.5px] transition-shadow duration-200 ${
        card.onClick ? "cursor-pointer" : ""
      }`}
    >
      <div
        style={{
          borderRadius: `${Math.max(0, radius - 1.5)}px`,
        }}
        className={`relative flex h-full min-w-0 flex-col justify-between overflow-hidden p-5 ${
          card.accent ? "bg-primary/10" : "bg-card"
        }`}
      >
        {enableSpotlight && (
          <div
            aria-hidden="true"
            style={{ background: spotlightBackground }}
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          />
        )}

        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              left: r.x,
              top: r.y,
              backgroundColor: `rgba(${glowRgb}, 0.25)`,
            }}
            className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
        ))}

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {card.label ?? card.title}
          </span>
          {card.icon && (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {card.icon}
            </span>
          )}
        </div>

        <div className="relative z-10 mt-3">
          {card.value !== undefined && (
            <div
              className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${
                card.accent ? "text-primary" : "text-foreground"
              }`}
            >
              {card.value}
            </div>
          )}
          {card.label && card.title && (
            <div className="mt-1 text-sm font-semibold text-foreground">{card.title}</div>
          )}
          {card.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {card.description}
            </p>
          )}
        </div>

        {card.footer && <div className="relative z-10 mt-3">{card.footer}</div>}
      </div>
    </div>
  );
};

export const MagicBento: React.FC<MagicBentoProps> = ({
  cards = DEFAULT_CARDS,
  children,
  columns = 4,
  rowHeight = 200,
  gap = 12,
  radius = 20,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = 300,
  clickEffect = true,
  glowColor,
  className = "",
}) => {
  const themeCtx = useOptionalTheme();
  const isDark = themeCtx?.theme === "dark";
  const glowRgb = glowColor ?? (isDark ? "81, 194, 194" : "16, 99, 127");

  const gridStyle: CSSProperties = {
    gap: `${gap}px`,
    gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
  };

  if (children) {
    return (
      <div
        style={gridStyle}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--mb-cols),minmax(0,1fr))] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={
        {
          gap: `${gap}px`,
          "--mb-cols": Math.max(1, columns),
        } as CSSProperties
      }
      className={`grid grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--mb-cols),minmax(0,1fr))] ${className}`}
    >
      {cards.map((card, index) => (
        <BentoTile
          key={card.id ?? `${card.title}-${index}`}
          card={card}
          radius={radius}
          rowHeight={rowHeight}
          enableBorderGlow={enableBorderGlow}
          enableSpotlight={enableSpotlight}
          spotlightRadius={spotlightRadius}
          clickEffect={clickEffect}
          glowRgb={glowRgb}
          isDark={isDark}
        />
      ))}
    </div>
  );
};

export default MagicBento;
