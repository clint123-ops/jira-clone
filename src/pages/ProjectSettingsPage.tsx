import { Link, useNavigate } from 'react-router';
import { useProjectContext } from '../components/ProjectLayout';
import { ProjectForm } from '../components/ProjectForm';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { pluralIssues } from '../utils';

export function ProjectSettingsPage() {
  const { project } = useProjectContext();
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const issueCount = useStore((s) => s.issues.filter((i) => i.projectId === project.id).length);
  const showToast = useUi((s) => s.showToast);
  const navigate = useNavigate();

  const handleDelete = () => {
    const ok = window.confirm(
      `Usunąć projekt „${project.name}” razem z ${pluralIssues(issueCount)}? Tej operacji nie można cofnąć.`,
    );
    if (!ok) return;
    navigate('/');
    deleteProject(project.id);
    showToast(`Usunięto projekt ${project.name}.`);
  };

  return (
    <div className="page page-narrow">
      <nav className="page-breadcrumbs">
        <Link to="/">Projekty</Link> / <span>{project.name}</span>
      </nav>
      <div className="page-header">
        <h1>Ustawienia projektu</h1>
      </div>

      <section className="card">
        <h2>Szczegóły</h2>
        <ProjectForm
          key={project.id}
          initial={project}
          editingId={project.id}
          submitLabel="Zapisz zmiany"
          onSubmit={(values) => {
            updateProject(project.id, values);
            showToast('Zapisano zmiany.');
            if (values.key !== project.key) navigate(`/p/${values.key}/settings`, { replace: true });
          }}
        />
      </section>

      <section className="card card-danger">
        <h2>Usuń projekt</h2>
        <p>Projekt i wszystkie jego zadania ({pluralIssues(issueCount)}) zostaną trwale usunięte.</p>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Usuń projekt
        </button>
      </section>
    </div>
  );
}
