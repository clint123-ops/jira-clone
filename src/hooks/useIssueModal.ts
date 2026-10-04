import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/** The open issue lives in the URL (?issue=FAV-12), so it survives a reload and can be linked. */
export function useIssueModal() {
  const [params, setParams] = useSearchParams();

  const openIssue = useCallback(
    (key: string) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('issue', key);
        return next;
      }),
    [setParams],
  );

  const closeIssue = useCallback(
    () =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('issue');
        return next;
      }),
    [setParams],
  );

  return { issueKey: params.get('issue'), openIssue, closeIssue };
}
