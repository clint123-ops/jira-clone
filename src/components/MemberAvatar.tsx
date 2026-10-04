import { initials } from '../gamification';
import { useStore } from '../store';
import type { Member } from '../types';
import { AVATAR_COLORS } from '../utils';

interface MemberAvatarProps {
  member: Pick<Member, 'id' | 'name'>;
  size?: number;
  /** Accessible name; without it the avatar is decorative (the name is shown next to it). */
  label?: string;
}

export function MemberAvatar({ member, size = 24, label }: MemberAvatarProps) {
  // Colour by position in the team, so the first members never share a colour (a hash of id/name would).
  const index = useStore((s) => s.members.findIndex((m) => m.id === member.id));
  const background = AVATAR_COLORS[Math.max(index, 0) % AVATAR_COLORS.length];
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
