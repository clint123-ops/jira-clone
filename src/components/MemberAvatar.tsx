import { initials } from '../gamification';
import type { Member } from '../types';
import { AVATAR_COLORS } from '../utils';

interface MemberAvatarProps {
  member: Pick<Member, 'name' | 'colorIndex'>;
  size?: number;
  /** Accessible name; without it the avatar is decorative (the name is shown next to it). */
  label?: string;
}

export function MemberAvatar({ member, size = 24, label }: MemberAvatarProps) {
  const background = AVATAR_COLORS[member.colorIndex % AVATAR_COLORS.length];
  return (
    <span
      className="member-avatar"
      {...(label ? { role: 'img', 'aria-label': label, title: label } : { 'aria-hidden': true })}
      style={{ width: size, height: size, fontSize: size * 0.42, background }}
    >
      {initials(member.name)}
    </span>
  );
}
