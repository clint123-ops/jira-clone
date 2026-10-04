import type { Project } from '../types';
import { projectColor } from '../utils';

export function ProjectAvatar({ project, size = 24 }: { project: Pick<Project, 'key' | 'name'>; size?: number }) {
  return (
    <span
      className="project-avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: projectColor(project.key),
      }}
    >
      {(project.name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}
