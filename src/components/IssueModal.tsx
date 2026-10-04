import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ISSUE_TYPES, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, TYPE_LABEL } from '../constants';
import { ON_TIME_BONUS, dueDateChangedDuringWork, potentialXp, startedAt } from '../gamification';
import { useIssueModal } from '../hooks/useIssueModal';
import { useStore } from '../store';
import type { HistoryEntry, Issue, IssuePatch, IssueType, Member, Priority, Project, Status } from '../types';
import {
  findIssueByKey,
  formatDate,
  formatDateTime,
  issueKey,
  isOverdue,
  localDateString,
  projectLabels,
} from '../utils';
import { AssigneeSelect } from './AssigneeSelect';
import { CloseIcon, PriorityIcon, StarIcon, TrashIcon, TypeIcon } from './Icons';
import { LabelsEditor } from './LabelsEditor';
import { Modal } from './Modal';
import { ProjectAvatar } from './ProjectAvatar';

export function IssueModal() {
  const { issueKey: key, closeIssue } = useIssueModal();
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);
  if (!key) return null;

  const found = findIssueByKey(projects, issues, key);
  return (
    <Modal onClose={closeIssue} label={`Zadanie ${key}`} width={1040}>
      {found ? (
        <IssueDetails key={found.issue.id} project={found.project} issue={found.issue} onClose={closeIssue} />
      ) : (
        <div className="modal-body empty-state">
          <h2>Nie znaleziono zadania {key}</h2>
          <p>Mogło zostać usunięte.</p>
          <button type="button" className="btn btn-primary" onClick={closeIssue}>
            Zamknij
          </button>
        </div>
      )}
    </Modal>
  );
}

interface IssueDetailsProps {
  project: Project;
  issue: Issue;
  onClose: () => void;
}

function IssueDetails({ project, issue, onClose }: IssueDetailsProps) {
  const updateIssue = useStore((s) => s.updateIssue);
  const deleteIssue = useStore((s) => s.deleteIssue);
  const issues = useStore((s) => s.issues);
  const labelSuggestions = useMemo(() => projectLabels(issues, project.id), [issues, project.id]);
  const key = issueKey(project, issue);
  const update = (patch: IssuePatch) => updateIssue(issue.id, patch);

  const handleDelete = () => {
    if (!window.confirm(`Usunąć zadanie ${key}? Tej operacji nie można cofnąć.`)) return;
    onClose();
    deleteIssue(issue.id);
  };

  return (
    <>
      <div className="issue-modal-header">
        <div className="breadcrumbs">
          <ProjectAvatar project={project} size={16} />
          <Link to={`/p/${project.key}/board`}>{project.name}</Link>
          <span className="breadcrumbs-sep">/</span>
          <TypeIcon type={issue.type} />
          <span>{key}</span>
        </div>
        <div className="issue-modal-actions">
          <button type="button" className="btn btn-subtle" onClick={handleDelete}>
            <TrashIcon /> Usuń
          </button>
          <button type="button" className="icon-btn" aria-label="Zamknij" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="issue-modal-body">
        {/* Title is its own grid area so narrow layouts can show it above the details panel. */}
        <div className="issue-heading">
          <EditableTitle value={issue.title} onSave={(title) => update({ title })} />
        </div>
        {/* Side panel comes first in the DOM so Tab order matches the stacked narrow layout. */}
        <div className="issue-side">
          <select
            className={`status-select status-${issue.status}`}
            aria-label="Status"
            value={issue.status}
            onChange={(e) => update({ status: e.target.value as Status })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <div className="details-panel">
            <h3>Szczegóły</h3>
            <DetailRow label="Osoba">
              <AssigneeSelect
                className="input input-subtle"
                aria-label="Osoba przypisana"
                value={issue.assigneeId}
                onChange={(assigneeId) => update({ assigneeId })}
              />
            </DetailRow>
            <DetailRow label="Typ">
              <div className="select-with-icon">
                <TypeIcon type={issue.type} />
                <select
                  className="input input-subtle"
                  aria-label="Typ"
                  value={issue.type}
                  onChange={(e) => update({ type: e.target.value as IssueType })}
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            </DetailRow>
            <DetailRow label="Priorytet">
              <div className="select-with-icon">
                <PriorityIcon priority={issue.priority} />
                <select
                  className="input input-subtle"
                  aria-label="Priorytet"
                  value={issue.priority}
                  onChange={(e) => update({ priority: e.target.value as Priority })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </DetailRow>
            <DetailRow label="Etykiety">
              <LabelsEditor
                value={issue.labels}
                onChange={(labels) => update({ labels })}
                suggestions={labelSuggestions}
              />
            </DetailRow>
            <DetailRow label="Termin">
              <div className="due-field">
                <input
                  className={`input input-subtle${isOverdue(issue) ? ' is-overdue' : ''}`}
                  type="date"
                  aria-label="Termin"
                  value={issue.dueDate ?? ''}
                  onChange={(e) => update({ dueDate: e.target.value || null })}
                />
                {issue.dueDate && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Usuń termin"
                    onClick={() => update({ dueDate: null })}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </DetailRow>
          </div>

          <XpPanel issue={issue} />

          <div className="issue-dates">
            <div>Utworzono {formatDateTime(issue.createdAt)}</div>
            <div>Zaktualizowano {formatDateTime(issue.updatedAt)}</div>
          </div>
        </div>

        <div className="issue-main">
          <section className="issue-section">
            <h3>Opis</h3>
            <DescriptionEditor value={issue.description} onSave={(description) => update({ description })} />
          </section>
          <section className="issue-section">
            <h3>Aktywność</h3>
            <Activity issue={issue} />
          </section>
        </div>
      </div>
    </>
  );
}

function XpPanel({ issue }: { issue: Issue }) {
  const members = useStore((s) => s.members);
  const award = issue.xpAward;

  if (issue.status === 'done') {
    const earner = award ? (members.find((m) => m.id === award.memberId)?.name ?? 'usunięta osoba') : null;
    return (
      <div className={`xp-panel${award ? ' is-earned' : ''}`}>
        <StarIcon className="xp-panel-icon" />
        <div>
          {award ? (
            <>
              <div className="xp-panel-title">
                Zdobyto <strong>{award.xp} XP</strong>
                {award.bonus > 0 && <span className="muted"> (w tym +{award.bonus} za terminowość)</span>}
              </div>
              <div className="xp-panel-hint">Zdobyte przez: {earner}</div>
            </>
          ) : (
            <>
              <div className="xp-panel-title">Bez XP</div>
              <div className="xp-panel-hint">
                Przy ukończeniu zadanie nie miało przypisanej osoby albo utworzono je od razu jako gotowe.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const today = localDateString();
  const xp = potentialXp(issue, today);
  let hint: string;
  if (!issue.assigneeId) hint = 'Przypisz osobę, aby po ukończeniu zdobyła XP.';
  else if (xp.bonus > 0) hint = `W tym +${xp.bonus} XP za ukończenie do ${formatDate(issue.dueDate!)}.`;
  else if (issue.dueDate === null && startedAt(issue)) {
    hint = 'Bonus za terminowość niedostępny – termin nie był ustawiony przed rozpoczęciem pracy.';
  } else if (issue.dueDate === null) hint = `Ustaw termin przed rozpoczęciem pracy – daje +${ON_TIME_BONUS * 100}% XP.`;
  else if (dueDateChangedDuringWork(issue)) hint = 'Termin zmieniono w trakcie pracy – bez bonusu za terminowość.';
  else hint = 'Termin minął – bonus za terminowość przepadł.';

  return (
    <div className="xp-panel">
      <StarIcon className="xp-panel-icon" />
      <div>
        <div className="xp-panel-title">
          Nagroda <strong>{xp.total} XP</strong>
        </div>
        <div className="xp-panel-hint">{hint}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <div className="detail-value">{children}</div>
    </div>
  );
}

function EditableTitle({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);

  const commit = () => {
    if (cancelled.current) return;
    const title = draft.trim();
    if (title && title !== value) onSave(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className="issue-title-input"
        autoFocus
        aria-label="Tytuł"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            e.stopPropagation();
            cancelled.current = true;
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <h2
      className="issue-title"
      tabIndex={0}
      title="Kliknij, aby edytować"
      onClick={() => {
        cancelled.current = false;
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          cancelled.current = false;
          setDraft(value);
          setEditing(true);
        }
      }}
    >
      {value}
    </h2>
  );
}

function DescriptionEditor({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="editor">
        <textarea
          className="input"
          rows={7}
          autoFocus
          aria-label="Opis"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setEditing(false);
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
          }}
        />
        <div className="editor-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            Zapisz
          </button>
          <button type="button" className="btn btn-subtle" onClick={() => setEditing(false)}>
            Anuluj
          </button>
          <span className="editor-hint">⌘ + Enter, aby zapisać</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`description${value ? '' : ' is-empty'}`}
      tabIndex={0}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setDraft(value);
          setEditing(true);
        }
      }}
    >
      {value || 'Dodaj opis…'}
    </div>
  );
}

function Activity({ issue }: { issue: Issue }) {
  const [tab, setTab] = useState<'comments' | 'history'>('comments');
  return (
    <div>
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'comments'}
          className={`tab${tab === 'comments' ? ' is-active' : ''}`}
          onClick={() => setTab('comments')}
        >
          Komentarze ({issue.comments.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={`tab${tab === 'history' ? ' is-active' : ''}`}
          onClick={() => setTab('history')}
        >
          Historia
        </button>
      </div>
      {tab === 'comments' ? <Comments issue={issue} /> : <History entries={issue.history} />}
    </div>
  );
}

function Comments({ issue }: { issue: Issue }) {
  const addComment = useStore((s) => s.addComment);
  const updateComment = useStore((s) => s.updateComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    addComment(issue.id, draft.trim());
    setDraft('');
  };

  const comments = [...issue.comments].reverse();

  return (
    <div className="comments">
      <div className="comment-new">
        <textarea
          className="input"
          rows={draft ? 3 : 1}
          placeholder="Dodaj komentarz…"
          aria-label="Nowy komentarz"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
        {draft && (
          <div className="editor-actions">
            <button type="button" className="btn btn-primary" onClick={submit}>
              Zapisz
            </button>
            <button type="button" className="btn btn-subtle" onClick={() => setDraft('')}>
              Anuluj
            </button>
          </div>
        )}
      </div>

      {comments.length === 0 && <p className="muted">Brak komentarzy.</p>}
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <div className="comment-meta">
            {formatDateTime(c.createdAt)}
            {c.updatedAt && <span className="muted"> · edytowano</span>}
          </div>
          {editingId === c.id ? (
            <div className="editor">
              <textarea
                className="input"
                rows={3}
                autoFocus
                aria-label="Edytuj komentarz"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setEditingId(null);
                  }
                }}
              />
              <div className="editor-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (editDraft.trim()) updateComment(issue.id, c.id, editDraft.trim());
                    setEditingId(null);
                  }}
                >
                  Zapisz
                </button>
                <button type="button" className="btn btn-subtle" onClick={() => setEditingId(null)}>
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="comment-body">{c.body}</div>
              <div className="comment-actions">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditDraft(c.body);
                  }}
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    if (window.confirm('Usunąć komentarz?')) deleteComment(issue.id, c.id);
                  }}
                >
                  Usuń
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const FIELD_LABEL: Record<HistoryEntry['field'], string> = {
  created: 'Utworzenie',
  title: 'Tytuł',
  description: 'Opis',
  type: 'Typ',
  priority: 'Priorytet',
  status: 'Status',
  labels: 'Etykiety',
  dueDate: 'Termin',
  assignee: 'Osoba',
};

function displayValue(field: HistoryEntry['field'], value: string | null, members: Member[]): string {
  if (value === null || value === '') return 'brak';
  switch (field) {
    case 'assignee':
      return members.find((m) => m.id === value)?.name ?? 'usunięta osoba';
    case 'status':
      return STATUS_LABEL[value as Status] ?? value;
    case 'type':
      return TYPE_LABEL[value as IssueType] ?? value;
    case 'priority':
      return PRIORITY_LABEL[value as Priority] ?? value;
    case 'dueDate':
      return formatDate(value);
    default:
      return value;
  }
}

function History({ entries }: { entries: HistoryEntry[] }) {
  const members = useStore((s) => s.members);
  if (entries.length === 0) return <p className="muted">Brak historii.</p>;
  return (
    <ul className="history">
      {[...entries].reverse().map((e) => (
        <li key={e.id} className="history-entry">
          <div className="history-meta">{formatDateTime(e.at)}</div>
          {e.field === 'created' ? (
            <div>Utworzono zadanie</div>
          ) : e.field === 'description' ? (
            <div>Zmieniono opis</div>
          ) : (
            <div>
              Zmieniono <strong>{FIELD_LABEL[e.field]}</strong>:{' '}
              <span className="history-from">{displayValue(e.field, e.from, members)}</span> →{' '}
              <span className="history-to">{displayValue(e.field, e.to, members)}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
