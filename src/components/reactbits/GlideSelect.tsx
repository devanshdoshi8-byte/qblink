import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export type GlideSelectSize = "sm" | "md" | "lg";
export type GlideSelectPlacement = "bottom" | "top";
export type GlideSelectAlign = "left" | "right";

export interface GlideSelectOption {
  value: string;
  label: string;
  tag?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface GlideSelectProps {
  options: GlideSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: GlideSelectOption) => void;
  placeholder?: string;
  ariaLabel?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: GlideSelectSize;
  radius?: number;
  menuWidth?: number | string;
  placement?: GlideSelectPlacement;
  align?: GlideSelectAlign;
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<
  GlideSelectSize,
  { trigger: string; item: string; tag: string; icon: number }
> = {
  sm: {
    trigger: "h-8 px-2.5 text-xs gap-1.5",
    item: "px-2.5 py-1.5 text-xs gap-2",
    tag: "text-[10px] px-1.5 py-0.5",
    icon: 13,
  },
  md: {
    trigger: "h-10 px-3.5 text-sm gap-2",
    item: "px-3 py-2 text-sm gap-2.5",
    tag: "text-[11px] px-1.5 py-0.5",
    icon: 15,
  },
  lg: {
    trigger: "h-12 px-4 text-base gap-2.5",
    item: "px-3.5 py-2.5 text-base gap-3",
    tag: "text-xs px-2 py-0.5",
    icon: 17,
  },
};

export const GlideSelect: React.FC<GlideSelectProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select...",
  ariaLabel,
  showTags = false,
  accentColor = "hsl(var(--primary))",
  surfaceColor = "hsl(var(--card))",
  highlightColor = "hsl(var(--muted))",
  textColor = "hsl(var(--foreground))",
  size = "md",
  radius = 10,
  menuWidth = 176,
  placement = "bottom",
  align = "left",
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  className = "",
}) => {
  const prefersReducedMotion = useReducedMotion();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue ?? options.find((o) => !o.disabled)?.value
  );
  const currentValue = isControlled ? value : internalValue;

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === currentValue),
    [options, currentValue]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabledIndex = useMemo(
    () => options.findIndex((o) => !o.disabled),
    [options]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    selectedIndex >= 0 ? selectedIndex : Math.max(0, firstEnabledIndex)
  );
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    height: number;
    visible: boolean;
  }>({ top: 0, height: 0, visible: false });

  const sizeConfig = SIZE_STYLES[size];
  const popSeconds = prefersReducedMotion ? 0 : Math.max(0.05, popDuration / 1000);
  const glideSeconds = prefersReducedMotion ? 0 : Math.max(0.05, glideDuration / 1000);

  const updateHighlightRect = useCallback((idx: number) => {
    const el = itemRefs.current[idx];
    if (!el) {
      setHighlightRect((prev) => ({ ...prev, visible: false }));
      return;
    }
    setHighlightRect({
      top: el.offsetTop,
      height: el.offsetHeight || 34,
      visible: true,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateHighlightRect(activeIndex);
  }, [isOpen, activeIndex, options, updateHighlightRect]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const openMenu = useCallback(() => {
    if (disabled || options.length === 0) return;
    const startIdx =
      rememberPosition && selectedIndex >= 0 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : Math.max(0, firstEnabledIndex);
    setActiveIndex(startIdx);
    setIsOpen(true);
  }, [disabled, options, rememberPosition, selectedIndex, firstEnabledIndex]);

  const selectOption = useCallback(
    (option: GlideSelectOption) => {
      if (option.disabled) return;
      if (!isControlled) {
        setInternalValue(option.value);
      }
      onChange?.(option.value, option);
      setIsOpen(false);
    },
    [isControlled, onChange]
  );

  const moveActive = useCallback(
    (step: 1 | -1) => {
      if (options.length === 0) return;
      let next = activeIndex;
      for (let i = 0; i < options.length; i++) {
        next = (next + step + options.length) % options.length;
        if (!options[next]?.disabled) {
          setActiveIndex(next);
          return;
        }
      }
    },
    [activeIndex, options]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    switch (event.key) {
      case "Enter":
      case " ": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          const opt = options[activeIndex];
          if (opt) selectOption(opt);
        }
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          moveActive(1);
        }
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          moveActive(-1);
        }
        break;
      }
      case "Home": {
        if (!isOpen) return;
        event.preventDefault();
        if (firstEnabledIndex >= 0) setActiveIndex(firstEnabledIndex);
        break;
      }
      case "End": {
        if (!isOpen) return;
        event.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i]?.disabled) {
            setActiveIndex(i);
            break;
          }
        }
        break;
      }
      case "Escape": {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        break;
      }
    }
  };

  const triggerStyle: CSSProperties = {
    backgroundColor: surfaceColor,
    color: textColor,
    borderRadius: `${radius}px`,
  };

  const menuStyle: CSSProperties = {
    backgroundColor: surfaceColor,
    color: textColor,
    borderRadius: `${radius}px`,
    width: typeof menuWidth === "number" ? `${menuWidth}px` : menuWidth,
  };

  const placementClass =
    placement === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top";
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block text-left select-none ${className}`}
    >
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        style={triggerStyle}
        className={`inline-flex w-full items-center justify-between border border-border/70 font-medium shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${sizeConfig.trigger}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 opacity-85">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={sizeConfig.icon}
          className={`shrink-0 opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <motion.div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.96, y: placement === "top" ? 4 : -4 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: popSeconds, ease: [0.22, 1, 0.36, 1] }}
          style={menuStyle}
          className={`absolute z-50 border border-border/70 p-1.5 shadow-xl ${placementClass} ${alignClass}`}
        >
          <div className="relative flex flex-col">
            {highlightRect.visible && (
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={{
                  y: highlightRect.top,
                  height: highlightRect.height,
                }}
                transition={{ duration: glideSeconds, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  backgroundColor: highlightColor,
                  borderRadius: `${Math.max(4, radius - 3)}px`,
                }}
                className="pointer-events-none absolute inset-x-0 top-0"
              />
            )}

            {options.map((option, index) => {
              const isSelected = option.value === currentValue;
              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) setActiveIndex(index);
                  }}
                  onClick={() => selectOption(option)}
                  className={`relative z-10 flex w-full items-center justify-between text-left font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${sizeConfig.item}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {option.icon && (
                      <span className="shrink-0 opacity-85">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    {showTags && option.tag && (
                      <span
                        className={`rounded-md border border-current/15 opacity-65 ${sizeConfig.tag}`}
                      >
                        {option.tag}
                      </span>
                    )}
                    {isSelected && (
                      <Check
                        size={sizeConfig.icon - 1}
                        style={{ color: accentColor }}
                        className="shrink-0"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GlideSelect;
