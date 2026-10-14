import { FREE_THEME, THEMES, getTheme } from "./themes";

export const SECTIONS = ["header", "stats", "streak", "heatmap", "languages", "repos", "activity"] as const;
export type Section = (typeof SECTIONS)[number];

export interface WidgetOptions {
  theme: string;
  layout: "wide" | "compact";
  sections: Section[];
  repoCount: number;
  repoSource: "pinned" | "stars";
  /** 6-digit hex without '#'. Pro only. */
  accent?: string;
  radius: number;
  transparent: boolean;
  hideBranding: boolean;
  /** License key. Unlocks Pro options when valid. */
  key?: string;
}

export const DEFAULT_OPTIONS: WidgetOptions = {
  theme: "midnight",
  layout: "wide",
  sections: ["header", "stats", "streak", "heatmap", "languages", "repos"],
  repoCount: 4,
  repoSource: "pinned",
  radius: 14,
  transparent: false,
  hideBranding: false,
};

type Input = URLSearchParams | Record<string, string | string[] | undefined>;

function read(input: Input, name: string): string | undefined {
  if (input instanceof URLSearchParams) return input.get(name) ?? undefined;
  const v = input[name];
  return Array.isArray(v) ? v[0] : v;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Parses untrusted query params into a safe options object. */
export function parseOptions(input: Input): WidgetOptions {
  const o: WidgetOptions = { ...DEFAULT_OPTIONS, sections: [...DEFAULT_OPTIONS.sections] };

  const t = read(input, "t");
  if (t && THEMES.some((x) => x.id === t)) o.theme = t;

  const l = read(input, "l");
  if (l === "wide" || l === "compact") o.layout = l;

  const s = read(input, "s");
  if (s !== undefined) {
    const wanted = s.split(",").map((x) => x.trim());
    o.sections = SECTIONS.filter((x) => wanted.includes(x));
  }

  const r = Number(read(input, "r"));
  if (Number.isFinite(r) && r > 0) o.repoCount = clamp(Math.round(r), 1, 6);

  const src = read(input, "src");
  if (src === "pinned" || src === "stars") o.repoSource = src;

  const a = read(input, "a");
  if (a && /^[0-9a-f]{6}$/i.test(a)) o.accent = a.toLowerCase();

  const rad = read(input, "rad");
  if (rad !== undefined && rad !== "" && Number.isFinite(Number(rad))) o.radius = clamp(Math.round(Number(rad)), 0, 32);

  o.transparent = read(input, "bg") === "transparent";
  o.hideBranding = read(input, "nb") === "1";

  const k = read(input, "k");
  if (k && /^gp_[a-f0-9]{24}$/.test(k)) o.key = k;

  return o;
}

/** Serializes options into the shortest query string, omitting defaults. */
export function toQuery(o: Partial<WidgetOptions>): string {
  const p = new URLSearchParams();
  const d = DEFAULT_OPTIONS;
  if (o.theme && o.theme !== d.theme) p.set("t", o.theme);
  if (o.layout && o.layout !== d.layout) p.set("l", o.layout);
  if (o.sections && o.sections.join() !== d.sections.join()) p.set("s", o.sections.join(","));
  if (o.repoCount && o.repoCount !== d.repoCount) p.set("r", String(o.repoCount));
  if (o.repoSource && o.repoSource !== d.repoSource) p.set("src", o.repoSource);
  if (o.accent) p.set("a", o.accent);
  if (o.radius !== undefined && o.radius !== d.radius) p.set("rad", String(o.radius));
  if (o.transparent) p.set("bg", "transparent");
  if (o.hideBranding) p.set("nb", "1");
  if (o.key) p.set("k", o.key);
  return p.toString();
}

/** Removes anything the plan does not cover. Free viewers get the free theme and the GitPulse badge. */
export function enforcePlan(o: WidgetOptions, pro: boolean): WidgetOptions {
  if (pro) return o;
  const theme = getTheme(o.theme);
  return {
    ...o,
    theme: theme.pro ? FREE_THEME : o.theme,
    accent: undefined,
    hideBranding: false,
  };
}

export function usesProFeatures(o: WidgetOptions): boolean {
  return getTheme(o.theme).pro || !!o.accent || o.hideBranding;
}
