import { useEffect } from 'react';
import { levelInfo, totalXpOf } from '../gamification';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { issueKey } from '../utils';

/** Shows a toast with the XP earned whenever an assigned issue is moved to "done". */
export function useXpNotifications() {
  useEffect(
    () =>
      useStore.subscribe((state, prev) => {
        if (state.issues === prev.issues) return;
        // Status changes never touch projects; import, sample data and clearing replace them – stay quiet.
        if (state.projects !== prev.projects) return;
        const before = new Map(prev.issues.map((i) => [i.id, i]));
        const completed = state.issues.filter((i) => {
          const old = before.get(i.id);
          return old && old.status !== 'done' && i.xpAward;
        });
        if (completed.length !== 1) return;

        const issue = completed[0];
        const award = issue.xpAward!;
        const member = state.members.find((m) => m.id === award.memberId);
        const project = state.projects.find((p) => p.id === issue.projectId);
        if (!member || !project) return;

        const key = issueKey(project, issue);
        const xp = award.xp;
        const levelBefore = levelInfo(totalXpOf(member.id, prev.issues)).level;
        const levelAfter = levelInfo(totalXpOf(member.id, state.issues)).level;
        const message =
          levelAfter > levelBefore
            ? `+${xp} XP dla: ${member.name}. Awans na poziom ${levelAfter}!`
            : `+${xp} XP dla: ${member.name} za ${key}`;
        useUi.getState().showToast(message, key, 'xp');
      }),
    [],
  );
}
