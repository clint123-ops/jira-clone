import { useMemo, useState, type FormEvent } from 'react';
import { ISSUE_TYPES, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, TYPE_LABEL } from '../constants';
import { useStore } from '../store';
import type { IssueType, Priority, Status } from '../types';
import { useUi } from '../uiStore';
import { issueKey, projectLabels } from '../utils';
import { AssigneeSelect } from './AssigneeSelect';
import { PriorityIcon, TypeIcon } from './Icons';
import { LabelsEditor } from './LabelsEditor';
import { Modal } from './Modal';

export function CreateIssueDialog() {
  const open = useUi((s) => s.createOpen);
  if (!open) return null;
  return <CreateIssueForm />;
}

function CreateIssueForm() {
  const defaults = useUi((s) => s.createDefaults);
  const close = useUi((s) => s.closeCreate);
  const showToast = useUi((s) => s.showToast);
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);
  const createIssue = useStore((s) => s.createIssue);

  const [projectId, setProjectId] = useState(defaults.projectId ?? projects[0]?.id ?? '');
  const [type, setType] = useState<IssueType>('task');
  const [status, setStatus] = useState<Status>(defaults.status ?? 'todo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [labels, setLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const suggestions = useMemo(() => projectLabels(issues, projectId), [issues, projectId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Podsumowanie jest wymagane.');
      return;
    }
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const issue = createIssue(projectId, {
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      priority,
      labels,
      dueDate: dueDate || null,
      assigneeId,
    });
    const key = issueKey(project, issue);
    showToast(`Utworzono zadanie ${key}`, key);
    close();
  };

  return (
    <Modal onClose={close} label="Utwórz zadanie" width={640}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Utwórz zadanie</h2>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="field">
              <span className="field-label">Projekt</span>
              <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Typ zadania</span>
              <div className="select-with-icon">
                <TypeIcon type={type} />
                <select className="input" value={type} onChange={(e) => setType(e.target.value as IssueType)}>
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <label className="field">
            <span className="field-label">
              Podsumowanie <span className="required">*</span>
            </span>
            <input
              className={`input${error ? ' has-error' : ''}`}
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
            />
            {error && <span className="field-error">{error}</span>}
          </label>

          <label className="field">
            <span className="field-label">Opis</span>
            <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className="form-row">
            <label className="field">
              <span className="field-label">Status</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Priorytet</span>
              <div className="select-with-icon">
                <PriorityIcon priority={priority} />
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span className="field-label">Osoba przypisana</span>
              <AssigneeSelect value={assigneeId} onChange={setAssigneeId} />
            </label>
            <label className="field">
              <span className="field-label">Termin</span>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>

          <div className="field">
            <span className="field-label">Etykiety</span>
            <LabelsEditor value={labels} onChange={setLabels} suggestions={suggestions} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-subtle" onClick={close}>
            Anuluj
          </button>
          <button type="submit" className="btn btn-primary">
            Utwórz
          </button>
        </div>
      </form>
    </Modal>
  );
}
