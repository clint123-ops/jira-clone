import type { AppData, Issue, IssueType, Priority, Project, Status } from './types';
import { localDateString, uid } from './utils';

interface SampleIssue {
  title: string;
  description?: string;
  type: IssueType;
  priority: Priority;
  status: Status;
  labels?: string[];
  /** Due date relative to today, in days. */
  dueIn?: number;
  /** How many days ago the issue was created. */
  age: number;
  comments?: string[];
}

export function createSampleData(): AppData {
  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

  const fav: Project = {
    id: uid(),
    key: 'FAV',
    name: 'FaveUp',
    description: 'Główna aplikacja FaveUp – program lojalnościowy dla klientów.',
    createdAt: daysAgo(30),
    issueCounter: 0,
  };
  const web: Project = {
    id: uid(),
    key: 'WEB',
    name: 'Strona firmowa',
    description: 'Nowa wersja strony internetowej.',
    createdAt: daysAgo(14),
    issueCounter: 0,
  };

  const issues: Issue[] = [];
  const add = (project: Project, s: SampleIssue) => {
    project.issueCounter += 1;
    const createdAt = daysAgo(s.age);
    issues.push({
      id: uid(),
      projectId: project.id,
      number: project.issueCounter,
      title: s.title,
      description: s.description ?? '',
      type: s.type,
      priority: s.priority,
      status: s.status,
      labels: s.labels ?? [],
      dueDate: s.dueIn === undefined ? null : localDateString(s.dueIn),
      order: issues.filter((i) => i.projectId === project.id && i.status === s.status).length,
      createdAt,
      updatedAt: createdAt,
      comments: (s.comments ?? []).map((body) => ({ id: uid(), body, createdAt })),
      history: [{ id: uid(), at: createdAt, field: 'created', from: null, to: null }],
    });
  };

  add(fav, {
    title: 'Panel klienta',
    description: 'Epic zbierający wszystkie funkcje panelu, w którym klient widzi swoje punkty i nagrody.',
    type: 'epic',
    priority: 'high',
    status: 'todo',
    age: 28,
  });
  add(fav, {
    title: 'Skonfigurować CI dla repozytorium',
    description: 'Testy i build uruchamiane automatycznie przy każdym pushu.',
    type: 'task',
    priority: 'medium',
    status: 'done',
    labels: ['devops'],
    age: 27,
  });
  add(fav, {
    title: 'Jako użytkownik chcę zapisywać ulubione miejsca',
    description: 'Serduszko przy lokalu dodaje go do listy ulubionych, widocznej w profilu.',
    type: 'story',
    priority: 'high',
    status: 'in_progress',
    labels: ['frontend'],
    dueIn: 4,
    age: 20,
    comments: ['Projekt ikonki jest już w Figmie.'],
  });
  add(fav, {
    title: 'Logowanie nie działa w Safari',
    description: 'Po kliknięciu „Zaloguj” strona się odświeża i nic się nie dzieje. Tylko Safari 18.',
    type: 'bug',
    priority: 'highest',
    status: 'in_review',
    labels: ['frontend'],
    dueIn: -1,
    age: 6,
  });
  add(fav, {
    title: 'Zaprojektować ekran profilu',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    labels: ['design'],
    dueIn: 7,
    age: 12,
  });
  add(fav, {
    title: 'Powiadomienia push o nowych ofertach',
    type: 'story',
    priority: 'medium',
    status: 'todo',
    labels: ['mobile'],
    age: 10,
  });
  add(fav, {
    title: 'Błędne sumowanie punktów lojalnościowych',
    description: 'Przy dwóch transakcjach w tej samej minucie punkty liczą się tylko raz.',
    type: 'bug',
    priority: 'high',
    status: 'in_progress',
    labels: ['backend'],
    dueIn: 2,
    age: 5,
  });
  add(fav, {
    title: 'Dodać testy jednostkowe dla API punktów',
    type: 'task',
    priority: 'low',
    status: 'todo',
    labels: ['backend'],
    age: 4,
  });
  add(fav, {
    title: 'Aktualizacja zależności',
    type: 'task',
    priority: 'lowest',
    status: 'done',
    labels: ['devops'],
    age: 9,
  });
  add(fav, {
    title: 'Eksport historii transakcji do CSV',
    type: 'story',
    priority: 'medium',
    status: 'in_review',
    labels: ['backend'],
    age: 8,
  });
  add(fav, {
    title: 'Przygotować teksty do onboardingu',
    type: 'task',
    priority: 'low',
    status: 'todo',
    labels: ['content'],
    age: 3,
  });
  add(fav, {
    title: 'Literówka na ekranie powitalnym',
    type: 'bug',
    priority: 'lowest',
    status: 'done',
    labels: ['frontend'],
    age: 2,
  });

  add(web, {
    title: 'Nowa strona główna',
    type: 'task',
    priority: 'high',
    status: 'in_progress',
    labels: ['design'],
    dueIn: 10,
    age: 12,
  });
  add(web, { title: 'Formularz kontaktowy', type: 'task', priority: 'medium', status: 'todo', age: 7 });
  add(web, { title: 'Zepsuty link w stopce', type: 'bug', priority: 'low', status: 'todo', age: 1 });

  return { projects: [fav, web], issues };
}
