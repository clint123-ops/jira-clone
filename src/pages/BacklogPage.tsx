import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FilterBar } from '../components/FilterBar';
import { MemberAvatar } from '../components/MemberAvatar';
import { PlusIcon, PriorityIcon, TypeIcon } from '../components/Icons';
import { useProjectContext } from '../components/ProjectLayout';
import { ISSUE_TYPES, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from '../constants';
import { useIssueModal } from '../hooks/useIssueModal';
import { useStore } from '../store';
import { emptyFilters, type Issue } from '../types';
import { useUi } from '../uiStore';
import {
  formatDate,
  hasActiveFilters,
  issueKey,
  isOverdue,
  matchesFilters,
  pluralIssues,
  projectLabels,
} from '../utils';

type SortKey = 'key' | 'type' | 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'updatedAt';
type SortDir = 'asc' | 'desc';

const COMPARE: Record<Exclude<SortKey, 'assignee'>, (a: Issue, b: Issue) => number> = {
  key: (a, b) => a.number - b.number,
  type: (a, b) => ISSUE_TYPES.indexOf(a.type) - ISSUE_TYPES.indexOf(b.type),
  title: (a, b) => a.title.localeCompare(b.title, 'pl'),
  status: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status),
  priority: (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority),
  dueDate: (a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
};

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'type', label: 'Typ', className: 'col-icon' },
  { key: 'key', label: 'Klucz', className: 'col-key' },
  { key: 'title', label: 'Podsumowanie' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priorytet' },
  { key: 'assignee', label: 'Osoba' },
  { key: 'dueDate', label: 'Termin' },
  { key: 'updatedAt', label: 'Zaktualizowano' },
];

export function BacklogPage() {
  const { project, filters, setFilters } = useProjectContext();
  const issues = useStore((s) => s.issues);
  const members = useStore((s) => s.members);
  const openCreate = useUi((s) => s.openCreate);
  const { openIssue } = useIssueModal();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'key', dir: 'desc' });

  const projectIssues = useMemo(() => issues.filter((i) => i.projectId === project.id), [issues, project.id]);
  const labels = useMemo(() => projectLabels(issues, project.id), [issues, project.id]);
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const rows = useMemo(() => {
    const assigneeName = (i: Issue) => (i.assigneeId ? membersById.get(i.assigneeId)?.name : undefined);
    const compareAssignee = (a: Issue, b: Issue) => {
      const x = assigneeName(a);
      const y = assigneeName(b);
      // Unassigned issues sort after assigned ones.
      if (x === undefined || y === undefined) return (x === undefined ? 1 : 0) - (y === undefined ? 1 : 0);
      return x.localeCompare(y, 'pl');
    };
    const compare = sort.key === 'assignee' ? compareAssignee : COMPARE[sort.key];
    return projectIssues
      .filter((i) => matchesFilters(i, issueKey(project, i), filters))
      .sort((a, b) => {
        const result = compare(a, b) || a.number - b.number;
        return sort.dir === 'asc' ? result : -result;
      });
  }, [projectIssues, project, filters, sort, membersById]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="page">
      <nav className="page-breadcrumbs" aria-label="Ścieżka">
        <Link to="/">Projekty</Link> / <span>{project.name}</span>
      </nav>
      <div className="page-header">
        <h1>Backlog</h1>
        <button type="button" className="btn btn-primary" onClick={() => openCreate({ projectId: project.id })}>
          <PlusIcon /> Utwórz zadanie
        </button>
      </div>
      <FilterBar filters={filters} onChange={setFilters} labels={labels} />

      <div className="table-summary">
        {hasActiveFilters(filters)
          ? `${pluralIssues(rows.length)} z ${projectIssues.length}`
          : pluralIssues(rows.length)}
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          {projectIssues.length === 0 ? (
            <>
              <h2>Backlog jest pusty</h2>
              <p>Utwórz pierwsze zadanie w tym projekcie.</p>
            </>
          ) : (
            <>
              <h2>Brak zadań pasujących do filtrów</h2>
              <button type="button" className="btn btn-default" onClick={() => setFilters(emptyFilters)}>
                Wyczyść filtry
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table backlog-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={c.className}
                    aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <button type="button" className="th-sort" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <span className="sort-indicator">
                        {sort.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((issue) => {
                const key = issueKey(project, issue);
                const assignee = issue.assigneeId ? membersById.get(issue.assigneeId) : undefined;
                return (
                  <tr key={issue.id} className="table-row-link" onClick={() => openIssue(key)}>
                    <td className="col-icon">
                      <TypeIcon type={issue.type} />
                    </td>
                    <td className="col-key">
                      <button
                        type="button"
                        className={`btn-link issue-key${issue.status === 'done' ? ' is-done' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openIssue(key);
                        }}
                      >
                        {key}
                      </button>
                    </td>
                    <td>
                      <div className="backlog-title">
                        <span>{issue.title}</span>
                        {issue.labels.map((l) => (
                          <span key={l} className="label-chip">
                            {l}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${issue.status}`}>{STATUS_LABEL[issue.status]}</span>
                    </td>
                    <td>
                      <span className="priority-cell">
                        <PriorityIcon priority={issue.priority} />
                        {PRIORITY_LABEL[issue.priority]}
                      </span>
                    </td>
                    <td>
                      {assignee ? (
                        <span className="assignee-cell" title={assignee.name}>
                          <MemberAvatar member={assignee} size={24} />
                          <span className="assignee-name">{assignee.name}</span>
                        </span>
                      ) : (
                        <span className="muted" title="Nieprzypisane">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Nieprzypisane</span>
                        </span>
                      )}
                    </td>
                    <td className={isOverdue(issue) ? 'text-danger' : undefined}>
                      {issue.dueDate ? formatDate(issue.dueDate) : '—'}
                    </td>
                    <td className="muted">{formatDate(issue.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
