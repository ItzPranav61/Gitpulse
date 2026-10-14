"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Widget } from "@/components/Widget";
import { SITE } from "@/lib/config";
import { DEFAULT_OPTIONS, SECTIONS, toQuery, usesProFeatures, type Section, type WidgetOptions } from "@/lib/options";
import { THEMES, resolveTheme } from "@/lib/themes";
import type { ActivityData } from "@/lib/types";

const SECTION_LABELS: Record<Section, string> = {
  header: "Profile header",
  stats: "Stats",
  streak: "Streak",
  heatmap: "Contribution graph",
  languages: "Languages",
  repos: "Projects",
  activity: "Recent activity",
};

type KeyState = "none" | "checking" | "valid" | "invalid" | "inactive" | "limit";
type Tab = "site" | "notion" | "readme" | "json";

export default function StudioClient() {
  const [username, setUsername] = useState("octocat");
  const [opts, setOpts] = useState<WidgetOptions>({ ...DEFAULT_OPTIONS });
  const [data, setData] = useState<ActivityData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState(SITE.url);
  const [licenseKey, setLicenseKey] = useState("");
  const [keyState, setKeyState] = useState<KeyState>("none");
  const [tab, setTab] = useState<Tab>("site");
  const [copied, setCopied] = useState(false);

  const set = useCallback(<K extends keyof WidgetOptions>(k: K, v: WidgetOptions[K]) => setOpts((o) => ({ ...o, [k]: v })), []);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const saved = localStorage.getItem("gp_key");
      if (saved) setLicenseKey(saved);
    } catch {
      /* storage can be blocked */
    }
  }, []);

  // Load GitHub data for the preview, debounced while typing.
  useEffect(() => {
    const u = username.trim();
    if (!u) return;
    setStatus("loading");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/github/${encodeURIComponent(u)}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load GitHub data");
        setData(json);
        setStatus("ok");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load GitHub data");
        setStatus("error");
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [username]);

  // Check the license key whenever it looks complete.
  useEffect(() => {
    const k = licenseKey.trim();
    if (!k) return setKeyState("none");
    if (!/^gp_[a-f0-9]{24}$/.test(k)) return setKeyState("invalid");
    setKeyState("checking");
    const ctrl = new AbortController();
    fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k, username }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.valid) {
          setKeyState("valid");
          try {
            localStorage.setItem("gp_key", k);
          } catch {
            /* ignore */
          }
        } else setKeyState(j.reason === "inactive" ? "inactive" : j.reason === "limit" ? "limit" : "invalid");
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [licenseKey, username]);

  const pro = keyState === "valid";
  const user = username.trim() || "your-username";
  const outOpts: WidgetOptions = { ...opts, key: pro ? licenseKey.trim() : undefined };
  const query = toQuery(outOpts);
  const cardQuery = toQuery({ theme: opts.theme, accent: opts.accent, radius: opts.radius, hideBranding: opts.hideBranding, key: outOpts.key });
  const needsPro = usesProFeatures(opts) && !pro;
  const theme = resolveTheme(opts.theme, opts.accent);

  const snippets = useMemo<Record<Tab, { label: string; code: string; note: string }>>(() => {
    const url = `${origin}/w/${user}${query ? `?${query}` : ""}`;
    return {
      site: {
        label: "Website",
        note: "Paste where the widget should appear, then add the script once per page.",
        code: `<div data-gitpulse="${user}"${query ? ` data-config="${query}"` : ""}></div>\n<script async src="${origin}/embed.js"></script>`,
      },
      notion: {
        label: "Notion",
        note: "In Notion type /embed, paste this link and press Embed link. Use the iframe below for other tools.",
        code: `${url}\n\n<iframe src="${url}" width="100%" height="560" style="border:0" loading="lazy" title="GitHub activity"></iframe>`,
      },
      readme: {
        label: "README image",
        note: "A static SVG card that shows streak, stats, graph and languages. It works anywhere images do.",
        code: `[![GitHub activity](${origin}/api/card/${user}.svg${cardQuery ? `?${cardQuery}` : ""})](https://github.com/${user})`,
      },
      json: {
        label: "JSON API",
        note: "The normalized data behind the widget. CORS is open, so you can fetch it from any page.",
        code: `${origin}/api/github/${user}`,
      },
    };
  }, [origin, user, query, cardQuery]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippets[tab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked; the text is still selectable */
    }
  }

  const toggleSection = (s: Section) =>
    set("sections", SECTIONS.filter((x) => (x === s ? !opts.sections.includes(x) : opts.sections.includes(x))));

  return (
    <div className="studio">
      <div className="panel">
        <div className="field">
          <label htmlFor="gh-user">GitHub username</label>
          <input id="gh-user" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" spellCheck={false} />
        </div>

        <div className="field">
          <span className="field-title">Theme</span>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button key={t.id} className="theme-btn" aria-pressed={opts.theme === t.id} onClick={() => set("theme", t.id)}>
                <span className="chip-dots" aria-hidden>
                  <i style={{ background: t.bg }} />
                  <i style={{ background: t.accent }} />
                  <i style={{ background: t.heat[3] }} />
                </span>
                {t.name}
                {t.pro && <span className="pro-tag">Pro</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-title">Layout</span>
          <div className="seg" role="group" aria-label="Layout">
            <button aria-pressed={opts.layout === "wide"} onClick={() => set("layout", "wide")}>Wide</button>
            <button aria-pressed={opts.layout === "compact"} onClick={() => set("layout", "compact")}>Compact</button>
          </div>
        </div>

        <div className="field">
          <span className="field-title">Show</span>
          <div className="checks">
            {SECTIONS.map((s) => (
              <label key={s} className="check">
                <input type="checkbox" checked={opts.sections.includes(s)} onChange={() => toggleSection(s)} />
                {SECTION_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="repo-src">Projects from</label>
            <select id="repo-src" className="select" value={opts.repoSource} onChange={(e) => set("repoSource", e.target.value as WidgetOptions["repoSource"])}>
              <option value="pinned">Pinned</option>
              <option value="stars">Most starred</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="repo-count">How many</label>
            <select id="repo-count" className="select" value={opts.repoCount} onChange={(e) => set("repoCount", Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="radius">Corner radius: {opts.radius}px</label>
          <input id="radius" type="range" min={0} max={32} value={opts.radius} onChange={(e) => set("radius", Number(e.target.value))} />
        </div>

        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={opts.transparent} onChange={(e) => set("transparent", e.target.checked)} />
          Transparent background
        </label>

        <div className="field">
          <span className="field-title">
            Accent color <span className="pro-tag">Pro</span>
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              aria-label="Accent color"
              value={`#${opts.accent ?? theme.accent.replace("#", "")}`}
              onChange={(e) => set("accent", e.target.value.replace("#", ""))}
              style={{ width: 44, height: 36, border: "1px solid #c9ccd8", borderRadius: 8, padding: 2, background: "#fff" }}
            />
            {opts.accent && (
              <button className="btn btn-quiet btn-sm" onClick={() => set("accent", undefined)}>
                Reset
              </button>
            )}
          </div>
        </div>

        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={opts.hideBranding} onChange={(e) => set("hideBranding", e.target.checked)} />
          Hide the GitPulse badge <span className="pro-tag">Pro</span>
        </label>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="license">License key</label>
          <input id="license" className="input mono" placeholder="gp_..." value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} spellCheck={false} autoComplete="off" />
          <p className="hint">
            {keyState === "none" && (
              <>
                Pro user? Paste your key. New here? <Link href="/#pricing">See Pro</Link>.
              </>
            )}
            {keyState === "checking" && "Checking key..."}
            {keyState === "valid" && "Pro is active. Your snippet includes the key."}
            {keyState === "invalid" && "That key was not recognized."}
            {keyState === "inactive" && "That license is no longer active."}
            {keyState === "limit" && "This license is already used on 3 other usernames."}
          </p>
        </div>
      </div>

      <div>
        <div className="sticky">
          <div className={`preview ${opts.transparent ? "stage-transparent" : ""}`} style={opts.transparent ? undefined : { background: theme.page }}>
            {status === "loading" && !data && <p className="preview-msg" style={{ color: theme.muted }}>Loading your GitHub data...</p>}
            {status === "error" && <p className="preview-msg" role="alert" style={{ color: theme.muted }}>{error}</p>}
            {data && status !== "error" && (
              <div style={{ width: "100%", opacity: status === "loading" ? 0.55 : 1, transition: "opacity .15s" }}>
                <Widget data={data} opts={opts} pro={pro} />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {needsPro && (
            <p className="notice">
              You are previewing Pro options. Without a license key your embed shows the free look instead.{" "}
              <Link href="/#pricing">Get Pro for $3 a month</Link>.
            </p>
          )}
          {data?.source === "demo" && (
            <p className="notice">
              This server has no <code>GITHUB_TOKEN</code>, so you are seeing generated demo data. Add a token and real profiles load.
            </p>
          )}
          <div className="tabs" role="tablist">
            {(Object.keys(snippets) as Tab[]).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {snippets[t].label}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginBottom: 10 }}>{snippets[tab].note}</p>
          <div className="snippet">
            <pre className="code" tabIndex={0}>{snippets[tab].code}</pre>
            <button className="btn btn-sm btn-quiet" style={{ background: "#fff" }} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
