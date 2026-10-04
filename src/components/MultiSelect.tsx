import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { ChevronDownIcon } from './Icons';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface MultiSelectProps<T extends string> {
  label: string;
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

export function MultiSelect<T extends string>({ label, options, selected, onChange }: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className={`btn btn-default filter-btn${selected.length ? ' is-active' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        {selected.length > 0 && <span className="filter-count">{selected.length}</span>}
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.length === 0 ? (
            <div className="dropdown-empty">Brak opcji</div>
          ) : (
            options.map((o) => (
              <label key={o.value} className="dropdown-item">
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
                {o.icon}
                <span>{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
