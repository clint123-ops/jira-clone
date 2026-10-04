// XP, levels and badges. XP is awarded when an issue enters "done" and stored on the issue (`xpAward`), so
// later edits (priority, type, due date, assignee) cannot change it. Leaving "done" takes the award back.
import type { Issue, IssueType, Member, Priority, XpAward } from './types';

export const TYPE_XP: Record<IssueType, number> = { task: 10, bug: 15, story: 20, epic: 40 };
/** Kept small on purpose, so raising the priority is not a shortcut to more XP. */
export const PRIORITY_XP: Record<Priority, number> = { highest: 10, high: 6, medium: 4, low: 2, lowest: 0 };
/** Bonus (as a fraction of base XP) for finishing on or before the due date. */
export const ON_TIME_BONUS = 0.5;

export interface IssueXp {
  base: number;
  bonus: number;
  total: number;
}

/** Local YYYY-MM-DD of an ISO timestamp – due dates are local calendar days. */
function localDay(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** When work on the issue started (it first left "todo"), or null if it has not started yet. */
export function startedAt(issue: Issue): string | null {
  const firstMove = issue.history.find((e) => e.field === 'status');
  // Created in a later column (or moved straight from it) – work started at creation.
  if (firstMove ? firstMove.from !== 'todo' : issue.status !== 'todo') return issue.createdAt;
  return firstMove ? firstMove.at : null;
}

/** The on-time bonus only counts if the due date was not moved after work started. */
export function dueDateChangedDuringWork(issue: Issue): boolean {
  const started = startedAt(issue);
  if (!started) return false;
  return issue.history.some((e) => e.field === 'dueDate' && e.at > started);
}

function xpFor(issue: Issue, day: string): IssueXp {
  const base = TYPE_XP[issue.type] + PRIORITY_XP[issue.priority];
  const onTime = issue.dueDate !== null && day <= issue.dueDate && !dueDateChangedDuringWork(issue);
  const bonus = onTime ? Math.round(base * ON_TIME_BONUS) : 0;
  return { base, bonus, total: base + bonus };
}

/** XP the issue would earn if it were completed today (`today` is a local YYYY-MM-DD). */
export const potentialXp = (issue: Issue, today: string) => xpFor(issue, today);

/** The award for an issue entering "done" at `at` – null when nobody is assigned. */
export function awardXp(issue: Issue, at: string): XpAward | null {
  if (!issue.assigneeId) return null;
  const { total, bonus } = xpFor(issue, localDay(at));
  return { memberId: issue.assigneeId, xp: total, bonus, at };
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

type Awarded = Issue & { xpAward: XpAward };

interface BadgeRule extends Badge {
  earned: (done: Awarded[]) => boolean;
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
    earned: (d) => d.filter((i) => i.xpAward.bonus > 0).length >= 5,
  },
  {
    id: 'epic',
    name: 'Epicki finał',
    description: 'Ukończ epic',
    icon: '🏔️',
    earned: (d) => d.some((i) => i.type === 'epic'),
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
 * Stats for every member. `since` is an ISO timestamp – only awards given after it count towards
 * `periodXp`/`periodDone` (null = all time).
 */
export function memberStats(members: Member[], issues: Issue[], since: string | null): MemberStats[] {
  const doneBy = new Map<string, Awarded[]>();
  for (const issue of issues) {
    if (!issue.xpAward) continue;
    const list = doneBy.get(issue.xpAward.memberId) ?? [];
    list.push(issue as Awarded);
    doneBy.set(issue.xpAward.memberId, list);
  }

  return members
    .map((member) => {
      const done = doneBy.get(member.id) ?? [];
      let totalXp = 0;
      let periodXp = 0;
      let periodDone = 0;
      for (const { xpAward } of done) {
        totalXp += xpAward.xp;
        if (since === null || xpAward.at >= since) {
          periodXp += xpAward.xp;
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
export function totalXpOf(memberId: string, issues: Issue[]): number {
  let xp = 0;
  for (const issue of issues) {
    if (issue.xpAward?.memberId === memberId) xp += issue.xpAward.xp;
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
