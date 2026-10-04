import { useState, type FormEvent, type ReactNode } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import { PROJECT_KEY_RE, suggestProjectKey } from '../utils';

type ProjectValues = Pick<Project, 'name' | 'key' | 'description'>;

interface ProjectFormProps {
  initial?: ProjectValues;
  /** Projekt, który edytujemy – jego klucz nie liczy się jako zajęty. */
  editingId?: string;
  submitLabel: string;
  onSubmit: (values: ProjectValues) => void;
  footerExtra?: ReactNode;
  autoFocus?: boolean;
}

export function ProjectForm({ initial, editingId, submitLabel, onSubmit, footerExtra, autoFocus }: ProjectFormProps) {
  const projects = useStore((s) => s.projects);
  const [name, setName] = useState(initial?.name ?? '');
  const [key, setKey] = useState(initial?.key ?? '');
  // Dopóki użytkownik sam nie zmieni klucza, podpowiadamy go z nazwy.
  const [keyTouched, setKeyTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<{ name?: string; key?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Nazwa jest wymagana.';
    if (!PROJECT_KEY_RE.test(key)) {
      next.key = 'Klucz: 2–10 znaków, wielkie litery i cyfry, zaczyna się od litery.';
    } else if (projects.some((p) => p.key === key && p.id !== editingId)) {
      next.key = `Klucz ${key} jest już zajęty.`;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ name: name.trim(), key, description: description.trim() });
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field-label">
          Nazwa <span className="required">*</span>
        </span>
        <input
          className={`input${errors.name ? ' has-error' : ''}`}
          autoFocus={autoFocus}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!keyTouched) setKey(suggestProjectKey(e.target.value));
          }}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>
      <label className="field">
        <span className="field-label">
          Klucz <span className="required">*</span>
        </span>
        <input
          className={`input input-key${errors.key ? ' has-error' : ''}`}
          value={key}
          maxLength={10}
          onChange={(e) => {
            setKeyTouched(true);
            setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
          }}
        />
        {errors.key ? (
          <span className="field-error">{errors.key}</span>
        ) : (
          <span className="field-hint">Prefiks numerów zadań, np. {key || 'KEY'}-1.</span>
        )}
      </label>
      <label className="field">
        <span className="field-label">Opis</span>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="form-actions">
        {footerExtra}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
