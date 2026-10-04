import { useMemo } from 'react';
import { Link } from 'react-router';
import { Board } from '../components/Board';
import { FilterBar } from '../components/FilterBar';
import { useProjectContext } from '../components/ProjectLayout';
import { useStore } from '../store';
import { issueKey, matchesFilters, projectLabels } from '../utils';

export function BoardPage() {
  const { project, filters, setFilters } = useProjectContext();
  const issues = useStore((s) => s.issues);

  const projectIssues = useMemo(() => issues.filter((i) => i.projectId === project.id), [issues, project.id]);
  const visible = useMemo(
    () => projectIssues.filter((i) => matchesFilters(i, issueKey(project, i), filters)),
    [projectIssues, project, filters],
  );
  const labels = useMemo(() => projectLabels(issues, project.id), [issues, project.id]);

  return (
    <div className="page page-board">
      <nav className="page-breadcrumbs" aria-label="Ścieżka">
        <Link to="/">Projekty</Link> / <span>{project.name}</span>
      </nav>
      <div className="page-header">
        <h1>Tablica {project.key}</h1>
      </div>
      <FilterBar filters={filters} onChange={setFilters} labels={labels} />
      <Board project={project} issues={visible} />
    </div>
  );
}
