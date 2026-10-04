import { ISSUE_TYPES, PRIORITIES, STATUSES } from './constants';
import type { AppData, Issue, Project } from './types';
import { localDateString, nowIso } from './utils';

const EXPORT_VERSION = 1;

export function downloadExport(data: AppData) {
  const payload = { version: EXPORT_VERSION, exportedAt: nowIso(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jira-clone-${localDateString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Validates an export file. Throws an Error with a user-facing (Polish) message. */
export function parseImport(text: string): AppData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Plik nie jest poprawnym JSON-em.');
  }
  if (!isObject(json) || !Array.isArray(json.projects) || !Array.isArray(json.issues)) {
    throw new Error('Plik nie wygląda na eksport z tej aplikacji (brak „projects” lub „issues”).');
  }

  const projectIds = new Set<string>();
  for (const p of json.projects) {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.key !== 'string' || typeof p.name !== 'string') {
      throw new Error('Plik zawiera niepoprawny projekt.');
    }
    projectIds.add(p.id);
  }
  for (const i of json.issues) {
    const valid =
      isObject(i) &&
      typeof i.id === 'string' &&
      typeof i.title === 'string' &&
      typeof i.number === 'number' &&
      projectIds.has(i.projectId as string) &&
      STATUSES.includes(i.status as never) &&
      ISSUE_TYPES.includes(i.type as never) &&
      PRIORITIES.includes(i.priority as never);
    if (!valid) throw new Error('Plik zawiera niepoprawne zadanie.');
  }

  // Fill in missing optional fields so hand-edited files still work.
  const rawIssues = json.issues as Partial<Issue>[];
  const projects = (json.projects as Partial<Project>[]).map((p) => ({
    description: '',
    createdAt: nowIso(),
    ...p,
    issueCounter: Math.max(
      p.issueCounter ?? 0,
      ...rawIssues.filter((i) => i.projectId === p.id).map((i) => i.number ?? 0),
    ),
  })) as Project[];
  const issues = rawIssues.map((i, n) => ({
    description: '',
    labels: [],
    dueDate: null,
    order: n,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    comments: [],
    history: [],
    ...i,
  })) as Issue[];
  return { projects, issues };
}
