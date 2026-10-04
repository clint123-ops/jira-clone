import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo, useState, type ReactNode } from 'react';
import { STATUSES, STATUS_LABEL } from '../constants';
import { useIssueModal } from '../hooks/useIssueModal';
import { useStore } from '../store';
import type { Issue, Project, Status } from '../types';
import { useUi } from '../uiStore';
import { issueKey } from '../utils';
import { PlusIcon } from './Icons';
import { IssueCard, SortableIssueCard } from './IssueCard';

type Columns = Record<Status, string[]>;

interface BoardProps {
  project: Project;
  /** Project issues after filtering. */
  issues: Issue[];
}

const isStatus = (id: UniqueIdentifier): id is Status => STATUSES.includes(id as Status);

function findColumn(columns: Columns, id: UniqueIdentifier): Status | undefined {
  if (isStatus(id)) return id;
  return STATUSES.find((s) => columns[s].includes(id as string));
}

export function Board({ project, issues }: BoardProps) {
  const moveIssue = useStore((s) => s.moveIssue);
  const { openIssue } = useIssueModal();

  const issuesById = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);
  const baseColumns = useMemo(() => {
    const columns = Object.fromEntries(STATUSES.map((s) => [s, [] as string[]])) as Columns;
    [...issues].sort((a, b) => a.order - b.order).forEach((i) => columns[i.status].push(i.id));
    return columns;
  }, [issues]);

  // While dragging, keep a local column layout; write to the store only on drop.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const columns = dragColumns ?? baseColumns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space drags, Enter opens the issue.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
    setDragColumns(baseColumns);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragColumns((prev) => {
      const cols = prev ?? baseColumns;
      const from = findColumn(cols, active.id);
      const to = findColumn(cols, over.id);
      if (!from || !to || from === to) return prev;
      const target = cols[to];
      const overIndex = isStatus(over.id) ? target.length : target.indexOf(over.id as string);
      return {
        ...cols,
        [from]: cols[from].filter((id) => id !== active.id),
        [to]: [...target.slice(0, overIndex), active.id as string, ...target.slice(overIndex)],
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const cols = dragColumns ?? baseColumns;
    setActiveId(null);
    setDragColumns(null);
    if (!over) return;

    const status = findColumn(cols, active.id);
    if (!status) return;
    let list = cols[status];
    if (!isStatus(over.id) && over.id !== active.id && list.includes(over.id as string)) {
      list = arrayMove(list, list.indexOf(active.id as string), list.indexOf(over.id as string));
    }
    const index = list.indexOf(active.id as string);
    const beforeId = list[index + 1] ?? null;

    const issue = issuesById.get(active.id as string);
    const original = baseColumns[issue?.status ?? status];
    const unchanged = issue?.status === status && original[original.indexOf(issue.id) + 1] === (beforeId ?? undefined);
    if (!unchanged) moveIssue(active.id as string, status, beforeId);
  };

  const activeIssue = activeId ? issuesById.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragColumns(null);
      }}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <BoardColumn key={status} status={status} projectId={project.id} ids={columns[status]}>
            {columns[status].map((id) => {
              const issue = issuesById.get(id);
              if (!issue) return null;
              const key = issueKey(project, issue);
              return <SortableIssueCard key={id} issue={issue} issueKey={key} onOpen={() => openIssue(key)} />;
            })}
          </BoardColumn>
        ))}
      </div>
      <DragOverlay>
        {activeIssue ? <IssueCard issue={activeIssue} issueKey={issueKey(project, activeIssue)} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface BoardColumnProps {
  status: Status;
  projectId: string;
  ids: string[];
  children: ReactNode;
}

function BoardColumn({ status, projectId, ids, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const openCreate = useUi((s) => s.openCreate);

  return (
    <section className={`board-column${isOver ? ' is-over' : ''}`} aria-label={STATUS_LABEL[status]}>
      <header className="board-column-header">
        <span>{STATUS_LABEL[status]}</span>
        <span className="board-column-count">{ids.length}</span>
      </header>
      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="board-column-cards">
          {children}
        </div>
      </SortableContext>
      <button type="button" className="board-column-add" onClick={() => openCreate({ projectId, status })}>
        <PlusIcon /> Utwórz zadanie
      </button>
    </section>
  );
}
