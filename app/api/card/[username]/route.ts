import { GitHubError, USERNAME_RE, getActivity } from "@/lib/github";
import { verifyKey } from "@/lib/license";
import { enforcePlan, parseOptions } from "@/lib/options";
import { resolveTheme } from "@/lib/themes";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { LIMITS } from "@/lib/config";
import type { ActivityData } from "@/lib/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

function short(iso: string | null) {
  return iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "";
}

function svgHeaders(maxAge = 3600) {
  return {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": `public, max-age=600, s-maxage=${maxAge}, stale-while-revalidate=86400`,
  };
}

function errorSvg(message: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80" viewBox="0 0 420 80"><rect width="420" height="80" rx="12" fill="#0d1117" stroke="#30363d"/><text x="20" y="46" fill="#e6edf3" font-family="system-ui,sans-serif" font-size="14">${esc(message)}</text></svg>`;
}

function renderCard(data: ActivityData, themeId: string, accent: string | undefined, hideBadge: boolean, radius: number) {
  const t = resolveTheme(themeId, accent);
  const W = 640;
  const PAD = 24;
  const STEP = 11;
  const CELL = 9;
  const heatW = data.weeks.length * STEP - 2;
  const heatX = Math.round((W - heatW) / 2);
  const heatY = 178;
  const H = 360;
  const font = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

  const stats: [string, string][] = [
    [fmt(data.totals.contributions), "Contributions"],
    [fmt(data.totals.commits), "Commits"],
    [fmt(data.totals.pullRequests), "Pull requests"],
    [fmt(data.totals.stars), "Stars earned"],
  ];
  const colW = (W - PAD * 2) / 4;
  const statSvg = stats
    .map(
      ([v, l], i) =>
        `<text x="${PAD + i * colW}" y="92" font-size="24" font-weight="750" fill="${t.fg}">${v}</text><text x="${PAD + i * colW}" y="110" font-size="12" fill="${t.muted}">${l}</text>`
    )
    .join("");

  const rects = data.weeks
    .map((w, wi) =>
      w.map((d, di) => `<rect x="${heatX + wi * STEP}" y="${heatY + di * STEP}" width="${CELL}" height="${CELL}" rx="2" fill="${t.heat[d.level]}"/>`).join("")
    )
    .join("");

  let bx = PAD;
  const barW = W - PAD * 2;
  const bar = data.languages
    .map((l) => {
      const w = (l.percent / 100) * barW;
      const r = `<rect x="${bx.toFixed(1)}" y="${heatY + 94}" width="${Math.max(w, 0).toFixed(1)}" height="8" fill="${esc(l.color)}"/>`;
      bx += w;
      return r;
    })
    .join("");
  let lx = PAD;
  const legend = data.languages
    .slice(0, 5)
    .map((l) => {
      const label = `${l.name} ${l.percent}%`;
      const out = `<circle cx="${lx + 4}" cy="${heatY + 122}" r="4" fill="${esc(l.color)}"/><text x="${lx + 14}" y="${heatY + 126}" font-size="12" fill="${t.muted}">${esc(label)}</text>`;
      lx += 24 + label.length * 6.4;
      return out;
    })
    .join("");

  const s = data.streak;
  const flame = `<g transform="translate(${W - PAD - 190} 28) scale(1)"><path transform="scale(1)" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="${t.hot}" fill-opacity=".2" stroke="${t.hot}" stroke-width="1.8" stroke-linejoin="round"/></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub activity for ${esc(data.user.login)}">
<title>GitHub activity for ${esc(data.user.login)}</title>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${radius}" fill="${t.bg}" stroke="${t.border}"/>
<g font-family="${font}">
<text x="${PAD}" y="42" font-size="18" font-weight="700" fill="${t.fg}">${esc(data.user.name)}</text>
<text x="${PAD}" y="60" font-size="12.5" fill="${t.muted}">@${esc(data.user.login)}</text>
${flame}
<text x="${W - PAD - 158}" y="46" font-size="26" font-weight="800" fill="${t.fg}">${s.current}</text>
<text x="${W - PAD - 158 + String(s.current).length * 15 + 6}" y="46" font-size="13" fill="${t.muted}">day streak</text>
<text x="${W - PAD - 158}" y="62" font-size="11.5" fill="${t.muted}">longest ${s.longest}${s.longest ? ` (${esc(short(s.longestStart))} to ${esc(short(s.longestEnd))})` : ""}</text>
${statSvg}
<line x1="${PAD}" x2="${W - PAD}" y1="136" y2="136" stroke="${t.border}"/>
<text x="${PAD}" y="160" font-size="12" font-weight="650" fill="${t.muted}">Last 12 months</text>
${rects}
<text x="${PAD}" y="${heatY + 86}" font-size="12" font-weight="650" fill="${t.muted}">Languages</text>
${bar}
${legend}
${hideBadge ? "" : `<text x="${W - PAD}" y="${H - 14}" text-anchor="end" font-size="11" fill="${t.muted}">Powered by GitPulse</text>`}
</g>
</svg>`;
}

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const raw = (await params).username;
  const username = raw.replace(/\.svg$/i, "");
  if (!USERNAME_RE.test(username)) return new Response(errorSvg("Invalid GitHub username"), { status: 400, headers: svgHeaders(60) });
  if (!rateLimit(`card:${clientIp(req)}`, LIMITS.rateGithub)) return new Response(errorSvg("Too many requests"), { status: 429, headers: svgHeaders(60) });

  const requested = parseOptions(new URL(req.url).searchParams);
  const pro = requested.key ? verifyKey(requested.key, username).valid : false;
  const opts = enforcePlan(requested, pro);

  try {
    const data = await getActivity(username);
    return new Response(renderCard(data, opts.theme, opts.accent, pro && opts.hideBranding, opts.radius), { headers: svgHeaders() });
  } catch (err) {
    const status = err instanceof GitHubError ? err.status : 500;
    return new Response(errorSvg(status === 404 ? `No GitHub user named ${username}` : "GitHub is unreachable right now"), {
      status,
      headers: svgHeaders(60),
    });
  }
}
