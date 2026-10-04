import { useEffect } from 'react';
import { useIssueModal } from '../hooks/useIssueModal';
import { useUi } from '../uiStore';
import { CheckCircleIcon, CloseIcon, StarIcon } from './Icons';

export function Toast() {
  const toast = useUi((s) => s.toast);
  const hideToast = useUi((s) => s.hideToast);
  const { openIssue } = useIssueModal();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(hideToast, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      {toast.kind === 'xp' ? <StarIcon className="toast-icon" /> : <CheckCircleIcon className="toast-icon" />}
      <div className="toast-body">
        <div>{toast.message}</div>
        {toast.issueKey && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              openIssue(toast.issueKey!);
              hideToast();
            }}
          >
            Pokaż zadanie
          </button>
        )}
      </div>
      <button type="button" className="icon-btn" aria-label="Zamknij" onClick={hideToast}>
        <CloseIcon />
      </button>
    </div>
  );
}
