// Tabellen: National League und NHL
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { fmtDiff } from '../lib/format.js';
import { useFavorites } from '../lib/favorites.js';
import { Spinner, ErrorBox, Tabs, TeamBadge, Star } from '../components/ui.jsx';

// Trennlinien der National League (14 Teams):
// 1–6 Playoffs, 7–10 Play-In, 13–14 Playouts
const NL_ZONES = [
  { from: 1, to: 6, color: 'bg-emerald-400', label: 'Playoffs' },
  { from: 7, to: 10, color: 'bg-sky-400', label: 'Play-In' },
  { from: 13, to: 14, color: 'bg-red-400', label: 'Playouts' },
];
const zoneOf = (rank) => NL_ZONES.find((z) => rank >= z.from && rank <= z.to);

function StreakDots({ streak }) {
  if (!streak) return null;
  return (
    <span className="inline-flex gap-0.5">
      {streak.split('').map((c, i) => (
        <span key={i} className={`grid h-4 w-4 place-items-center rounded-sm text-[9px] font-bold ${c === 'W' ? 'bg-emerald-500/80' : 'bg-red-500/70'}`}>{c === 'W' ? 'S' : 'N'}</span>
      ))}
    </span>
  );
}

function Table({ league, rows, columns, zones, separatorAfter = [] }) {
  const { isFav, toggle } = useFavorites();
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-800/70">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-ink-400">
            <th className="w-10 py-3 pl-4">#</th>
            <th className="py-3">Team</th>
            {columns.map((c) => (
              <th key={c.key} title={c.title} className={`px-2 py-3 text-right ${c.strong ? 'text-white' : ''} ${c.hideMobile ? 'hidden sm:table-cell' : ''}`}>{c.label}</th>
            ))}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const zone = zones ? zoneOf(r.displayRank ?? r.rank) : null;
            const fav = isFav(league, r.short);
            return (
              <tr
                key={r.short}
                className={`border-white/5 transition hover:bg-white/[0.03] ${separatorAfter.includes(i + 1) ? 'border-b-2 border-b-ink-600' : 'border-b'} ${fav ? 'bg-amber-400/[0.06]' : ''}`}
              >
                <td className="relative py-2.5 pl-4 font-semibold tabular-nums text-ink-300">
                  {zone && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${zone.color}`} />}
                  {r.displayRank ?? r.rank}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <TeamBadge team={r} league={league} size={26} />
                    <span className="hidden font-semibold sm:inline">{r.team}</span>
                    <span className="font-semibold sm:hidden">{r.short}</span>
                  </div>
                </td>
                {columns.map((c) => (
                  <td key={c.key} className={`px-2 py-2.5 text-right tabular-nums ${c.strong ? 'font-bold text-white' : 'text-ink-300'} ${c.hideMobile ? 'hidden sm:table-cell' : ''}`}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
                <td className="pr-3 text-right"><Star active={fav} onClick={() => toggle(league, r.short)} size={16} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NLStandings() {
  const { data, error, loading, reload } = useApi('/standings/nl', 60_000);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div className="space-y-3">
      <Table
        league="NL"
        rows={data.rows}
        zones
        columns={[
          { key: 'gp', label: 'Sp', title: 'Spiele' },
          { key: 'w', label: 'S', title: 'Siege (60 Min.)' },
          { key: 'otw', label: 'SnV', title: 'Siege n. Verlängerung/Penalty', hideMobile: true },
          { key: 'otl', label: 'NnV', title: 'Niederlagen n. Verlängerung/Penalty', hideMobile: true },
          { key: 'l', label: 'N', title: 'Niederlagen (60 Min.)' },
          { key: 'goals', label: 'Tore', render: (r) => `${r.gf}:${r.ga}`, hideMobile: true },
          { key: 'diff', label: '+/-', render: (r) => fmtDiff(r.diff) },
          { key: 'streak', label: 'Form', render: (r) => <StreakDots streak={r.streak} />, hideMobile: true },
          { key: 'pts', label: 'Pkt', strong: true },
        ]}
      />
      <div className="flex flex-wrap gap-4 px-1 text-xs text-ink-400">
        {NL_ZONES.map((z) => (
          <span key={z.label} className="flex items-center gap-1.5"><span className={`h-2.5 w-1 rounded ${z.color}`} />{z.label} ({z.from}–{z.to})</span>
        ))}
      </div>
    </div>
  );
}

const NHL_COLUMNS = [
  { key: 'gp', label: 'GP', title: 'Spiele' },
  { key: 'w', label: 'W', title: 'Siege' },
  { key: 'l', label: 'L', title: 'Niederlagen' },
  { key: 'otl', label: 'OTL', title: 'Niederlagen n. Verlängerung' },
  { key: 'goals', label: 'Tore', render: (r) => `${r.gf}:${r.ga}`, hideMobile: true },
  { key: 'diff', label: '+/-', render: (r) => fmtDiff(r.diff) },
  { key: 'l10', label: 'L10', hideMobile: true },
  { key: 'streak', label: 'Serie', hideMobile: true },
  { key: 'pts', label: 'P', strong: true },
];

function NHLStandings() {
  const [view, setView] = useState('division');
  const { data, error, loading, reload } = useApi('/standings/nhl', 60_000);
  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;

  const rows = data.rows;
  let groups;
  if (view === 'league') {
    groups = [{ title: 'Liga', rows: [...rows].sort((a, b) => a.rank - b.rank) }];
  } else {
    const key = view === 'division' ? 'division' : 'conference';
    const rankKey = view === 'division' ? 'divisionRank' : 'conferenceRank';
    const names = [...new Set(rows.map((r) => r[key]))].sort();
    groups = names.map((n) => ({
      title: view === 'division' ? `${n} Division` : `${n} Conference`,
      rows: rows.filter((r) => r[key] === n).sort((a, b) => a[rankKey] - b[rankKey]).map((r) => ({ ...r, displayRank: r[rankKey] })),
    }));
  }

  return (
    <div className="space-y-5">
      <Tabs value={view} onChange={setView} options={[
        { value: 'division', label: 'Division' },
        { value: 'conference', label: 'Conference' },
        { value: 'league', label: 'Liga' },
      ]} />
      <div className="grid gap-5 2xl:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className="space-y-2">
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-ink-300">{g.title}</h3>
            <Table league="NHL" rows={g.rows} columns={NHL_COLUMNS} separatorAfter={view === 'division' ? [3] : []} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Standings() {
  const [params, setParams] = useSearchParams();
  const league = params.get('liga') === 'nhl' ? 'nhl' : 'nl';
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Tabellen</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{league === 'nl' ? 'National League' : 'NHL'}</h1>
      </div>
      <Tabs value={league} onChange={(v) => setParams({ liga: v })} options={[
        { value: 'nl', label: 'National League' },
        { value: 'nhl', label: 'NHL' },
      ]} />
      {league === 'nl' ? <NLStandings /> : <NHLStandings />}
      <p className="text-xs text-ink-400">Tipp: Mit dem Stern markierst du deine Lieblingsteams. Deren Spiele findest du dann unter „★ Favoriten“.</p>
    </div>
  );
}
