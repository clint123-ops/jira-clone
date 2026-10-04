import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/** Otwarte zadanie trzymamy w adresie (?issue=FAV-12), więc da się je odświeżyć i podlinkować. */
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
