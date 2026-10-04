// XP, levels and badges. Everything is derived from issues (never stored), so XP always matches the data:
// moving an issue out of "done" or reassigning it takes the XP back.
import type { Issue, IssueType, Member, Priority } from './types';

export const TYPE_XP: Record<IssueType, number> = { task: 10, bug: 15, story: 20, epic: 40 };
export const PRIORITY_XP: Record<Priority, number> = { highest: 25, high: 15, medium: 10, low: 5, lowest: 0 };
/** Bonus (as a fraction of base XP) for finishing on or before the due date. */
export const ON_TIME_BONUS = 0.5;

export interface IssueXp {
  base: number;
  bonus: number;
  total: number;
}

/** When the issue last entered "done" (null if it is not done). */
export function completedAt(issue: Issue): string | null {
  if (issue.status !== 'done') return null;
  for (let n = issue.history.length - 1; n >= 0; n--) {
    const e = issue.history[n];
    if (e.field === 'status' && e.to === 'done') return e.at;
  }
  // Created directly as done.
  return issue.createdAt;
}

/** Local YYYY-MM-DD of an ISO timestamp – due dates are local calendar days. */
function localDay(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * XP an issue is worth. For an open issue the on-time bonus is shown as long as the due date has not passed
 * (`today` is a local YYYY-MM-DD); for a done issue it depends on when it was completed.
 */
export function issueXp(issue: Issue, today: string): IssueXp {
  const base = TYPE_XP[issue.type] + PRIORITY_XP[issue.priority];
  const done = completedAt(issue);
  const onTime = issue.dueDate !== null && (done ? localDay(done) : today) <= issue.dueDate;
  const bonus = onTime ? Math.round(base * ON_TIME_BONUS) : 0;
  return { base, bonus, total: base + bonus };
}

export function isOnTime(issue: Issue): boolean {
  const done = completedAt(issue);
  return done !== null && issue.dueDate !== null && localDay(done) <= issue.dueDate;
}

// ---------- Levels ----------

const LEVEL_TITLES = ['Nowicjusz', 'Praktyk', 'Fachowiec', 'Ekspert', 'Mistrz', 'Legenda'];

/** Total XP needed to reach `level` (level 1 = 0 XP, 2 = 100, 3 = 300, 4 = 600…). */
export const xpForLevel = (level: number) => (100 * level * (level - 1)) / 2;

export interface LevelInfo {
  level: number;
  title: string;
  /** XP earned within the current level. */
  current: number;
  /** XP needed to go from the current level to the next one. */
  needed: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const start = xpForLevel(level);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    current: xp - start,
    needed: xpForLevel(level + 1) - start,
  };
}

// ---------- Badges ----------

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeRule extends Badge {
  earned: (done: Issue[]) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  {
    id: 'first',
    name: 'Pierwszy krok',
    description: 'Ukończ pierwsze zadanie',
    icon: '🚀',
    earned: (d) => d.length >= 1,
  },
  {
    id: 'bugs',
    name: 'Łowca błędów',
    description: 'Napraw 5 błędów',
    icon: '🐞',
    earned: (d) => d.filter((i) => i.type === 'bug').length >= 5,
  },
  {
    id: 'on-time',
    name: 'Punktualny',
    description: 'Ukończ 5 zadań w terminie',
    icon: '⏰',
    earned: (d) => d.filter(isOnTime).length >= 5,
  },
  {
    id: 'firefighter',
    name: 'Strażak',
    description: 'Ukończ 3 zadania o najwyższym priorytecie',
    icon: '🔥',
    earned: (d) => d.filter((i) => i.priority === 'highest').length >= 3,
  },
  {
    id: 'marathon',
    name: 'Maratończyk',
    description: 'Ukończ 25 zadań',
    icon: '🏅',
    earned: (d) => d.length >= 25,
  },
];

export const BADGES: Badge[] = BADGE_RULES.map(({ earned: _earned, ...badge }) => badge);

// ---------- Leaderboard ----------

export interface MemberStats {
  member: Member;
  /** All-time XP – determines the level. */
  totalXp: number;
  /** XP earned in the selected period – determines the ranking. */
  periodXp: number;
  periodDone: number;
  level: LevelInfo;
  badges: Badge[];
}

/**
 * Stats for every member. `since` is an ISO timestamp – only issues completed after it count towards
 * `periodXp`/`periodDone` (null = all time).
 */
export function memberStats(members: Member[], issues: Issue[], since: string | null, today: string): MemberStats[] {
  const doneBy = new Map<string, Issue[]>();
  for (const issue of issues) {
    if (issue.status !== 'done' || !issue.assigneeId) continue;
    const list = doneBy.get(issue.assigneeId) ?? [];
    list.push(issue);
    doneBy.set(issue.assigneeId, list);
  }

  return members
    .map((member) => {
      const done = doneBy.get(member.id) ?? [];
      let totalXp = 0;
      let periodXp = 0;
      let periodDone = 0;
      for (const issue of done) {
        const xp = issueXp(issue, today).total;
        totalXp += xp;
        if (since === null || completedAt(issue)! >= since) {
          periodXp += xp;
          periodDone += 1;
        }
      }
      return {
        member,
        totalXp,
        periodXp,
        periodDone,
        level: levelInfo(totalXp),
        badges: BADGE_RULES.filter((b) => b.earned(done)).map(({ earned: _earned, ...badge }) => badge),
      };
    })
    .sort(
      (a, b) => b.periodXp - a.periodXp || b.totalXp - a.totalXp || a.member.name.localeCompare(b.member.name, 'pl'),
    );
}

/** Total XP of one member (all time). */
export function totalXpOf(memberId: string, issues: Issue[], today: string): number {
  let xp = 0;
  for (const issue of issues) {
    if (issue.status === 'done' && issue.assigneeId === memberId) xp += issueXp(issue, today).total;
  }
  return xp;
}

// ---------- Avatars ----------

export function initials(name: string): string {
  // Array.from keeps surrogate pairs (e.g. emoji) intact.
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Array.from(w));
  if (words.length === 0) return '?';
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2).join('');
  return letters.toUpperCase();
}
