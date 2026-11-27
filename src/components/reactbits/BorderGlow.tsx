import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react';

interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
  surfaceTheme?: 'light' | 'dark';
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildBoxShadow(glowColor: string, intensity: number): string {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const layers: [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true], [0, 0, 1, 0, 60, true], [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true], [0, 0, 15, 0, 30, true], [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false], [0, 0, 3, 0, 50, false], [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false], [0, 0, 25, 2, 20, false], [0, 0, 50, 2, 10, false],
  ];
  return layers.map(([x, y, blur, spread, alpha, inset]) => {
    const a = Math.min(alpha * intensity, 100);
    return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
  }).join(', ');
}

function easeOutCubic(x: number) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x: number) { return x * x * x; }

interface AnimateOpts {
  start?: number; end?: number; duration?: number; delay?: number;
  ease?: (t: number) => number; onUpdate: (v: number) => void; onEnd?: () => void;
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }: AnimateOpts) {
  const t0 = performance.now() + delay;
  let frame = 0;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }
  const timer = setTimeout(() => {
    frame = requestAnimationFrame(tick);
  }, delay);
  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildMeshGradients(colors: string[]): string[] {
  const gradients: string[] = [];
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    gradients.push(`radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`);
  }
  gradients.push(`linear-gradient(${colors[0]} 0 100%)`);
  return gradients;
}

function isLightColor(color: string): boolean {
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
  const hex = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '180 48 54',
  backgroundColor = '#0e1e34',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = ['#51c2c2', '#10637f', '#f4f2eb'],
  fillOpacity = 0.5,
  surfaceTheme,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorAngle, setCursorAngle] = useState(45);
  const [edgeProximity, setEdgeProximity] = useState(0);
  const [sweepActive, setSweepActive] = useState(false);

  const getCenterOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenterOfElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEdgeProximity(getEdgeProximity(card, x, y));
    setCursorAngle(getCursorAngle(card, x, y));
  }, [getEdgeProximity, getCursorAngle]);

  useEffect(() => {
    if (!animated) return;
    const angleStart = 110;
    const angleEnd = 465;
    setSweepActive(true);
    setCursorAngle(angleStart);

    const animations = [
      animateValue({ duration: 500, onUpdate: v => setEdgeProximity(v / 100) }),
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart);
      }}),
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart);
      }}),
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => setEdgeProximity(v / 100),
        onEnd: () => setSweepActive(false),
      }),
    ];

    return () => {
      animations.forEach(cancel => cancel());
      setSweepActive(false);
    };
  }, [animated]);

  const isVisible = isHovered || sweepActive;
  const glowOpacity = isVisible
    ? Math.max(0.25, Math.min(1, edgeProximity * 1.15)) * Math.min(1, glowIntensity)
    : 0;

  const angleDeg = `${cursorAngle.toFixed(2)}deg`;
  const lightSurface = surfaceTheme ? surfaceTheme === 'light' : isLightColor(backgroundColor);
  const { h, s, l } = parseHSL(glowColor);
  const baseBorderColor = lightSurface ? 'rgb(24 24 27 / 12%)' : 'rgb(255 255 255 / 15%)';
  const primaryGlow = colors[0] || '#51c2c2';
  const secondaryGlow = colors[1] || primaryGlow;
  const tertiaryGlow = colors[2] || primaryGlow;
  const spreadDeg = Math.max(30, coneSpread * 3);

  const conicBorder = `conic-gradient(from ${angleDeg} at 50% 50%, transparent 0deg, ${primaryGlow} ${Math.round(spreadDeg * 0.35)}deg, ${secondaryGlow} ${Math.round(spreadDeg * 0.7)}deg, ${tertiaryGlow} ${spreadDeg}deg, transparent ${Math.round(spreadDeg * 1.4)}deg)`;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={`relative grid min-w-0 p-[1.5px] transition-shadow duration-300 ${className}`}
      style={{
        background: isVisible ? conicBorder : baseBorderColor,
        borderRadius: `${borderRadius}px`,
        boxShadow: isVisible
          ? `0 0 ${Math.round(glowRadius * 0.7)}px -8px hsl(${h} ${s}% ${l}% / ${Math.round(glowOpacity * 45)}%), ${
              lightSurface
                ? 'rgb(24 24 27 / 6%) 0 4px 16px'
                : '0 12px 32px -12px rgba(0, 0, 0, 0.55)'
            }`
          : lightSurface
          ? 'rgb(24 24 27 / 4%) 0 1px 2px, rgb(24 24 27 / 5%) 0 8px 24px'
          : '0 10px 30px -12px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        className="flex flex-col relative z-[1] h-full min-w-0 overflow-hidden"
        style={{
          background: backgroundColor,
          borderRadius: `${Math.max(0, borderRadius - 1.5)}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
