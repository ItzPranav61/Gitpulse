export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RepoSummary {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string | null;
}

export interface LanguageShare {
  name: string;
  color: string;
  percent: number;
}

export interface ActivityEvent {
  type: string;
  text: string;
  repo: string;
  url: string;
  at: string; // ISO
}

export interface StreakInfo {
  current: number;
  currentStart: string | null;
  longest: number;
  longestStart: string | null;
  longestEnd: string | null;
  /** True when the current streak is still alive only because today has no contributions yet. */
  atRisk: boolean;
}

export interface ActivityData {
  user: {
    login: string;
    name: string;
    avatarUrl: string;
    bio: string | null;
    url: string;
    followers: number;
    following: number;
    publicRepos: number;
  };
  totals: {
    contributions: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    stars: number;
  };
  streak: StreakInfo;
  /** Weeks (Sun..Sat) of contribution days, oldest first. */
  weeks: ContributionDay[][];
  pinned: RepoSummary[];
  topStarred: RepoSummary[];
  languages: LanguageShare[];
  recent: ActivityEvent[];
  fetchedAt: string;
  source: "github" | "demo";
  stale?: boolean;
}

export type Plan = "monthly" | "lifetime";

export interface DomainMapping {
  host: string;
  username: string;
  /** Widget query string (theme, sections...) applied on this domain. */
  query: string;
  /** True once the customer proved control of the host with the TXT record. Only verified domains are served. */
  verified?: boolean;
}

export interface License {
  key: string;
  email: string;
  plan: Plan;
  status: "active" | "canceled";
  usernames: string[];
  domains: DomainMapping[];
  createdAt: string;
  sessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface DayStat {
  views: number;
  visitors: string[];
  referrers: Record<string, number>;
}
