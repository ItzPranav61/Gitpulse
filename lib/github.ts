import { LIMITS } from "./config";
import { demoData } from "./demo";
import { computeStreaks } from "./streak";
import type {
  ActivityData,
  ActivityEvent,
  ContributionDay,
  LanguageShare,
  RepoSummary,
} from "./types";

const GQL = "https://api.github.com/graphql";

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const QUERY = /* GraphQL */ `
  query Activity($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl
      bio
      url
      followers { totalCount }
      following { totalCount }
      repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) { totalCount }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes { ... on Repository { ...RepoFields } }
      }
      topRepos: repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          ...RepoFields
          languages(first: 3, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
    }
  }
  fragment RepoFields on Repository {
    name
    description
    url
    stargazerCount
    forkCount
    primaryLanguage { name color }
  }
`;

const LEVELS: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface RawRepo {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string | null } | null;
  languages?: { edges: { size: number; node: { name: string; color: string | null } }[] };
}

function mapRepo(r: RawRepo): RepoSummary {
  return {
    name: r.name,
    description: r.description,
    url: r.url,
    stars: r.stargazerCount,
    forks: r.forkCount,
    language: r.primaryLanguage?.name ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
  };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "gitpulse-widget",
    Accept: "application/vnd.github+json",
  };
}

async function fetchGraphQL(login: string, token: string) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
    cache: "no-store",
  });
  if (res.status === 401) throw new GitHubError(502, "GitHub rejected the server token");
  if (res.status === 403 || res.status === 429) throw new GitHubError(503, "GitHub rate limit reached, try again soon");
  if (!res.ok) throw new GitHubError(502, `GitHub responded with ${res.status}`);
  const json = await res.json();
  if (json.errors?.some((e: { type?: string }) => e.type === "NOT_FOUND") || (!json.data?.user && !json.errors)) {
    throw new GitHubError(404, `GitHub user "${login}" not found`);
  }
  if (json.errors?.length && !json.data?.user) {
    throw new GitHubError(502, json.errors[0]?.message ?? "GitHub query failed");
  }
  return json.data.user;
}

interface RawEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, any>;
}

function describeEvent(e: RawEvent): ActivityEvent | null {
  const repo = e.repo.name;
  const url = `https://github.com/${repo}`;
  const p = e.payload ?? {};
  const base = { repo: repo.split("/")[1] ?? repo, url, at: e.created_at };
  switch (e.type) {
    case "PushEvent": {
      const n = p.size ?? p.commits?.length ?? 1;
      return { ...base, type: "push", text: `Pushed ${n} commit${n === 1 ? "" : "s"} to ${repo}` };
    }
    case "PullRequestEvent": {
      const merged = p.action === "closed" && p.pull_request?.merged;
      const verb = merged ? "Merged" : p.action === "opened" ? "Opened" : p.action === "closed" ? "Closed" : null;
      if (!verb) return null;
      return { ...base, type: "pr", url: p.pull_request?.html_url ?? url, text: `${verb} PR #${p.number} in ${repo}` };
    }
    case "PullRequestReviewEvent":
      return { ...base, type: "review", url: p.pull_request?.html_url ?? url, text: `Reviewed PR #${p.pull_request?.number} in ${repo}` };
    case "IssuesEvent":
      if (p.action !== "opened" && p.action !== "closed") return null;
      return { ...base, type: "issue", url: p.issue?.html_url ?? url, text: `${p.action === "opened" ? "Opened" : "Closed"} issue #${p.issue?.number} in ${repo}` };
    case "CreateEvent":
      if (p.ref_type === "repository") return { ...base, type: "create", text: `Created repository ${repo}` };
      return null;
    case "ReleaseEvent":
      return { ...base, type: "release", url: p.release?.html_url ?? url, text: `Published ${p.release?.tag_name ?? "a release"} of ${repo}` };
    case "WatchEvent":
      return { ...base, type: "star", text: `Starred ${repo}` };
    case "ForkEvent":
      return { ...base, type: "fork", text: `Forked ${repo}` };
    default:
      return null;
  }
}

async function fetchEvents(login: string, token: string): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=50`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const events = (await res.json()) as RawEvent[];
    const out: ActivityEvent[] = [];
    for (const e of events) {
      const d = describeEvent(e);
      if (!d) continue;
      const prev = out[out.length - 1];
      if (prev && prev.type === "push" && d.type === "push" && prev.repo === d.repo) continue; // collapse repeated pushes
      out.push(d);
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function load(login: string): Promise<ActivityData> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return demoData(login);

  const [user, recent] = await Promise.all([fetchGraphQL(login, token), fetchEvents(login, token)]);

  const cc = user.contributionsCollection;
  const days: ContributionDay[] = [];
  const weeks: ContributionDay[][] = cc.contributionCalendar.weeks.map(
    (w: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }) =>
      w.contributionDays.map((d) => {
        const day: ContributionDay = { date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 };
        days.push(day);
        return day;
      })
  );

  const repos: RawRepo[] = user.topRepos.nodes.filter(Boolean);
  const topStarred = repos.slice(0, 6).map(mapRepo);
  const pinned = (user.pinnedItems.nodes as RawRepo[]).filter(Boolean).map(mapRepo);
  const stars = repos.reduce((s, r) => s + r.stargazerCount, 0);

  // Language share across the user's owned repos, weighted by bytes.
  const bytes = new Map<string, { size: number; color: string }>();
  for (const r of repos) {
    for (const edge of r.languages?.edges ?? []) {
      const cur = bytes.get(edge.node.name) ?? { size: 0, color: edge.node.color ?? "#8b8b8b" };
      cur.size += edge.size;
      bytes.set(edge.node.name, cur);
    }
  }
  const totalBytes = [...bytes.values()].reduce((s, v) => s + v.size, 0) || 1;
  const languages: LanguageShare[] = [...bytes.entries()]
    .map(([name, v]) => ({ name, color: v.color, percent: Math.round((v.size / totalBytes) * 1000) / 10 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  return {
    user: {
      login: user.login,
      name: user.name || user.login,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      url: user.url,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      publicRepos: user.repositories.totalCount,
    },
    totals: {
      contributions: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      stars,
    },
    streak: computeStreaks(days),
    weeks,
    pinned,
    topStarred,
    languages,
    recent,
    fetchedAt: new Date().toISOString(),
    source: "github",
  };
}

// ---- in-memory cache with request de-duplication and stale-on-error ----
const g = globalThis as unknown as {
  __gpCache?: Map<string, { data: ActivityData; at: number }>;
  __gpInflight?: Map<string, Promise<ActivityData>>;
};
const cache = (g.__gpCache ??= new Map());
const inflight = (g.__gpInflight ??= new Map());

export async function getActivity(login: string): Promise<ActivityData> {
  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < LIMITS.cacheTtlMs) return hit.data;

  let p = inflight.get(key);
  if (!p) {
    p = load(login)
      .then((data) => {
        cache.set(key, { data, at: Date.now() });
        if (cache.size > LIMITS.cacheMaxEntries) {
          const oldest = cache.keys().next().value;
          if (oldest) cache.delete(oldest);
        }
        return data;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }

  try {
    return await p;
  } catch (err) {
    // Serve stale data rather than breaking someone's portfolio during a GitHub hiccup.
    if (hit && !(err instanceof GitHubError && err.status === 404)) return { ...hit.data, stale: true };
    throw err;
  }
}
