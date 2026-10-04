import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Issue } from '../types';
import { formatDate, isOverdue } from '../utils';
import { CalendarIcon, PriorityIcon, TypeIcon } from './Icons';

interface IssueCardProps {
  issue: Issue;
  issueKey: string;
  overlay?: boolean;
  onOpen?: () => void;
}

export function IssueCard({ issue, issueKey, overlay, onOpen }: IssueCardProps) {
  return (
    <div className={`issue-card${overlay ? ' is-overlay' : ''}`} onClick={onOpen}>
      <div className="issue-card-title">{issue.title}</div>
      {issue.labels.length > 0 && (
        <div className="issue-card-labels">
          {issue.labels.map((l) => (
            <span key={l} className="label-chip">
              {l}
            </span>
          ))}
        </div>
      )}
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
