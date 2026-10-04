import { useId, useState } from 'react';

interface LabelsEditorProps {
  value: string[];
  onChange: (labels: string[]) => void;
  suggestions: string[];
}

/** Labels have no spaces (like in Jira): spaces become dashes. */
const normalizeLabel = (raw: string) => raw.trim().replace(/\s+/g, '-').replace(/,/g, '');

export function LabelsEditor({ value, onChange, suggestions }: LabelsEditorProps) {
  const [input, setInput] = useState('');
  const listId = useId();

  const add = (raw: string) => {
    const label = normalizeLabel(raw);
    if (label && !value.includes(label)) onChange([...value, label]);
    setInput('');
  };

  return (
    <div className="labels-editor">
      {value.map((label) => (
        <span key={label} className="label-chip">
          {label}
          <button
            type="button"
            aria-label={`Usuń etykietę ${label}`}
            onClick={() => onChange(value.filter((l) => l !== label))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={input}
        placeholder={value.length ? '' : 'Dodaj etykietę…'}
        aria-label="Dodaj etykietę"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(input);
          } else if (e.key === 'Backspace' && !input && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => input && add(input)}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
