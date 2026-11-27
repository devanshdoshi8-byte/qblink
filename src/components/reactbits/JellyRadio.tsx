import React, {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

export type JellyRadioSize = "sm" | "md" | "lg";

export interface JellyRadioItem {
  value: string;
  label?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface JellyRadioProps {
  items: Array<string | JellyRadioItem>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  ariaLabel?: string;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: JellyRadioSize;
  gap?: number;
  radius?: number;
  swell?: number;
  barge?: number;
  shrink?: number;
  jelly?: number;
  bounce?: number;
  stagger?: number;
  stiffness?: number;
  disabled?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<JellyRadioSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2.5",
};

function normalizeItems(items: Array<string | JellyRadioItem>): JellyRadioItem[] {
  return items.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item
  );
}

export const JellyRadio: React.FC<JellyRadioProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  ariaLabel = "Radio options",
  chipColor = "hsl(var(--card))",
  activeColor = "hsl(var(--primary))",
  textColor = "hsl(var(--foreground))",
  activeTextColor = "hsl(var(--primary-foreground))",
  size = "md",
  gap = 8,
  radius = 18,
  swell = 0.2,
  barge = 6,
  shrink = 0.05,
  jelly = 1,
  bounce = 0.25,
  stagger = 22,
  stiffness = 580,
  disabled = false,
  className = "",
}) => {
  const prefersReducedMotion = useReducedMotion();
  const normalized = useMemo(() => normalizeItems(items), [items]);
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue ?? normalized.find((item) => !item.disabled)?.value
  );
  const currentValue = isControlled ? value : internalValue;
  const activeIndex = useMemo(
    () => normalized.findIndex((item) => item.value === currentValue),
    [normalized, currentValue]
  );

  const [pulseKey, setPulseKey] = useState(0);

  const selectIndex = useCallback(
    (idx: number) => {
      const target = normalized[idx];
      if (!target || target.disabled || disabled) return;
      if (!isControlled) {
        setInternalValue(target.value);
      }
      setPulseKey((prev) => prev + 1);
      onChange?.(target.value, idx);
    },
    [normalized, disabled, isControlled, onChange]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || normalized.length === 0) return;
    let step: 1 | -1 | 0 = 0;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") step = 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") step = -1;

    if (step !== 0) {
      event.preventDefault();
      let next = activeIndex >= 0 ? activeIndex : 0;
      for (let i = 0; i < normalized.length; i++) {
        next = (next + step + normalized.length) % normalized.length;
        if (!normalized[next]?.disabled) {
          selectIndex(next);
          return;
        }
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      const first = normalized.findIndex((item) => !item.disabled);
      if (first >= 0) selectIndex(first);
    } else if (event.key === "End") {
      event.preventDefault();
      for (let i = normalized.length - 1; i >= 0; i--) {
        if (!normalized[i]?.disabled) {
          selectIndex(i);
          break;
        }
      }
    }
  };

  const containerStyle: CSSProperties = {
    gap: `${gap}px`,
  };

  const damping = Math.max(8, Math.round(2 * Math.sqrt(stiffness) * (1 - bounce * 0.85)));

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={containerStyle}
      className={`inline-flex flex-wrap items-center select-none ${className}`}
    >
      {normalized.map((item, index) => {
        const isActive = index === activeIndex;
        const isDisabled = disabled || Boolean(item.disabled);
        const distance = activeIndex >= 0 ? index - activeIndex : 0;
        const absDistance = Math.abs(distance);

        const bargeOffset =
          prefersReducedMotion || isActive || activeIndex < 0
            ? 0
            : Math.sign(distance) * (barge / Math.max(1, absDistance));

        const targetScaleX = prefersReducedMotion
          ? 1
          : isActive
            ? 1 + swell * 0.12 * jelly
            : 1 - shrink * 0.5;
        const targetScaleY = prefersReducedMotion
          ? 1
          : isActive
            ? 1 + swell * 0.08 * jelly
            : 1 - shrink * 0.5;

        const delaySeconds = prefersReducedMotion ? 0 : (absDistance * stagger) / 1000;

        const chipStyle: CSSProperties = {
          backgroundColor: isActive ? activeColor : chipColor,
          color: isActive ? activeTextColor : textColor,
          borderRadius: `${radius}px`,
        };

        return (
          <motion.button
            key={`${item.value}-${isActive ? pulseKey : "idle"}`}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            tabIndex={isActive || (activeIndex < 0 && index === 0) ? 0 : -1}
            onClick={() => selectIndex(index)}
            initial={
              prefersReducedMotion || !isActive
                ? false
                : {
                    scaleX: 1 + swell * 0.25 * jelly,
                    scaleY: 1 - swell * 0.14 * jelly,
                  }
            }
            animate={{
              x: bargeOffset,
              scaleX: targetScaleX,
              scaleY: targetScaleY,
            }}
            whileTap={
              prefersReducedMotion || isDisabled
                ? undefined
                : {
                    scaleX: 1 + 0.06 * jelly,
                    scaleY: 1 - 0.06 * jelly,
                  }
            }
            transition={{
              type: "spring",
              stiffness,
              damping,
              mass: 0.9,
              delay: delaySeconds,
            }}
            style={chipStyle}
            className={`inline-flex items-center justify-center border border-border/60 font-medium shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${SIZE_CLASSES[size]}`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label ?? item.value}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default JellyRadio;
