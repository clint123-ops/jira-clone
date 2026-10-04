import { useStore } from '../store';
import { UserIcon } from './Icons';
import { MemberAvatar } from './MemberAvatar';

interface AssigneeSelectProps {
  value: string | null;
  onChange: (assigneeId: string | null) => void;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function AssigneeSelect({ value, onChange, className = 'input', ...rest }: AssigneeSelectProps) {
  const members = useStore((s) => s.members);
  const assignee = members.find((m) => m.id === value);
  return (
    <div className="select-with-icon">
      {assignee ? <MemberAvatar member={assignee} size={18} /> : <UserIcon className="unassigned-icon" />}
      <select
        className={className}
        value={assignee?.id ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        {...rest}
      >
        <option value="">Nieprzypisane</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
