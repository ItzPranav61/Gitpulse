import type { CSSProperties } from "react";

export interface Theme {
  id: string;
  name: string;
  pro: boolean;
  /** Surface behind the card when the widget is shown standalone. */
  page: string;
  bg: string;
  fg: string;
  muted: string;
  border: string;
  accent: string;
  /** Used for the streak flame and highlights. */
  hot: string;
  /** Empty cell first, most active last. */
  heat: [string, string, string, string, string];
}

export const THEMES: Theme[] = [
  // ---------- free ----------
  {
    id: "midnight", name: "Midnight", pro: false,
    page: "#0b0f14", bg: "#0d1117", fg: "#e6edf3", muted: "#8b949e", border: "#30363d",
    accent: "#58a6ff", hot: "#ff9f43",
    heat: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  {
    id: "paper", name: "Paper", pro: false,
    page: "#eef0f4", bg: "#ffffff", fg: "#1f2328", muted: "#656d76", border: "#d0d7de",
    accent: "#0969da", hot: "#e8590c",
    heat: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  },
  {
    id: "terminal", name: "Terminal", pro: false,
    page: "#050805", bg: "#0a0f0a", fg: "#c8f7c8", muted: "#6fa36f", border: "#1d3a1d",
    accent: "#4ade80", hot: "#facc15",
    heat: ["#0f1a0f", "#12401a", "#16692a", "#1fa13d", "#4ade80"],
  },
  // ---------- pro ----------
  {
    id: "dracula", name: "Dracula", pro: true,
    page: "#1e1f29", bg: "#282a36", fg: "#f8f8f2", muted: "#9aa0c0", border: "#44475a",
    accent: "#bd93f9", hot: "#ffb86c",
    heat: ["#343746", "#4b3a73", "#7554b0", "#a06de0", "#d6a6ff"],
  },
  {
    id: "nord", name: "Nord", pro: true,
    page: "#242933", bg: "#2e3440", fg: "#eceff4", muted: "#9aa5b8", border: "#434c5e",
    accent: "#88c0d0", hot: "#ebcb8b",
    heat: ["#3b4252", "#3d5a6b", "#4f819a", "#6aa6bd", "#8fd3e8"],
  },
  {
    id: "solar", name: "Solar", pro: true,
    page: "#00212b", bg: "#002b36", fg: "#eee8d5", muted: "#93a1a1", border: "#0f4654",
    accent: "#b58900", hot: "#cb4b16",
    heat: ["#073642", "#5c4a00", "#8f7200", "#c29a00", "#f2c200"],
  },
  {
    id: "sunset", name: "Sunset", pro: true,
    page: "#1a0f1e", bg: "#241328", fg: "#ffeedd", muted: "#c9a2b8", border: "#4a2a4f",
    accent: "#ff6b9d", hot: "#ffd166",
    heat: ["#331a38", "#6b2350", "#a12f5f", "#e04877", "#ff8fab"],
  },
  {
    id: "aurora", name: "Aurora", pro: true,
    page: "#06141a", bg: "#0a1e26", fg: "#e2fbff", muted: "#7fb6c4", border: "#17414f",
    accent: "#2dd4bf", hot: "#a78bfa",
    heat: ["#10303b", "#0f4f5e", "#12808a", "#22b8a6", "#6ee7c8"],
  },
  {
    id: "rose", name: "Rosé", pro: true,
    page: "#f6e9e6", bg: "#fff7f5", fg: "#3b2a2f", muted: "#8f6d75", border: "#ecd2cf",
    accent: "#d6336c", hot: "#f08c00",
    heat: ["#f5e1de", "#f7b6c8", "#ee82a4", "#d6336c", "#9c1f4d"],
  },
  {
    id: "mono", name: "Mono", pro: true,
    page: "#e9e9e9", bg: "#fafafa", fg: "#111111", muted: "#6b6b6b", border: "#d4d4d4",
    accent: "#111111", hot: "#111111",
    heat: ["#ececec", "#c2c2c2", "#8c8c8c", "#555555", "#111111"],
  },
];

export const FREE_THEME = "midnight";

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Builds the theme, optionally recoloring the heatmap around a custom accent (Pro). */
export function resolveTheme(id: string, accent?: string): Theme {
  const base = getTheme(id);
  if (!accent) return base;
  const a = `#${accent}`;
  const empty = base.heat[0];
  return {
    ...base,
    accent: a,
    heat: [empty, mix(empty, a, 0.3), mix(empty, a, 0.55), mix(empty, a, 0.8), a],
  };
}

export function themeVars(theme: Theme, radius: number): CSSProperties {
  return {
    "--gp-bg": theme.bg,
    "--gp-fg": theme.fg,
    "--gp-muted": theme.muted,
    "--gp-border": theme.border,
    "--gp-accent": theme.accent,
    "--gp-hot": theme.hot,
    "--gp-page": theme.page,
    "--gp-radius": `${radius}px`,
    "--gp-h0": theme.heat[0],
    "--gp-h1": theme.heat[1],
    "--gp-h2": theme.heat[2],
    "--gp-h3": theme.heat[3],
    "--gp-h4": theme.heat[4],
  } as CSSProperties;
}
