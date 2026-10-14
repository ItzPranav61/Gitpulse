import type { ReactNode } from "react";
import type { ActivityData, ContributionDay, RepoSummary } from "@/lib/types";
import type { WidgetOptions } from "@/lib/options";
import { resolveTheme, themeVars } from "@/lib/themes";
import { SITE } from "@/lib/config";
import { CommitIcon, FlameIcon, ForkIcon, PulseIcon, StarIcon } from "./icons";

export function fmt(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const TOP = 16;

function Heatmap({ weeks, compact }: { weeks: ContributionDay[][]; compact: boolean }) {
  const ws = compact ? weeks.slice(-26) : weeks;
  const width = ws.length * STEP - GAP;
  const height = TOP + 7 * STEP - GAP;

  const labels: { x: number; text: string }[] = [];
  let lastMonth = -1;
  let lastIdx = -10;
  ws.forEach((w, i) => {
    const m = new Date(`${w[0].date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth) {
      if (i - lastIdx >= 3) {
        labels.push({
          x: i * STEP,
          text: new Date(`${w[0].date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        });
        lastIdx = i;
      }
      lastMonth = m;
    }
  });

  return (
    <svg className="gp-heat" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Contribution calendar">
      {labels.map((l) => (
        <text key={l.x} x={l.x} y={10} className="gp-heat-label">
          {l.text}
        </text>
      ))}
      {ws.map((w, wi) =>
        w.map((d, di) => (
          <rect key={d.date} x={wi * STEP} y={TOP + di * STEP} width={CELL} height={CELL} rx={2.5} fill={`var(--gp-h${d.level})`}>
            <title>{`${d.count} contribution${d.count === 1 ? "" : "s"} on ${shortDate(d.date)}`}</title>
          </rect>
        ))
      )}
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="gp-stat">
      <div className="gp-stat-value">{value}</div>
      <div className="gp-stat-label">{label}</div>
    </div>
  );
}

function RepoCard({ repo }: { repo: RepoSummary }) {
  return (
    <a className="gp-repo" href={repo.url} target="_blank" rel="noopener noreferrer">
      <div className="gp-repo-name">{repo.name}</div>
      <p className="gp-repo-desc">{repo.description ?? "No description yet."}</p>
      <div className="gp-repo-meta">
        {repo.language && (
          <span className="gp-meta-item">
            <i className="gp-dot" style={{ background: repo.languageColor ?? "var(--gp-muted)" }} />
            {repo.language}
          </span>
        )}
        <span className="gp-meta-item">
          <StarIcon width={13} height={13} />
          {fmt(repo.stars)}
        </span>
        <span className="gp-meta-item">
          <ForkIcon width={13} height={13} />
          {fmt(repo.forks)}
        </span>
      </div>
    </a>
  );
}

function Block({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="gp-block">
      {title && <h3 className="gp-block-title">{title}</h3>}
      {children}
    </div>
  );
}

export interface WidgetProps {
  data: ActivityData;
  opts: WidgetOptions;
  /** Whether the viewer's license is valid. Free widgets always show the badge. */
  pro?: boolean;
  className?: string;
}

export function Widget({ data, opts, pro = false, className }: WidgetProps) {
  const theme = resolveTheme(opts.theme, opts.accent);
  const has = (s: (typeof opts.sections)[number]) => opts.sections.includes(s);
  const compact = opts.layout === "compact";
  const repos = (opts.repoSource === "pinned" && data.pinned.length ? data.pinned : data.topStarred).slice(0, opts.repoCount);
  const { streak, totals, user } = data;
  const showBadge = !(pro && opts.hideBranding);

  return (
    <section
      className={["gp", compact ? "gp-compact" : "gp-wide", opts.transparent ? "gp-transparent" : "", className ?? ""].join(" ").trim()}
      style={themeVars(theme, opts.radius)}
      data-theme={theme.id}
    >
      {has("header") && (
        <header className="gp-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gp-avatar" src={user.avatarUrl} alt="" width={44} height={44} />
          <div className="gp-who">
            <a className="gp-name" href={user.url} target="_blank" rel="noopener noreferrer">
              {user.name}
            </a>
            <span className="gp-login">
              @{user.login} · {fmt(user.followers)} followers
            </span>
          </div>
        </header>
      )}

      {has("stats") && (
        <div className="gp-stats">
          <Stat value={fmt(totals.contributions)} label="Contributions" />
          <Stat value={fmt(totals.commits)} label="Commits" />
          <Stat value={fmt(totals.pullRequests)} label="Pull requests" />
          <Stat value={fmt(totals.stars)} label="Stars earned" />
        </div>
      )}

      {has("streak") && (
        <div className="gp-streak">
          <div className="gp-streak-main">
            <FlameIcon className="gp-flame" width={26} height={26} />
            <div>
              <div className="gp-streak-num">
                {streak.current}
                <span> day streak</span>
              </div>
              <div className="gp-streak-sub">
                {streak.current > 0
                  ? `since ${shortDate(streak.currentStart)}${streak.atRisk ? " · contribute today to keep it" : ""}`
                  : "Start one today"}
              </div>
            </div>
          </div>
          <div className="gp-streak-side">
            <div>
              <b>{streak.longest}</b> longest
              <small>{streak.longest > 0 ? `${shortDate(streak.longestStart)} to ${shortDate(streak.longestEnd)}` : ""}</small>
            </div>
          </div>
        </div>
      )}

      {has("heatmap") && (
        <Block>
          <Heatmap weeks={data.weeks} compact={compact} />
          <div className="gp-legend">
            Less
            {[0, 1, 2, 3, 4].map((l) => (
              <i key={l} style={{ background: `var(--gp-h${l})` }} />
            ))}
            More
          </div>
        </Block>
      )}

      {has("languages") && data.languages.length > 0 && (
        <Block title="Languages">
          <div className="gp-langbar" role="img" aria-label="Language breakdown">
            {data.languages.map((l) => (
              <i key={l.name} style={{ width: `${l.percent}%`, background: l.color }} title={`${l.name} ${l.percent}%`} />
            ))}
          </div>
          <ul className="gp-langs">
            {data.languages.slice(0, compact ? 4 : 6).map((l) => (
              <li key={l.name}>
                <i className="gp-dot" style={{ background: l.color }} />
                {l.name} <span>{l.percent}%</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {has("repos") && repos.length > 0 && (
        <Block title={opts.repoSource === "pinned" && data.pinned.length ? "Pinned projects" : "Top projects"}>
          <div className="gp-repos">
            {repos.map((r) => (
              <RepoCard key={r.name} repo={r} />
            ))}
          </div>
        </Block>
      )}

      {has("activity") && data.recent.length > 0 && (
        <Block title="Recent activity">
          <ul className="gp-activity">
            {data.recent.slice(0, compact ? 4 : 6).map((e, i) => (
              <li key={i}>
                <CommitIcon className="gp-act-icon" width={14} height={14} />
                <a href={e.url} target="_blank" rel="noopener noreferrer">
                  {e.text}
                </a>
                <time dateTime={e.at} suppressHydrationWarning>
                  {timeAgo(e.at)}
                </time>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <footer className="gp-footer">
        <span suppressHydrationWarning>
          {data.source === "demo" ? "Demo data" : `Updated ${timeAgo(data.fetchedAt)}`}
          {data.stale ? " (cached)" : ""}
        </span>
        {showBadge && (
          <a href={SITE.url} target="_blank" rel="noopener noreferrer" className="gp-badge">
            <PulseIcon width={13} height={13} /> {SITE.name}
          </a>
        )}
      </footer>
    </section>
  );
}

export function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="gp gp-wide gp-error" style={themeVars(resolveTheme("midnight"), 14)}>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  );
}
