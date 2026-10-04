import { Link, NavLink, useMatch } from 'react-router';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { DataMenu } from './DataMenu';
import { PlusIcon } from './Icons';
import { ThemeMenu } from './ThemeMenu';

export function TopBar() {
  const projects = useStore((s) => s.projects);
  const openCreate = useUi((s) => s.openCreate);
  const match = useMatch('/p/:projectKey/*');
  const currentProject = projects.find((p) => p.key === match?.params.projectKey?.toUpperCase());

  return (
    <header className="topbar">
      <Link to="/" className="logo" aria-label="Jira Clone – projekty">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2684ff" />
              <stop offset="1" stopColor="#0052cc" />
            </linearGradient>
          </defs>
          <path
            d="M21.6 11.3L12.7 2.4 12 1.7 2.4 11.3a1 1 0 000 1.4l6.1 6.1L12 22.3l9.6-9.6a1 1 0 000-1.4zM12 15l-3-3 3-3 3 3-3 3z"
            fill="url(#logo-gradient)"
          />
        </svg>
        <span>Jira Clone</span>
      </Link>
      <nav className="topbar-nav" aria-label="Główna nawigacja">
        <NavLink to="/" end className="topbar-link">
          Projekty
        </NavLink>
        <NavLink to="/team" className="topbar-link">
          Zespół
        </NavLink>
      </nav>
      <button
        type="button"
        className="btn btn-primary"
        disabled={projects.length === 0}
        title={projects.length === 0 ? 'Najpierw utwórz projekt' : undefined}
        onClick={() => openCreate({ projectId: currentProject?.id })}
      >
        <PlusIcon /> Utwórz
      </button>
      <div className="topbar-spacer" />
      <DataMenu />
      <ThemeMenu />
    </header>
  );
}
