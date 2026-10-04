import { Outlet } from 'react-router';
import { useXpNotifications } from '../hooks/useXpNotifications';
import { CreateIssueDialog } from './CreateIssueDialog';
import { IssueModal } from './IssueModal';
import { Toast } from './Toast';
import { TopBar } from './TopBar';

export function AppLayout() {
  useXpNotifications();
  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      <CreateIssueDialog />
      <IssueModal />
      <Toast />
    </div>
  );
}
