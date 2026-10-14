import type { ContributionDay, StreakInfo } from "./types";

/**
 * Computes current and longest streaks from a flat, ascending list of days.
 * The current streak is not broken by an empty "today": the day is still in
 * progress, so we count back from yesterday and flag it as at risk.
 */
export function computeStreaks(days: ContributionDay[]): StreakInfo {
  let longest = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;

  let run = 0;
  let runStart: string | null = null;
  for (const d of days) {
    if (d.count > 0) {
      if (run === 0) runStart = d.date;
      run++;
      if (run > longest) {
        longest = run;
        longestStart = runStart;
        longestEnd = d.date;
      }
    } else {
      run = 0;
      runStart = null;
    }
  }

  let idx = days.length - 1;
  let atRisk = false;
  if (idx >= 0 && days[idx].count === 0) {
    atRisk = true;
    idx--;
  }
  let current = 0;
  while (idx >= 0 && days[idx].count > 0) {
    current++;
    idx--;
  }
  const currentStart = current > 0 ? days[idx + 1].date : null;
  if (current === 0) atRisk = false;

  return { current, currentStart, longest, longestStart, longestEnd, atRisk };
}

export function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const r = count / max;
  if (r <= 0.25) return 1;
  if (r <= 0.5) return 2;
  if (r <= 0.75) return 3;
  return 4;
}
