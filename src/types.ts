export type IssueType = 'epic' | 'story' | 'task' | 'bug';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Project {
  id: string;
  /** Krótki klucz, np. "FAV" – z niego powstają numery zadań (FAV-1, FAV-2…). */
  key: string;
  name: string;
  description: string;
  createdAt: string;
  /** Ostatnio nadany numer zadania w projekcie. */
  issueCounter: number;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export type HistoryField = 'created' | 'title' | 'description' | 'type' | 'priority' | 'status' | 'labels' | 'dueDate';

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
  /** Data w formacie YYYY-MM-DD. */
  dueDate: string | null;
  /** Pozycja w kolumnie tablicy (rosnąco). */
  order: number;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  history: HistoryEntry[];
}

export type IssueDraft = Pick<Issue, 'title' | 'description' | 'type' | 'priority' | 'status' | 'labels' | 'dueDate'>;
export type IssuePatch = Partial<IssueDraft>;

export interface AppData {
  projects: Project[];
  issues: Issue[];
}

export interface Filters {
  search: string;
  types: IssueType[];
  priorities: Priority[];
  labels: string[];
}

export const emptyFilters: Filters = { search: '', types: [], priorities: [], labels: [] };
