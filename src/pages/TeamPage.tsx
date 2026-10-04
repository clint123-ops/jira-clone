import { useId, useMemo, useState, type FormEvent } from 'react';
import { TrashIcon } from '../components/Icons';
import { MemberAvatar } from '../components/MemberAvatar';
import { PRIORITIES, PRIORITY_LABEL, TYPE_LABEL, ISSUE_TYPES } from '../constants';
import {
  BADGES,
  ON_TIME_BONUS,
  PRIORITY_XP,
  TYPE_XP,
  memberStats,
  xpForLevel,
  type MemberStats,
} from '../gamification';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { localDateString, pluralIssues } from '../utils';

type Period = 'week' | 'month' | 'all';

const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: 'week', label: '7 dni', days: 7 },
  { id: 'month', label: '30 dni', days: 30 },
  { id: 'all', label: 'Cały czas', days: null },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const MAX_NAME_LENGTH = 60;

export function TeamPage() {
  const members = useStore((s) => s.members);
  const issues = useStore((s) => s.issues);
  const [period, setPeriod] = useState<Period>('week');

  const stats = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)!.days;
    const since = days === null ? null : new Date(Date.now() - days * 86_400_000).toISOString();
    return memberStats(members, issues, since, localDateString());
  }, [members, issues, period]);

  const teamXp = stats.reduce((sum, s) => sum + s.periodXp, 0);
  const teamDone = stats.reduce((sum, s) => sum + s.periodDone, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Zespół</h1>
      </div>
      <p className="page-intro">
        Kończcie zadania, zdobywajcie XP i odznaki. XP dostaje osoba przypisana do zadania, gdy trafi ono do kolumny
        „Gotowe”.
      </p>

      <div className="team-layout">
        <section className="team-main" aria-labelledby="ranking-heading">
          <div className="ranking-header">
            <h2 id="ranking-heading">Ranking</h2>
            <div className="segmented" role="group" aria-label="Okres rankingu">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`segmented-btn${period === p.id ? ' is-active' : ''}`}
                  aria-pressed={period === p.id}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <h2>Brak członków zespołu</h2>
              <p>Dodaj osoby w panelu „Członkowie zespołu”, a potem przypisuj je do zadań.</p>
            </div>
          ) : (
            <>
              <div className="team-stats">
                <div className="stat-tile">
                  <div className="stat-value">{teamXp} XP</div>
                  <div className="stat-label">zdobyte przez zespół</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-value">{teamDone}</div>
                  <div className="stat-label">ukończone zadania</div>
                </div>
              </div>
              <ol className="leaderboard">
                {stats.map((s) => (
                  <LeaderboardRow key={s.member.id} stats={s} rank={rankOf(stats, s)} />
                ))}
              </ol>
            </>
          )}
        </section>

        <aside className="team-side">
          <MembersCard />
          <RulesCard />
        </aside>
      </div>
    </div>
  );
}

/** Competition ranking: members with the same XP share a place. */
const rankOf = (stats: MemberStats[], s: MemberStats) => stats.findIndex((x) => x.periodXp === s.periodXp) + 1;

function LeaderboardRow({ stats, rank }: { stats: MemberStats; rank: number }) {
  const { member, level, periodXp, periodDone, badges } = stats;
  const percent = Math.round((level.current / level.needed) * 100);
  const medal = periodXp > 0 ? MEDALS[rank - 1] : undefined;

  return (
    <li className="leaderboard-row">
      <span className="leaderboard-rank">
        {medal ? (
          <span role="img" aria-label={`Miejsce ${rank}`}>
            {medal}
          </span>
        ) : (
          <>
            <span className="sr-only">Miejsce </span>
            {rank}
          </>
        )}
      </span>
      <MemberAvatar member={member} size={36} />
      <div className="leaderboard-person">
        <div className="leaderboard-name">{member.name}</div>
        <div className="leaderboard-level">
          Poziom {level.level} · {level.title}
        </div>
        <div
          className="level-bar"
          role="progressbar"
          aria-label={`Postęp do poziomu ${level.level + 1}`}
          aria-valuemin={0}
          aria-valuemax={level.needed}
          aria-valuenow={level.current}
          aria-valuetext={`${level.current} z ${level.needed} XP`}
        >
          <div className="level-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="level-bar-caption">
          {level.current} / {level.needed} XP do poziomu {level.level + 1}
        </div>
      </div>
      <ul className="badge-list" aria-label="Odznaki">
        {badges.map((b) => (
          <li key={b.id} className="badge" title={`${b.name}: ${b.description}`}>
            <span aria-hidden="true">{b.icon}</span>
            <span className="sr-only">{b.name}</span>
          </li>
        ))}
      </ul>
      <div className="leaderboard-score">
        <div className="leaderboard-xp">{periodXp} XP</div>
        <div className="leaderboard-done">{pluralIssues(periodDone)}</div>
      </div>
    </li>
  );
}

function MembersCard() {
  const members = useStore((s) => s.members);
  const issues = useStore((s) => s.issues);
  const addMember = useStore((s) => s.addMember);
  const deleteMember = useStore((s) => s.deleteMember);
  const showToast = useUi((s) => s.showToast);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setError('Podaj imię i nazwisko.');
      return;
    }
    if (members.some((m) => m.name.toLocaleLowerCase('pl') === trimmed.toLocaleLowerCase('pl'))) {
      setError('Ta osoba jest już w zespole.');
      return;
    }
    addMember(trimmed);
    setName('');
    showToast(`Dodano do zespołu: ${trimmed}`);
  };

  const handleDelete = (id: string, memberName: string) => {
    const assigned = issues.filter((i) => i.assigneeId === id).length;
    const details =
      assigned > 0 ? ` Przypisane zadania (${assigned}) zostaną nieprzypisane, a zdobyte XP przepadnie.` : '';
    if (!window.confirm(`Usunąć z zespołu: ${memberName}?${details}`)) return;
    deleteMember(id);
    showToast(`Usunięto z zespołu: ${memberName}`);
  };

  return (
    <section className="card" aria-labelledby="members-heading">
      <h2 id="members-heading">Członkowie zespołu</h2>
      <form className="member-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor={inputId}>
            Imię i nazwisko
          </label>
          <div className="member-form-row">
            <input
              id={inputId}
              className={`input${error ? ' has-error' : ''}`}
              value={name}
              maxLength={MAX_NAME_LENGTH}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
            />
            <button type="submit" className="btn btn-primary">
              Dodaj
            </button>
          </div>
          {error && (
            <span id={errorId} className="field-error">
              {error}
            </span>
          )}
        </div>
      </form>
      {members.length === 0 ? (
        <p className="muted member-empty">Zespół jest pusty.</p>
      ) : (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id} className="member-item">
              <MemberAvatar member={m} size={28} />
              <span className="member-name">{m.name}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Usuń z zespołu: ${m.name}`}
                onClick={() => handleDelete(m.id, m.name)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RulesCard() {
  return (
    <section className="card rules-card" aria-labelledby="rules-heading">
      <h2 id="rules-heading">Jak zdobywać XP</h2>
      <p>XP za zadanie = typ + priorytet. Ukończenie najpóźniej w dniu terminu daje +{ON_TIME_BONUS * 100}%.</p>
      <div className="rules-grid">
        <table className="rules-table">
          <caption className="sr-only">XP za typ zadania</caption>
          <thead>
            <tr>
              <th scope="col">Typ</th>
              <th scope="col">XP</th>
            </tr>
          </thead>
          <tbody>
            {ISSUE_TYPES.map((t) => (
              <tr key={t}>
                <td>{TYPE_LABEL[t]}</td>
                <td>{TYPE_XP[t]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="rules-table">
          <caption className="sr-only">XP za priorytet</caption>
          <thead>
            <tr>
              <th scope="col">Priorytet</th>
              <th scope="col">XP</th>
            </tr>
          </thead>
          <tbody>
            {PRIORITIES.map((p) => (
              <tr key={p}>
                <td>{PRIORITY_LABEL[p]}</td>
                <td>+{PRIORITY_XP[p]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Poziomy rosną coraz wolniej: poziom 2 od {xpForLevel(2)} XP, 3 od {xpForLevel(3)} XP, 4 od {xpForLevel(4)} XP.
        Cofnięcie zadania z „Gotowe” odbiera XP.
      </p>
      <h3 className="rules-subheading">Odznaki</h3>
      <ul className="rules-badges">
        {BADGES.map((b) => (
          <li key={b.id}>
            <span className="rules-badge-icon" aria-hidden="true">
              {b.icon}
            </span>
            <span>
              <strong>{b.name}</strong> – {b.description}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
