import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HslColor {
  h: number;
  s: number;
  l: number;
}

function parseHslTokens(blockCss: string): Record<string, HslColor> {
  const tokens: Record<string, HslColor> = {};
  const re = /--([a-z0-9-]+)\s*:\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*;/gi;
  for (const match of blockCss.matchAll(re)) {
    tokens[match[1]] = {
      h: parseFloat(match[2]),
      s: parseFloat(match[3]),
      l: parseFloat(match[4]),
    };
  }
  return tokens;
}

function extractCssBlock(css: string, selector: ":root" | ".dark"): string {
  const escaped = selector.replace(".", "\\.");
  const re = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n  \\}`, "m");
  const match = css.match(re);
  if (!match) {
    throw new Error(`Could not find ${selector} token block in src/index.css`);
  }
  return match[1];
}

function hslToRgb({ h, s, l }: HslColor): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return lNorm - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function relativeLuminance(color: HslColor): number {
  const [r, g, b] = hslToRgb(color).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: HslColor, b: HslColor): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function walkSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
    } else if (/\.(ts|tsx|css|html|json)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Design palette WCAG AA contrast & anti-slop regression guard", () => {
  const rootDir = path.resolve(__dirname, "../..");
  const indexCss = fs.readFileSync(path.join(rootDir, "src/index.css"), "utf8");
  const lightTokens = parseHslTokens(extractCssBlock(indexCss, ":root"));
  const darkTokens = parseHslTokens(extractCssBlock(indexCss, ".dark"));

  const textPairs: Array<[string, string, number]> = [
    ["foreground", "background", 4.5],
    ["card-foreground", "card", 4.5],
    ["popover-foreground", "popover", 4.5],
    ["primary", "background", 4.5],
    ["primary", "card", 4.5],
    ["primary-foreground", "primary", 4.5],
    ["secondary-foreground", "secondary", 4.5],
    ["muted-foreground", "background", 4.5],
    ["muted-foreground", "card", 4.5],
    ["muted-foreground", "muted", 4.5],
    ["accent-foreground", "accent", 4.5],
    ["destructive-foreground", "destructive", 4.5],
    ["destructive", "card", 4.5],
    ["success", "success-soft", 4.5],
    ["success-foreground", "success", 4.5],
    ["warning", "warning-soft", 4.5],
    ["warning-foreground", "warning", 4.5],
    ["danger", "danger-soft", 4.5],
    ["danger-foreground", "danger", 4.5],
    ["info", "info-soft", 4.5],
    ["info-foreground", "info", 4.5],
  ];

  it("ensures every Light theme (:root) text/surface pair meets >= 4.5:1 WCAG AA contrast", () => {
    for (const [fg, bg, minRatio] of textPairs) {
      expect(lightTokens[fg], `Missing light token --${fg}`).toBeDefined();
      expect(lightTokens[bg], `Missing light token --${bg}`).toBeDefined();
      const ratio = contrastRatio(lightTokens[fg], lightTokens[bg]);
      expect(ratio, `Light --${fg} on --${bg} contrast (${ratio.toFixed(2)}:1) < ${minRatio}:1`).toBeGreaterThanOrEqual(
        minRatio
      );
    }

    // Special inverse editorial card accent pair (.cream-surface in light theme)
    const inverseRatio = contrastRatio(lightTokens["ink-accent"], lightTokens["brand-navy"]);
    expect(inverseRatio, `Light --ink-accent on --brand-navy (${inverseRatio.toFixed(2)}:1) < 4.5:1`).toBeGreaterThanOrEqual(4.5);
  });

  it("ensures every Dark theme (.dark) text/surface pair meets >= 4.5:1 WCAG AA contrast", () => {
    for (const [fg, bg, minRatio] of textPairs) {
      expect(darkTokens[fg], `Missing dark token --${fg}`).toBeDefined();
      expect(darkTokens[bg], `Missing dark token --${bg}`).toBeDefined();
      const ratio = contrastRatio(darkTokens[fg], darkTokens[bg]);
      expect(ratio, `Dark --${fg} on --${bg} contrast (${ratio.toFixed(2)}:1) < ${minRatio}:1`).toBeGreaterThanOrEqual(
        minRatio
      );
    }

    // Special inverse cream-surface accent pair in dark theme
    const inverseRatio = contrastRatio(darkTokens["ink-accent"], darkTokens["cream"]);
    expect(inverseRatio, `Dark --ink-accent on --cream (${inverseRatio.toFixed(2)}:1) < 4.5:1`).toBeGreaterThanOrEqual(4.5);
  });

  it("ensures all --chart-1..6 tokens meet >= 3.0:1 graphical contrast on card surfaces in Light and Dark themes", () => {
    const chartKeys = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"];
    for (const key of chartKeys) {
      const lightRatio = contrastRatio(lightTokens[key], lightTokens["card"]);
      expect(lightRatio, `Light --${key} on --card (${lightRatio.toFixed(2)}:1) < 3.0:1`).toBeGreaterThanOrEqual(3.0);

      const darkRatio = contrastRatio(darkTokens[key], darkTokens["card"]);
      expect(darkRatio, `Dark --${key} on --card (${darkRatio.toFixed(2)}:1) < 3.0:1`).toBeGreaterThanOrEqual(3.0);
    }
  });

  it("forbids banned AI-slop hues, gradient classes, and glow backdrops across src/, index.html, and manifest.json", () => {
    const forbiddenPatterns: Array<{ name: string; re: RegExp }> = [
      { name: "Neon electric hex", re: /#0099ff|#2474f5|#0da2e7/i },
      { name: "Legacy gradient/glow CSS classes", re: /\b(?:gradient-bg|gradient-text|cta-glow|stage-grid)\b/ },
      {
        name: "AI backdrop animation classes",
        re: /\b(?:animate-glow-pulse|animate-glow-border|animate-pulse-halo|animate-radar-sweep|animate-kinetic-shimmer|animate-stage-sweep)\b/,
      },
      { name: "Off-brand purple/indigo/pink Tailwind classes", re: /\b(?:purple|indigo|pink)-\d{2,3}\b/ },
      { name: "Oversaturated legacy chart HSL", re: /hsl\((?:205\s+100%|185\s+100%|280\s+70%)/ },
      { name: "Large blur halo backdrop", re: /\bblur-(?:2xl|3xl)\b/ },
    ];

    const filesToScan = [
      ...walkSourceFiles(path.join(rootDir, "src")).filter(
        (filePath) => !filePath.endsWith(`${path.sep}paletteContrast.test.ts`)
      ),
      path.join(rootDir, "index.html"),
      path.join(rootDir, "public/manifest.json"),
    ];

    const violations: string[] = [];
    for (const filePath of filesToScan) {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const { name, re } of forbiddenPatterns) {
          if (re.test(line)) {
            const rel = path.relative(rootDir, filePath);
            violations.push(`${rel}:${idx + 1} [${name}]: ${line.trim()}`);
          }
        }
      });
    }

    expect(violations, `Found AI-slop color/backdrop violations:\n${violations.join("\n")}`).toEqual([]);
  });
});
