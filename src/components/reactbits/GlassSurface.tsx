import React, {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B" | "A";
  yChannel?: "R" | "G" | "B" | "A";
  shape?: string;
  backdrop?: RefObject<HTMLElement | null>;
  className?: string;
  style?: CSSProperties;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  shape,
  backdrop,
  className = "",
  style,
}) => {
  const rawId = useId();
  const filterId = `glass-surface-${rawId.replace(/:/g, "")}`;
  const [backdropSrc, setBackdropSrc] = useState<string | null>(null);

  useEffect(() => {
    const el = backdrop?.current;
    if (!el) {
      setBackdropSrc(null);
      return;
    }
    if (el instanceof HTMLImageElement && el.src) {
      setBackdropSrc(el.currentSrc || el.src);
    } else {
      setBackdropSrc(null);
    }
  }, [backdrop]);

  const resolvedWidth = typeof width === "number" ? `${width}px` : width;
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  const containerStyle: CSSProperties = {
    width: resolvedWidth,
    height: resolvedHeight,
    borderRadius: shape ? undefined : `${borderRadius}px`,
    backgroundColor: `rgba(255, 255, 255, ${Math.min(1, Math.max(0, backgroundOpacity))})`,
    backdropFilter: `blur(${blur}px) saturate(${saturation}) brightness(${brightness / 50})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}) brightness(${brightness / 50})`,
    opacity,
    boxShadow:
      "inset 0 1px 0 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 0 rgba(255, 255, 255, 0.12), 0 8px 32px rgba(0, 0, 0, 0.18)",
    ...(shape
      ? {
          maskImage: `url(${shape})`,
          WebkitMaskImage: `url(${shape})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }
      : {}),
    ...style,
  };

  const displacementScale = Math.abs(distortionScale) * 0.08 + displace * 10;

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden border border-white/25 ${className}`}
      style={containerStyle}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0"
        width="0"
        height="0"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementScale}
              xChannelSelector={xChannel}
              yChannelSelector={yChannel}
              result="displaced"
            />
            <feColorMatrix
              in="displaced"
              type="matrix"
              values={`1 0 0 0 ${redOffset * 0.001} 0 1 0 0 ${greenOffset * 0.001} 0 0 1 0 ${blueOffset * 0.001} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      {backdropSrc && (
        <img
          src={backdropSrc}
          alt=""
          aria-hidden="true"
          style={{
            filter: `url(#${filterId}) blur(${Math.max(2, blur * 0.6)}px)`,
          }}
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-55"
        />
      )}

      <span
        aria-hidden="true"
        style={{
          borderRadius: shape ? undefined : `${borderRadius}px`,
          borderWidth: `${Math.max(1, Math.round(borderWidth * 16))}px`,
        }}
        className="pointer-events-none absolute inset-0 border border-white/20"
      />

      {children !== undefined && (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default GlassSurface;
