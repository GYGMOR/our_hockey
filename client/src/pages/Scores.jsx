// Startseite: Spiele & Live-Resultate eines Tages
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { todayISO, addDays, dayLabel, dayMonth, longDate, isNextDayCH } from '../lib/format.js';
import { useFavorites } from '../lib/favorites.js';
import GameCard from '../components/GameCard.jsx';
import { Spinner, ErrorBox, Tabs, LiveBadge } from '../components/ui.jsx';

function DateStrip({ date, onChange }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(addDays(date, -1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-300 hover:text-white" aria-label="Vorheriger Tag">‹</button>
      <div className="no-scrollbar flex flex-1 justify-between gap-1 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`flex min-w-[52px] flex-1 flex-col items-center rounded-xl py-1.5 transition ${d === date ? 'bg-accent text-white' : 'text-ink-300 hover:bg-ink-800'}`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">{dayLabel(d)}</span>
            <span className="font-display text-lg font-bold leading-tight">{dayMonth(d)}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onChange(addDays(date, 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-300 hover:text-white" aria-label="Nächster Tag">›</button>
    </div>
  );
}

function Section({ title, subtitle, games, error }) {
  if (!games.length && !error) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
        {subtitle && <span className="text-xs text-ink-400">{subtitle}</span>}
      </div>
      {error && <ErrorBox error={{ message: error }} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => <GameCard key={`${g.league}-${g.id}`} game={g} />)}
      </div>
    </section>
  );
}

export default function Scores() {
  const [params, setParams] = useSearchParams();
  const date = params.get('datum') || todayISO();
  const setDate = (d) => setParams(d === todayISO() ? {} : { datum: d });
  const [filter, setFilter] = useState('all');
  const { gameHasFav } = useFavorites();

  // Heute: alle 30s automatisch aktualisieren
  const { data, error, loading, reload } = useApi(`/scores?date=${date}`, date === todayISO() ? 30_000 : 0);

  const { nl, nhl, liveCount, favCount } = useMemo(() => {
    // Sortierung: laufende Spiele zuerst, danach nach Anspielzeit
    const isLive = (g) => (g.status === 'live' ? 0 : 1);
    const byStart = (a, b) => isLive(a) - isLive(b) || a.start.localeCompare(b.start);
    const nlGames = [...(data?.leagues.NL.games ?? [])].sort(byStart);
    const nhlGames = [...(data?.leagues.NHL.games ?? [])].sort(byStart);
    const all = [...nlGames, ...nhlGames];
    return {
      nl: nlGames,
      nhl: nhlGames,
      liveCount: all.filter((g) => g.status === 'live').length,
      favCount: all.filter(gameHasFav).length,
    };
  }, [data, gameHasFav]);

  const pick = (games) => (filter === 'fav' ? games.filter(gameHasFav) : filter === 'live' ? games.filter((g) => g.status === 'live') : games);
  const showNL = filter !== 'nhl';
  const showNHL = filter !== 'nl';
  const nlShown = showNL ? pick(nl) : [];
  const nhlShown = showNHL ? pick(nhl) : [];
  const nhlNight = nhl.some((g) => isNextDayCH(g.start, date));

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Spiele</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{longDate(date)}</h1>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-ink-300">
              <LiveBadge /> {liveCount} {liveCount === 1 ? 'Spiel läuft' : 'Spiele laufen'}
            </div>
          )}
        </div>
        <DateStrip date={date} onChange={setDate} />
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'live', label: 'Live', count: liveCount },
            { value: 'nl', label: 'National League', count: nl.length },
            { value: 'nhl', label: 'NHL', count: nhl.length },
            { value: 'fav', label: '★ Favoriten', count: favCount },
          ]}
        />
      </div>

      {data?.mock && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Mock-Modus: Es werden Beispieldaten angezeigt (npm run dev:mock).
        </div>
      )}

      {loading && !data && <Spinner />}
      {error && !data && <ErrorBox error={error} onRetry={reload} />}

      {data && (
        <>
          {showNL && <Section title="National League" games={nlShown} error={data.leagues.NL.error} />}
          {showNHL && (
            <Section
              title="NHL"
              subtitle={nhlNight ? 'Nacht auf ' + dayMonth(addDays(date, 1)) + ' · Schweizer Zeit' : 'Schweizer Zeit'}
              games={nhlShown}
              error={data.leagues.NHL.error}
            />
          )}
          {!nlShown.length && !nhlShown.length && (
            <div className="rounded-2xl border border-white/5 bg-ink-800/50 px-6 py-14 text-center text-ink-400">
              <p className="font-display text-2xl font-bold text-ink-300">Keine Spiele</p>
              <p className="mt-1 text-sm">
                {filter === 'fav' ? 'Markiere Teams in der Tabelle mit einem Stern, um sie hier zu sehen.' : 'An diesem Tag ist nichts los. Wähle einen anderen Tag.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
