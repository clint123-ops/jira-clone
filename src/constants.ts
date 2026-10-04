import type { IssueType, Priority, Status } from './types';

export const STATUSES: Status[] = ['todo', 'in_progress', 'in_review', 'done'];

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'Do zrobienia',
  in_progress: 'W trakcie',
  in_review: 'Do przeglądu',
  done: 'Gotowe',
};

export const ISSUE_TYPES: IssueType[] = ['task', 'bug', 'story', 'epic'];

export const TYPE_LABEL: Record<IssueType, string> = {
  task: 'Zadanie',
  bug: 'Błąd',
  story: 'Story',
  epic: 'Epic',
};

export const TYPE_COLOR: Record<IssueType, string> = {
  task: '#4bade8',
  bug: '#e5493a',
  story: '#63ba3c',
  epic: '#904ee2',
};

export const PRIORITIES: Priority[] = ['highest', 'high', 'medium', 'low', 'lowest'];

export const PRIORITY_LABEL: Record<Priority, string> = {
  highest: 'Najwyższy',
  high: 'Wysoki',
  medium: 'Średni',
  low: 'Niski',
  lowest: 'Najniższy',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  highest: '#e5493a',
  high: '#f06a3c',
  medium: '#e2a400',
  low: '#2a8bf2',
  lowest: '#0065ff',
};
