import { useEffect } from 'react';
import { issueXp, levelInfo, totalXpOf } from '../gamification';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { issueKey, localDateString } from '../utils';

/** Shows a toast with the XP earned whenever an assigned issue is moved to "done". */
export function useXpNotifications() {
  useEffect(
    () =>
      useStore.subscribe((state, prev) => {
        if (state.issues === prev.issues) return;
        const before = new Map(prev.issues.map((i) => [i.id, i]));
        const completed = state.issues.filter((i) => {
          const old = before.get(i.id);
          return old && old.status !== 'done' && i.status === 'done' && i.assigneeId;
        });
        // Bulk changes (import, sample data) are not a single completion – stay quiet.
        if (completed.length !== 1) return;

        const issue = completed[0];
        const member = state.members.find((m) => m.id === issue.assigneeId);
        const project = state.projects.find((p) => p.id === issue.projectId);
        if (!member || !project) return;

        const today = localDateString();
        const key = issueKey(project, issue);
        const xp = issueXp(issue, today).total;
        const levelBefore = levelInfo(totalXpOf(member.id, prev.issues, today)).level;
        const levelAfter = levelInfo(totalXpOf(member.id, state.issues, today)).level;
        const message =
          levelAfter > levelBefore
            ? `+${xp} XP dla: ${member.name}. Awans na poziom ${levelAfter}!`
            : `+${xp} XP dla: ${member.name} za ${key}`;
        useUi.getState().showToast(message, key, 'xp');
      }),
    [],
  );
}
