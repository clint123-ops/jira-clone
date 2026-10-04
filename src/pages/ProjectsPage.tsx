import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PlusIcon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { ProjectAvatar } from '../components/ProjectAvatar';
import { ProjectForm } from '../components/ProjectForm';
import { useStore } from '../store';
import { formatDate } from '../utils';

export function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);
  const createProject = useStore((s) => s.createProject);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>();
    for (const i of issues) {
      const s = map.get(i.projectId) ?? { total: 0, open: 0 };
      s.total += 1;
      if (i.status !== 'done') s.open += 1;
      map.set(i.projectId, s);
    }
    return map;
  }, [issues]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projekty</h1>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          <PlusIcon /> Utwórz projekt
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>Nie masz jeszcze projektów</h2>
          <p>Utwórz pierwszy projekt albo wczytaj przykładowe dane z menu „Dane”.</p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            Utwórz projekt
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Klucz</th>
                <th>Zadania</th>
                <th>Otwarte</th>
                <th>Utworzono</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const s = stats.get(p.id) ?? { total: 0, open: 0 };
                return (
                  <tr key={p.id} className="table-row-link" onClick={() => navigate(`/p/${p.key}/board`)}>
                    <td>
                      <div className="project-cell">
                        <ProjectAvatar project={p} />
                        <div>
                          <Link
                            to={`/p/${p.key}/board`}
                            className="project-cell-name"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.name}
                          </Link>
                          {p.description && <div className="project-cell-desc">{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{p.key}</td>
                    <td>{s.total}</td>
                    <td>{s.open}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td className="table-actions">
                      <Link to={`/p/${p.key}/backlog`} className="btn-link" onClick={(e) => e.stopPropagation()}>
                        Backlog
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal onClose={() => setCreating(false)} label="Utwórz projekt">
          <div className="modal-header">
            <h2>Utwórz projekt</h2>
          </div>
          <div className="modal-body">
            <ProjectForm
              autoFocus
              submitLabel="Utwórz projekt"
              footerExtra={
                <button type="button" className="btn btn-subtle" onClick={() => setCreating(false)}>
                  Anuluj
                </button>
              }
              onSubmit={(values) => {
                const project = createProject(values);
                setCreating(false);
                navigate(`/p/${project.key}/board`);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
