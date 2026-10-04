export type IssueType = 'epic' | 'story' | 'task' | 'bug';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Project {
  id: string;
  /** Short key, e.g. "FAV" – issue keys are derived from it (FAV-1, FAV-2…). */
  key: string;
  name: string;
  description: string;
  createdAt: string;
  /** Last issue number assigned in the project. */
  issueCounter: number;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

/** A team member. Issues can be assigned to members, who earn XP for completing them. */
export interface Member {
  id: string;
  name: string;
  createdAt: string;
  /** Index into the avatar palette, picked on creation so it stays stable. */
  colorIndex: number;
}

/** XP granted when an issue entered "done" – a snapshot, unaffected by later edits. */
export interface XpAward {
  memberId: string;
  xp: number;
  /** Part of `xp` that is the on-time bonus. */
  bonus: number;
  at: string;
}

export type HistoryField =
  'created' | 'title' | 'description' | 'type' | 'priority' | 'status' | 'labels' | 'dueDate' | 'assignee';

export interface HistoryEntry {
  id: string;
  at: string;
  field: HistoryField;
  from: string | null;
  to: string | null;
}

export interface Issue {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  type: IssueType;
  priority: Priority;
  status: Status;
  labels: string[];
  /** Date in YYYY-MM-DD format. */
  dueDate: string | null;
  /** Id of the assigned member, if any. */
  assigneeId: string | null;
  /** Set while the issue is done and was assigned when completed. */
  xpAward: XpAward | null;
  /** Position within the board column (ascending). */
  order: number;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  history: HistoryEntry[];
}

export type IssueDraft = Pick<
  Issue,
  'title' | 'description' | 'type' | 'priority' | 'status' | 'labels' | 'dueDate' | 'assigneeId'
>;
export type IssuePatch = Partial<IssueDraft>;

export interface AppData {
  projects: Project[];
  issues: Issue[];
  members: Member[];
}

export interface Filters {
  search: string;
  types: IssueType[];
  priorities: Priority[];
  labels: string[];
}

export const emptyFilters: Filters = { search: '', types: [], priorities: [], labels: [] };
