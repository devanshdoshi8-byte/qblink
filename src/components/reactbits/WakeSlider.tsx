import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useReducedMotion } from "framer-motion";

export interface WakeSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  bars?: number;
  height?: number;
  restHeight?: number;
  gap?: number;
  fillColor?: string;
  trackColor?: string;
  sensitivity?: number;
  reach?: number;
  skew?: number;
  glide?: number;
  smoothing?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: number) => void;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function snapToStep(raw: number, min: number, max: number, step: number): number {
  const safeStep = step > 0 ? step : 1;
  const snapped = Math.round((raw - min) / safeStep) * safeStep + min;
  const precision = (safeStep.toString().split(".")[1] || "").length;
  return clamp(Number(snapped.toFixed(precision)), min, max);
}

export const WakeSlider: React.FC<WakeSliderProps> = ({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  bars = 32,
  height = 56,
  restHeight = 12,
  gap = 4,
  fillColor = "hsl(var(--primary))",
  trackColor = "hsl(var(--muted))",
  sensitivity = 1,
  reach = 6,
  skew = 0.6,
  glide = 0.3,
  smoothing = 100,
  showValue = false,
  formatValue,
  ariaLabel = "Slider",
  disabled = false,
  className = "",
  onChange,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number>(() =>
    snapToStep(defaultValue, min, max, step)
  );
  const currentValue = isControlled
    ? snapToStep(value, min, max, step)
    : internalValue;

  const [isDragging, setIsDragging] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const ratio = max > min ? (currentValue - min) / (max - min) : 0;
  const clampedRatio = clamp(ratio, 0, 1);

  const commitValue = useCallback(
    (nextRaw: number) => {
      if (disabled) return;
      const next = snapToStep(nextRaw, min, max, step);
      if (!isControlled) {
        setInternalValue(next);
      }
      onChange?.(next);
    },
    [disabled, min, max, step, isControlled, onChange]
  );

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const nextRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
      setHoverRatio(nextRatio);
      commitValue(min + nextRatio * (max - min));
    },
    [min, max, commitValue]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      setHoverRatio(clamp((e.clientX - rect.left) / rect.width, 0, 1));
    }
    if (isDragging) {
      updateFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const fineStep = step > 0 ? step : 1;
    const coarseStep = Math.max(fineStep, (max - min) / 10);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        commitValue(currentValue + fineStep);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        commitValue(currentValue - fineStep);
        break;
      case "PageUp":
        e.preventDefault();
        commitValue(currentValue + coarseStep);
        break;
      case "PageDown":
        e.preventDefault();
        commitValue(currentValue - coarseStep);
        break;
      case "Home":
        e.preventDefault();
        commitValue(min);
        break;
      case "End":
        e.preventDefault();
        commitValue(max);
        break;
    }
  };

  const barCount = Math.max(4, Math.round(bars));
  const focalIndex = (hoverRatio ?? clampedRatio) * (barCount - 1);
  const activeCount = clampedRatio * barCount;
  const transitionMs = prefersReducedMotion
    ? 0
    : Math.max(40, Math.round(smoothing * (0.5 + glide)));

  const barList = useMemo(() => {
    return Array.from({ length: barCount }, (_, idx) => {
      const dist = Math.abs(idx - focalIndex);
      const directionalBoost = idx < focalIndex ? 1 + skew * 0.25 : 1;
      const influence =
        hoverRatio !== null || isDragging
          ? Math.max(0, 1 - dist / Math.max(1, reach)) * sensitivity * directionalBoost
          : Math.max(0, 1 - Math.abs(idx - clampedRatio * (barCount - 1)) / Math.max(1, reach * 0.7)) *
            0.45 *
            sensitivity;

      const barHeight = clamp(
        restHeight + (height - restHeight) * Math.min(1, influence),
        Math.min(restHeight, height),
        height
      );
      const isFilled = idx + 0.5 <= activeCount;
      return { idx, barHeight, isFilled };
    });
  }, [
    barCount,
    focalIndex,
    skew,
    hoverRatio,
    isDragging,
    reach,
    sensitivity,
    clampedRatio,
    restHeight,
    height,
    activeCount,
  ]);

  const containerStyle: CSSProperties = {
    height: `${height}px`,
    gap: `${gap}px`,
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setHoverRatio(null);
          setIsDragging(false);
        }}
        onKeyDown={handleKeyDown}
        style={containerStyle}
        className="relative flex flex-1 cursor-pointer items-center touch-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        {barList.map(({ idx, barHeight, isFilled }) => (
          <span
            key={idx}
            aria-hidden="true"
            style={{
              height: `${Math.round(barHeight)}px`,
              backgroundColor: isFilled ? fillColor : trackColor,
              transition: `height ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), background-color 120ms ease`,
            }}
            className="flex-1 rounded-full"
          />
        ))}
      </div>

      {showValue && (
        <span className="min-w-[3ch] text-right font-mono text-xs font-semibold tabular-nums text-foreground">
          {formatValue ? formatValue(currentValue) : currentValue}
        </span>
      )}
    </div>
  );
};

export default WakeSlider;
