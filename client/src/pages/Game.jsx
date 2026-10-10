// Spieldetail: Anzeigetafel, Verlauf, Statistiken
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { timeCH, longDate, dateCH } from '../lib/format.js';
import { useFavorites } from '../lib/favorites.js';
import { isSwiss } from '../lib/teams.js';
import { Spinner, ErrorBox, TeamBadge, LiveBadge, LeagueTag, WatchButtons, Tabs, Star } from '../components/ui.jsx';

function Scoreboard({ game }) {
  const { isFav, toggle } = useFavorites();
  const live = game.status === 'live';
  const scheduled = game.status === 'scheduled';
  const dateISO = dateCH(game.start);

  const TeamCol = ({ team }) => (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <TeamBadge team={team} league={game.league} size={72} />
      <div className="flex items-center gap-1.5">
        <span className="font-display text-lg font-bold leading-tight sm:text-2xl">{team.name}</span>
        <Star active={isFav(game.league, team.short)} onClick={() => toggle(game.league, team.short)} size={16} />
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-ink-700 to-ink-800 p-5 sm:p-8">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mb-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-300">
        <LeagueTag league={game.league} />
        <span>{longDate(dateISO)} · {timeCH(game.start)}</span>
        {game.venue && <span>· {game.venue}</span>}
        {game.spectators ? <span>· {Number(game.spectators).toLocaleString('de-CH')} Zuschauer</span> : null}
      </div>
      <div className="relative flex items-start gap-2">
        <TeamCol team={game.home} />
        <div className="flex min-w-[110px] flex-col items-center pt-3">
          {scheduled ? (
            <span className="font-display text-4xl font-bold text-ink-300">{timeCH(game.start)}</span>
          ) : (
            <span className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl">
              {game.home.score ?? 0}<span className="mx-2 text-ink-400">:</span>{game.away.score ?? 0}
            </span>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm">
            {live && <LiveBadge small />}
            <span className={live ? 'font-semibold text-live' : 'text-ink-300'}>{game.statusText}</span>
          </div>
        </div>
        <TeamCol team={game.away} />
      </div>
      {game.status !== 'final' && (
        <div className="relative mt-6 flex justify-center"><WatchButtons game={game} /></div>
      )}
    </div>
  );
}

function PeriodTable({ periods, game }) {
  if (!periods?.length) return null;
  const val = (v) => (v == null ? '–' : v);
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-800/70">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-ink-400">
            <th className="py-2.5 pl-4 text-left">Team</th>
            {periods.map((p) => <th key={p.name} className="px-2 text-center">{p.name.replace('. Drittel', '.').replace(/(\d\. )?Verlängerung/, 'OT')}</th>)}
            <th className="pr-4 text-center text-white">Total</th>
          </tr>
        </thead>
        <tbody>
          {['home', 'away'].map((side) => (
            <tr key={side} className="border-t border-white/5">
              <td className="py-2.5 pl-4 font-semibold">{game[side].short}</td>
              {periods.map((p) => <td key={p.name} className="px-2 text-center text-ink-300">{val(p[side])}</td>)}
              <td className="pr-4 text-center font-bold">{game[side].score ?? '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ events, game }) {
  if (!events.length) {
    return <p className="rounded-2xl bg-ink-800/60 p-6 text-center text-ink-400">Noch keine Ereignisse.</p>;
  }
  const byPeriod = events.reduce((acc, e) => ((acc[e.period] ??= []).push(e), acc), {});
  return (
    <div className="space-y-5">
      {Object.entries(byPeriod).map(([period, list]) => (
        <div key={period}>
          <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-ink-300">{period}</h3>
          <div className="space-y-2">
            {list.map((e, i) => {
              const team = game[e.side];
              const goal = e.type === 'goal';
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${goal ? 'border-accent/30 bg-accent/[0.07]' : 'border-white/5 bg-ink-800/60'} ${e.side === 'away' ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
                  <span className="w-12 shrink-0 text-xs tabular-nums text-ink-400">{e.time}</span>
                  <TeamBadge team={team} league={game.league} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {goal ? 'Tor · ' : ''}{e.title}
                      {game.league === 'NHL' && isSwiss(e.title) && <SwissTag />}
                    </p>
                    <p className="truncate text-xs text-ink-400">{e.detail}</p>
                  </div>
                  {e.tag && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{e.tag}</span>}
                  {goal && e.score && <span className="font-display text-xl font-bold tabular-nums">{e.score}</span>}
                  {!goal && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">STRAFE</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const SwissTag = () => <span className="ml-1.5 rounded bg-red-600 px-1 py-px align-middle text-[9px] font-bold text-white">CH</span>;

function PlayerTable({ title, players, league, goalies }) {
  if (!players?.length) return null;
  const cols = goalies
    ? [['sa', 'Schüsse'], ['sv', 'Paraden'], ['ga', 'GT'], ['svPct', 'SV%'], ['toi', 'Zeit']]
    : [['pos', 'Pos'], ['g', 'T'], ['a', 'A'], ['pts', 'P'], ['pm', '+/-'], ['pim', 'Str'], ['sog', 'Sch'], ['toi', 'Eiszeit']];
  const fmt = (k, v) => (k === 'svPct' && v != null ? (Number(v) * 100).toFixed(1) : v ?? '–');
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-800/70">
      <table className="w-full min-w-[480px] text-sm tabular-nums">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-ink-400">
            <th className="py-2.5 pl-4 text-left">{title}</th>
            {cols.map(([k, l]) => <th key={k} className="px-2 text-right">{l}</th>)}
            <th className="pr-2" />
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={`${p.number}-${i}`} className="border-t border-white/5">
              <td className="py-2 pl-4">
                <span className="mr-2 inline-block w-6 text-ink-400">{p.number}</span>
                <span className="font-semibold">{p.name}</span>
                {league === 'NHL' && isSwiss(p.name) && <SwissTag />}
              </td>
              {cols.map(([k]) => <td key={k} className={`px-2 text-right ${k === 'pts' ? 'font-bold' : 'text-ink-300'}`}>{fmt(k, p[k])}</td>)}
              <td className="pr-2" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsView({ data }) {
  const [side, setSide] = useState('home');
  const { game, players, teamStats } = data;
  const team = players?.[side];
  return (
    <div className="space-y-4">
      {teamStats?.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-white/5 bg-ink-800/70 p-4">
          {teamStats.map((s) => {
            const h = parseFloat(s.home) || 0;
            const a = parseFloat(s.away) || 0;
            const pct = h + a ? (h / (h + a)) * 100 : 50;
            return (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-sm tabular-nums">
                  <span className="font-bold">{s.home}</span>
                  <span className="text-ink-400">{s.label}</span>
                  <span className="font-bold">{s.away}</span>
                </div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-ink-600">
                  <div className="bg-accent" style={{ width: `${pct}%` }} />
                  <div className="flex-1 bg-sky-400/80" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Tabs value={side} onChange={setSide} options={[
        { value: 'home', label: game.home.name },
        { value: 'away', label: game.away.name },
      ]} />
      {team?.skaters?.length || team?.goalies?.length ? (
        <>
          <PlayerTable title="Feldspieler" players={team.skaters} league={game.league} />
          <PlayerTable title="Torhüter" players={team.goalies} league={game.league} goalies />
        </>
      ) : (
        <p className="rounded-2xl bg-ink-800/60 p-6 text-center text-ink-400">Spielerstatistiken gibt es ab Spielbeginn.</p>
      )}
    </div>
  );
}

export default function Game() {
  const { league, id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('verlauf');
  const { data, error, loading, reload } = useApi(`/game/${league}/${id}`, 20_000);

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-ink-400 hover:text-white">← Zurück</button>
      {loading && !data && <Spinner />}
      {error && !data && <ErrorBox error={error} onRetry={reload} />}
      {data && (
        <>
          <Scoreboard game={data.game} />
          <PeriodTable periods={data.periods} game={data.game} />
          <Tabs value={tab} onChange={setTab} options={[
            { value: 'verlauf', label: 'Spielverlauf' },
            { value: 'stats', label: 'Statistiken' },
          ]} />
          {tab === 'verlauf' ? <Timeline events={data.events} game={data.game} /> : <StatsView data={data} />}
          {data.game.referees?.length > 0 && (
            <p className="text-xs text-ink-400">Schiedsrichter: {data.game.referees.join(', ')}</p>
          )}
        </>
      )}
    </div>
  );
}
