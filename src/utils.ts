import type { Filters, Issue, Project } from './types';

export const uid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

const dateFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Accepts a YYYY-MM-DD date or a full ISO timestamp. */
export function formatDate(value: string): string {
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return dateFormat.format(date);
}

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

/** Today's local date as YYYY-MM-DD (shifted by `offsetDays`). */
export function localDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const isOverdue = (issue: Issue) =>
  issue.dueDate !== null && issue.status !== 'done' && issue.dueDate < localDateString();

export const issueKey = (project: Project, issue: Issue) => `${project.key}-${issue.number}`;

export function findIssueByKey(projects: Project[], issues: Issue[], key: string) {
  const match = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/.exec(key.trim());
  if (!match) return null;
  const project = projects.find((p) => p.key === match[1].toUpperCase());
  if (!project) return null;
  const number = Number(match[2]);
  const issue = issues.find((i) => i.projectId === project.id && i.number === number);
  return issue ? { project, issue } : null;
}

export function matchesFilters(issue: Issue, key: string, filters: Filters): boolean {
  if (filters.types.length && !filters.types.includes(issue.type)) return false;
  if (filters.priorities.length && !filters.priorities.includes(issue.priority)) return false;
  if (filters.labels.length && !filters.labels.some((l) => issue.labels.includes(l))) return false;
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    !issue.title.toLowerCase().includes(query) &&
    !issue.description.toLowerCase().includes(query) &&
    !key.toLowerCase().includes(query)
  ) {
    return false;
  }
  return true;
}

export const hasActiveFilters = (f: Filters) =>
  f.search.trim() !== '' || f.types.length > 0 || f.priorities.length > 0 || f.labels.length > 0;

export function projectLabels(issues: Issue[], projectId: string): string[] {
  const labels = new Set<string>();
  for (const issue of issues) {
    if (issue.projectId === projectId) issue.labels.forEach((l) => labels.add(l));
  }
  return [...labels].sort((a, b) => a.localeCompare(b, 'pl'));
}

export const PROJECT_KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/;

/** Suggests a project key from its name, e.g. "Strona firmowa" → "SF". */
export function suggestProjectKey(name: string): string {
  const ascii = name
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  const words = ascii.split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';
  const key =
    words.length > 1
      ? words
          .map((w) => w[0])
          .join('')
          .slice(0, 5)
      : words[0].slice(0, 4);
  return key.replace(/^[0-9]+/, '');
}

export const AVATAR_COLORS = ['#0c66e4', '#6e5dc6', '#1f845a', '#c9372c', '#b65c02', '#0b7a8e', '#ae4787'];

export function projectColor(key: string): string {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function pluralIssues(n: number): string {
  if (n === 1) return '1 zadanie';
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} zadania`;
  return `${n} zadań`;
}
