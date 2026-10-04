import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { potentialXp } from '../gamification';
import { useStore } from '../store';
import type { Issue } from '../types';
import { formatDate, isOverdue, localDateString } from '../utils';
import { CalendarIcon, PriorityIcon, StarIcon, TypeIcon } from './Icons';
import { MemberAvatar } from './MemberAvatar';

interface IssueCardProps {
  issue: Issue;
  issueKey: string;
  overlay?: boolean;
  onOpen?: () => void;
}

export function IssueCard({ issue, issueKey, overlay, onOpen }: IssueCardProps) {
  const assignee = useStore((s) => s.members.find((m) => m.id === issue.assigneeId));
  // Done issues show what was actually earned (nothing if nobody was assigned at completion).
  const xp = issue.status === 'done' ? issue.xpAward?.xp : potentialXp(issue, localDateString()).total;
  const xpLabel = issue.status === 'done' ? 'zdobyte' : 'za ukończenie';
  return (
    <div className={`issue-card${overlay ? ' is-overlay' : ''}`} onClick={onOpen}>
      <div className="issue-card-title">{issue.title}</div>
      <div className="issue-card-labels">
        {xp !== undefined && (
          <span className="xp-chip" title={`XP ${xpLabel}`}>
            <StarIcon width={11} height={11} />
            {xp} XP<span className="sr-only"> {xpLabel}</span>
          </span>
        )}
        {issue.labels.map((l) => (
          <span key={l} className="label-chip">
            {l}
          </span>
        ))}
      </div>
      <div className="issue-card-footer">
        <TypeIcon type={issue.type} />
        <span className={`issue-key${issue.status === 'done' ? ' is-done' : ''}`}>{issueKey}</span>
        <span className="issue-card-spacer" />
        {issue.dueDate && (
          <span className={`due-badge${isOverdue(issue) ? ' is-overdue' : ''}`} title="Termin">
            <CalendarIcon width={12} height={12} />
            {formatDate(issue.dueDate)}
          </span>
        )}
        <PriorityIcon priority={issue.priority} />
        {assignee && <MemberAvatar member={assignee} size={20} label={`Osoba: ${assignee.name}`} />}
      </div>
    </div>
  );
}

export function SortableIssueCard(props: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.issue.id,
  });
  return (
    <div
      ref={setNodeRef}
      className={`sortable-card${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !isDragging) props.onOpen?.();
      }}
      aria-label={`${props.issueKey}: ${props.issue.title}`}
    >
      <IssueCard {...props} />
    </div>
  );
}
