import type { SVGProps } from 'react';
import { PRIORITY_COLOR, PRIORITY_LABEL, TYPE_COLOR, TYPE_LABEL } from '../constants';
import type { IssueType, Priority } from '../types';

export function TypeIcon({ type, size = 16 }: { type: IssueType; size?: number }) {
  return (
    <svg className="type-icon" width={size} height={size} viewBox="0 0 16 16" role="img">
      <title>{TYPE_LABEL[type]}</title>
      <rect width="16" height="16" rx="3" fill={TYPE_COLOR[type]} />
      {type === 'task' && (
        <path
          d="M4.5 8.3l2.3 2.3 4.7-5"
          stroke="#fff"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {type === 'bug' && <circle cx="8" cy="8" r="3.2" fill="#fff" />}
      {type === 'story' && <path d="M5 3.5h6v9l-3-2.2-3 2.2z" fill="#fff" />}
      {type === 'epic' && <path d="M9.2 2.8L4.8 9h3l-1 4.2L11.2 7h-3z" fill="#fff" />}
    </svg>
  );
}

const PRIORITY_PATH: Record<Priority, string> = {
  highest: 'M3.5 8L8 3.5 12.5 8M3.5 12.5L8 8l4.5 4.5',
  high: 'M3.5 10.5L8 6l4.5 4.5',
  medium: 'M3.5 6h9M3.5 10h9',
  low: 'M3.5 5.5L8 10l4.5-4.5',
  lowest: 'M3.5 3.5L8 8l4.5-4.5M3.5 8L8 12.5 12.5 8',
};

export function PriorityIcon({ priority, size = 16 }: { priority: Priority; size?: number }) {
  return (
    <svg className="priority-icon" width={size} height={size} viewBox="0 0 16 16" role="img">
      <title>{`Priorytet: ${PRIORITY_LABEL[priority]}`}</title>
      <path
        d={PRIORITY_PATH[priority]}
        stroke={PRIORITY_COLOR[priority]}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);
export const BoardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M6 2.5v11M10 2.5v11" />
  </svg>
);
export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
  </svg>
);
export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M3.6 12.4l1.2-1.2M11.2 4.8l1.2-1.2" />
  </svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4" />
  </svg>
);
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5 1.8v2.4M11 1.8v2.4" />
  </svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M5.3 8.2l1.8 1.8 3.6-3.8" />
  </svg>
);
export const DatabaseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <ellipse cx="8" cy="3.8" rx="5.5" ry="2" />
    <path d="M2.5 3.8v8.4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.8M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" />
  </svg>
);
