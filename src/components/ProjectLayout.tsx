import { useState } from 'react';
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router';
import { useStore } from '../store';
import { emptyFilters, type Filters, type Project } from '../types';
import { BoardIcon, ListIcon, SettingsIcon } from './Icons';
import { ProjectAvatar } from './ProjectAvatar';

export interface ProjectContext {
  project: Project;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export const useProjectContext = () => useOutletContext<ProjectContext>();

export function ProjectLayout() {
  const { projectKey = '' } = useParams();
  const project = useStore((s) => s.projects.find((p) => p.key === projectKey.toUpperCase()));
  // Filtry są wspólne dla tablicy i backlogu, ale resetują się przy zmianie projektu.
  const [filterState, setFilterState] = useState<{ projectId: string; filters: Filters } | null>(null);

  if (!project) {
    return (
      <div className="page empty-state">
        <h1>Nie znaleziono projektu „{projectKey}”</h1>
        <p>Projekt mógł zostać usunięty albo zmienił klucz.</p>
        <Link to="/" className="btn btn-primary">
          Wróć do projektów
        </Link>
      </div>
    );
  }

  const filters = filterState?.projectId === project.id ? filterState.filters : emptyFilters;
  const context: ProjectContext = {
    project,
    filters,
    setFilters: (next) => setFilterState({ projectId: project.id, filters: next }),
  };

  return (
    <div className="project-layout">
      <aside className="sidebar">
        <div className="sidebar-project">
          <ProjectAvatar project={project} size={32} />
          <div>
            <div className="sidebar-project-name">{project.name}</div>
            <div className="sidebar-project-meta">Projekt oprogramowania</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="board" className="sidebar-link">
            <BoardIcon /> Tablica
          </NavLink>
          <NavLink to="backlog" className="sidebar-link">
            <ListIcon /> Backlog
          </NavLink>
          <NavLink to="settings" className="sidebar-link">
            <SettingsIcon /> Ustawienia projektu
          </NavLink>
        </nav>
      </aside>
      <div className="project-content">
        <Outlet context={context} />
      </div>
    </div>
  );
}
