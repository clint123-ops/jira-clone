import { ISSUE_TYPES, PRIORITIES, PRIORITY_LABEL, TYPE_LABEL } from '../constants';
import { emptyFilters, type Filters } from '../types';
import { hasActiveFilters } from '../utils';
import { PriorityIcon, SearchIcon, TypeIcon } from './Icons';
import { MultiSelect } from './MultiSelect';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  labels: string[];
}

export function FilterBar({ filters, onChange, labels }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="search-input">
        <SearchIcon />
        <input
          type="search"
          placeholder="Szukaj zadań"
          aria-label="Szukaj zadań"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <MultiSelect
        label="Typ"
        options={ISSUE_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t], icon: <TypeIcon type={t} /> }))}
        selected={filters.types}
        onChange={(types) => onChange({ ...filters, types })}
      />
      <MultiSelect
        label="Priorytet"
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p], icon: <PriorityIcon priority={p} /> }))}
        selected={filters.priorities}
        onChange={(priorities) => onChange({ ...filters, priorities })}
      />
      <MultiSelect
        label="Etykieta"
        options={labels.map((l) => ({ value: l, label: l }))}
        selected={filters.labels}
        onChange={(selected) => onChange({ ...filters, labels: selected })}
      />
      {hasActiveFilters(filters) && (
        <button type="button" className="btn btn-link" onClick={() => onChange(emptyFilters)}>
          Wyczyść filtry
        </button>
      )}
    </div>
  );
}
