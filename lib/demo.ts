import type { ActivityData, ContributionDay, RepoSummary } from "./types";
import { computeStreaks, levelFor } from "./streak";

/** Deterministic PRNG so a username always gets the same demo profile. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const LANGS: [string, string][] = [
  ["TypeScript", "#3178c6"],
  ["Rust", "#dea584"],
  ["Python", "#3572A5"],
  ["Go", "#00ADD8"],
  ["JavaScript", "#f1e05a"],
  ["Swift", "#F05138"],
  ["Svelte", "#ff3e00"],
];

const REPO_NAMES = [
  ["pulse-kit", "A tiny toolkit for streaming metrics to the browser."],
  ["dotfiles", "Terminal, editor and shell setup, kept boring on purpose."],
  ["inkwell", "Markdown editor with live preview and offline sync."],
  ["tidepool", "Background job runner with a friendly dashboard."],
  ["lintel", "Opinionated linter config shared across my projects."],
  ["fieldnotes", "Static site generator for a personal knowledge base."],
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function demoData(login: string): ActivityData {
  const rand = mulberry32(hash(login.toLowerCase()));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Calendar starts on a Sunday 52 full weeks before this week's Sunday.
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay() - 52 * 7);

  const raw: { date: string; count: number }[] = [];
  const cursor = new Date(start);
  let hot = 0;
  while (cursor <= today) {
    const dow = cursor.getUTCDay();
    const weekday = dow > 0 && dow < 6;
    if (hot === 0 && rand() < 0.04) hot = 5 + Math.floor(rand() * 12);
    let count = 0;
    const p = hot > 0 ? 0.95 : weekday ? 0.62 : 0.28;
    if (rand() < p) count = Math.floor(rand() * rand() * 14) + 1;
    if (hot > 0) hot--;
    raw.push({ date: iso(cursor), count });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  // Make the demo look alive: guarantee a recent streak.
  const streakLen = 6 + Math.floor(rand() * 20);
  for (let i = 1; i <= streakLen && i < raw.length; i++) {
    const d = raw[raw.length - 1 - i];
    if (d.count === 0) d.count = 1 + Math.floor(rand() * 6);
  }

  const max = Math.max(1, ...raw.map((d) => d.count));
  const days: ContributionDay[] = raw.map((d) => ({ ...d, level: levelFor(d.count, max) }));
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const total = days.reduce((s, d) => s + d.count, 0);
  const commits = Math.round(total * 0.78);
  const pullRequests = Math.round(total * 0.1);

  const picks = [...LANGS].sort(() => rand() - 0.5);
  const topStarred: RepoSummary[] = REPO_NAMES.map(([name, description], i) => {
    const [language, languageColor] = picks[i % picks.length];
    return {
      name,
      description,
      url: `https://github.com/${login}/${name}`,
      stars: Math.round(Math.pow(rand(), 2.2) * 2400) + 12,
      forks: Math.round(rand() * 160),
      language,
      languageColor,
    };
  }).sort((a, b) => b.stars - a.stars);

  const shares = picks.slice(0, 5).map(([name, color]) => ({ name, color, w: rand() + 0.15 }));
  const wsum = shares.reduce((s, x) => s + x.w, 0);
  const languages = shares
    .map((s) => ({ name: s.name, color: s.color, percent: Math.round((s.w / wsum) * 1000) / 10 }))
    .sort((a, b) => b.percent - a.percent);

  const now = Date.now();
  const recent = [
    { type: "push", text: `Pushed 3 commits to ${login}/${topStarred[0].name}`, repo: topStarred[0].name, mins: 38 },
    { type: "pr", text: `Merged PR #${40 + Math.floor(rand() * 60)} in ${login}/${topStarred[1].name}`, repo: topStarred[1].name, mins: 210 },
    { type: "star", text: "Starred vercel/next.js", repo: "next.js", mins: 60 * 20 },
    { type: "issue", text: `Opened issue #${5 + Math.floor(rand() * 40)} in ${login}/${topStarred[2].name}`, repo: topStarred[2].name, mins: 60 * 31 },
    { type: "release", text: `Published release v1.${Math.floor(rand() * 9)}.0 of ${login}/${topStarred[0].name}`, repo: topStarred[0].name, mins: 60 * 70 },
  ].map((e) => ({
    type: e.type,
    text: e.text,
    repo: e.repo,
    url: `https://github.com/${login}/${e.repo}`,
    at: new Date(now - e.mins * 60_000).toISOString(),
  }));

  return {
    user: {
      login,
      name: login,
      avatarUrl: `https://github.com/${encodeURIComponent(login)}.png?size=120`,
      bio: "Demo data. Add a GITHUB_TOKEN to show the real profile.",
      url: `https://github.com/${login}`,
      followers: Math.round(rand() * 900) + 20,
      following: Math.round(rand() * 120) + 5,
      publicRepos: topStarred.length + Math.round(rand() * 30),
    },
    totals: {
      contributions: total,
      commits,
      pullRequests,
      issues: Math.round(total * 0.05),
      reviews: Math.round(total * 0.07),
      stars: topStarred.reduce((s, r) => s + r.stars, 0),
    },
    streak: computeStreaks(days),
    weeks,
    pinned: topStarred.slice(0, 4),
    topStarred,
    languages,
    recent,
    fetchedAt: new Date().toISOString(),
    source: "demo",
  };
}
