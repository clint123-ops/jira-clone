import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { awardXp } from './gamification';
import { createSampleData } from './sample';
import type {
  AppData,
  HistoryEntry,
  HistoryField,
  Issue,
  IssueDraft,
  IssuePatch,
  Member,
  Project,
  Status,
} from './types';
import { AVATAR_COLORS, nowIso, uid } from './utils';

interface AppState extends AppData {
  createProject: (input: Pick<Project, 'key' | 'name' | 'description'>) => Project;
  updateProject: (id: string, patch: Partial<Pick<Project, 'key' | 'name' | 'description'>>) => void;
  deleteProject: (id: string) => void;

  createIssue: (projectId: string, draft: IssueDraft) => Issue;
  updateIssue: (id: string, patch: IssuePatch) => void;
  /** Moves an issue to column `status`, before issue `beforeId` (null = to the end). */
  moveIssue: (id: string, status: Status, beforeId: string | null) => void;
  deleteIssue: (id: string) => void;

  addComment: (issueId: string, body: string) => void;
  updateComment: (issueId: string, commentId: string, body: string) => void;
  deleteComment: (issueId: string, commentId: string) => void;

  addMember: (name: string) => Member;
  /** Removes a member and unassigns their issues. */
  deleteMember: (id: string) => void;

  replaceData: (data: AppData) => void;
}

const byOrder = (a: Issue, b: Issue) => a.order - b.order;

function nextOrder(issues: Issue[], projectId: string, status: Status): number {
  let max = -1;
  for (const i of issues) {
    if (i.projectId === projectId && i.status === status) max = Math.max(max, i.order);
  }
  return max + 1;
}

/** Keeps `xpAward` in sync with a status change: granted on entering "done", taken back on leaving it. */
function withAward(before: Issue, after: Issue, at: string): Issue {
  if (after.status === before.status) return after;
  return { ...after, xpAward: after.status === 'done' ? awardXp(after, at) : null };
}

/** The least used avatar colour, so members look different from each other. */
function nextColorIndex(members: Member[]): number {
  const used = AVATAR_COLORS.map((_, n) => members.filter((m) => m.colorIndex === n).length);
  return used.indexOf(Math.min(...used));
}

const serialize = (value: unknown): string | null =>
  Array.isArray(value) ? value.join(', ') || null : ((value as string | null | undefined) ?? null);

function diffHistory(issue: Issue, patch: IssuePatch, at: string): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const field of Object.keys(patch) as (keyof IssuePatch)[]) {
    if (patch[field] === undefined) continue;
    const from = serialize(issue[field]);
    const to = serialize(patch[field]);
    if (from === to) continue;
    // Descriptions can be long – history only records that it changed.
    const isDescription = field === 'description';
    const historyField: HistoryField = field === 'assigneeId' ? 'assignee' : field;
    entries.push({
      id: uid(),
      at,
      field: historyField,
      from: isDescription ? null : from,
      to: isDescription ? null : to,
    });
  }
  return entries;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSampleData(),

      createProject: (input) => {
        const project: Project = { id: uid(), createdAt: nowIso(), issueCounter: 0, ...input };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          issues: s.issues.filter((i) => i.projectId !== id),
        })),

      createIssue: (projectId, draft) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) throw new Error(`Project ${projectId} does not exist`);
        const at = nowIso();
        const number = project.issueCounter + 1;
        const issue: Issue = {
          id: uid(),
          projectId,
          number,
          ...draft,
          // Issues created directly as done earn no XP – XP is for finishing work.
          xpAward: null,
          order: nextOrder(state.issues, projectId, draft.status),
          createdAt: at,
          updatedAt: at,
          comments: [],
          history: [{ id: uid(), at, field: 'created', from: null, to: null }],
        };
        set((s) => ({
          projects: s.projects.map((p) => (p.id === projectId ? { ...p, issueCounter: number } : p)),
          issues: [...s.issues, issue],
        }));
        return issue;
      },

      updateIssue: (id, patch) =>
        set((s) => {
          const issue = s.issues.find((i) => i.id === id);
          if (!issue) return s;
          const at = nowIso();
          const history = diffHistory(issue, patch, at);
          if (history.length === 0) return s;
          const statusChanged = patch.status !== undefined && patch.status !== issue.status;
          const updated = withAward(
            issue,
            {
              ...issue,
              ...patch,
              order: statusChanged ? nextOrder(s.issues, issue.projectId, patch.status!) : issue.order,
              updatedAt: at,
              history: [...issue.history, ...history],
            },
            at,
          );
          return { issues: s.issues.map((i) => (i.id === id ? updated : i)) };
        }),

      moveIssue: (id, status, beforeId) =>
        set((s) => {
          const issue = s.issues.find((i) => i.id === id);
          if (!issue) return s;
          const column = s.issues
            .filter((i) => i.projectId === issue.projectId && i.status === status && i.id !== id)
            .sort(byOrder);
          let index = beforeId ? column.findIndex((i) => i.id === beforeId) : -1;
          if (index < 0) index = column.length;
          column.splice(index, 0, issue);
          const orders = new Map(column.map((i, n) => [i.id, n]));

          const at = nowIso();
          const statusChanged = issue.status !== status;
          return {
            issues: s.issues.map((i) => {
              const order = orders.get(i.id);
              if (order === undefined) return i;
              if (i.id === id && statusChanged) {
                return withAward(
                  i,
                  {
                    ...i,
                    status,
                    order,
                    updatedAt: at,
                    history: [...i.history, { id: uid(), at, field: 'status', from: i.status, to: status }],
                  },
                  at,
                );
              }
              return i.order === order ? i : { ...i, order };
            }),
          };
        }),

      deleteIssue: (id) => set((s) => ({ issues: s.issues.filter((i) => i.id !== id) })),

      addComment: (issueId, body) =>
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId ? { ...i, comments: [...i.comments, { id: uid(), body, createdAt: nowIso() }] } : i,
          ),
        })),

      updateComment: (issueId, commentId, body) =>
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  comments: i.comments.map((c) => (c.id === commentId ? { ...c, body, updatedAt: nowIso() } : c)),
                }
              : i,
          ),
        })),

      deleteComment: (issueId, commentId) =>
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId ? { ...i, comments: i.comments.filter((c) => c.id !== commentId) } : i,
          ),
        })),

      addMember: (name) => {
        const member: Member = { id: uid(), name, createdAt: nowIso(), colorIndex: nextColorIndex(get().members) };
        set((s) => ({ members: [...s.members, member] }));
        return member;
      },

      deleteMember: (id) =>
        set((s) => {
          const at = nowIso();
          return {
            members: s.members.filter((m) => m.id !== id),
            issues: s.issues.map((i) =>
              i.assigneeId === id
                ? {
                    ...i,
                    assigneeId: null,
                    updatedAt: at,
                    history: [...i.history, { id: uid(), at, field: 'assignee', from: id, to: null }],
                  }
                : i,
            ),
          };
        }),

      replaceData: (data) => set({ projects: data.projects, issues: data.issues, members: data.members }),
    }),
    {
      name: 'jira-clone-data',
      version: 3,
      partialize: (s) => ({ projects: s.projects, issues: s.issues, members: s.members }),
      migrate: (persisted, version) => {
        let data = persisted as AppData;
        // v1 → v2: team members and issue assignees (gamification).
        if (version < 2) {
          data = { ...data, members: [], issues: data.issues.map((i) => ({ ...i, assigneeId: null })) };
        }
        // v2 → v3: stored avatar colours and XP awards. Issues completed earlier earn no XP.
        if (version < 3) {
          data = {
            ...data,
            members: data.members.map((m, n) => ({ ...m, colorIndex: m.colorIndex ?? n })),
            issues: data.issues.map((i) => ({ ...i, xpAward: i.xpAward ?? null })),
          };
        }
        return data;
      },
    },
  ),
);
