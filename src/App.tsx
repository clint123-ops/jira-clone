import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { ProjectLayout } from './components/ProjectLayout';
import { BacklogPage } from './pages/BacklogPage';
import { BoardPage } from './pages/BoardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TeamPage } from './pages/TeamPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProjectsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="p/:projectKey" element={<ProjectLayout />}>
          <Route index element={<Navigate to="board" replace />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="settings" element={<ProjectSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
