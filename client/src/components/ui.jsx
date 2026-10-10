// Kleine, wiederverwendbare UI-Bausteine
import { useState } from 'react';
import { NL_COLORS, BROADCASTERS } from '../lib/teams.js';

/** Team-Logo (NHL) oder farbiges Kürzel (NL / Fallback) */
export function TeamBadge({ team, league, size = 36 }) {
  const [broken, setBroken] = useState(false);
  if (team.logo && !broken) {
    return (
      <img
        src={team.logo}
        alt={team.short}
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  const [bg, fg] = (league === 'NL' && NL_COLORS[team.short]) || ['#2a3549', '#ffffff'];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold leading-none ring-1 ring-white/10"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * (team.short?.length > 3 ? 0.28 : 0.34) }}
    >
      {team.short}
    </span>
  );
}

export function LiveBadge({ small }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded bg-live font-bold uppercase tracking-wider text-white ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      Live
    </span>
  );
}

export function LeagueTag({ league }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${league === 'NL' ? 'bg-red-600/20 text-red-300' : 'bg-sky-500/20 text-sky-300'}`}>
      {league}
    </span>
  );
}

export function Star({ active, onClick, size = 18 }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={active ? 'Favorit entfernen' : 'Als Favorit markieren'}
      className={`transition hover:scale-110 ${active ? 'text-amber-400' : 'text-ink-600 hover:text-ink-300'}`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Buttons zu den legalen Streaming-Anbietern */
export function WatchButtons({ game, compact }) {
  const entries = game.broadcasts?.length ? game.broadcasts : [];
  const toKey = (b) => {
    const s = String(b).toUpperCase().replace(/\s/g, '');
    if (s.includes('MYSPORTS')) return 'MYSPORTS';
    if (s.includes('BLUE')) return 'BLUE';
    return s;
  };
  const known = [...new Set(entries.map(toKey))].map((k) => BROADCASTERS[k]).filter(Boolean);
  // NHL: MySports zeigt viele NHL-Spiele in der Schweiz; zusätzlich NHL-Gamecenter
  const list = game.league === 'NHL' ? [BROADCASTERS.MYSPORTS] : known.length ? known : [BROADCASTERS.MYSPORTS];
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((b) => (
        <a
          key={b.label}
          href={b.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 rounded-full bg-accent font-semibold text-white transition hover:brightness-110 ${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          {b.label}
        </a>
      ))}
      {game.league === 'NHL' && game.links?.gamecenter && !compact && (
        <a href={game.links.gamecenter} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-ink-700 px-4 py-2 text-sm font-semibold text-ink-300 transition hover:text-white">
          NHL Gamecenter
        </a>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-accent" />
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      <p className="font-semibold">Daten konnten nicht geladen werden.</p>
      <p className="mt-1 text-red-300/80">{error?.message ?? String(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-red-500/20 px-3 py-1 font-semibold hover:bg-red-500/30">
          Nochmals versuchen
        </button>
      )}
    </div>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-ink-800 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${value === o.value ? 'bg-white text-ink-950' : 'text-ink-300 hover:text-white'}`}
        >
          {o.label}
          {o.count != null && <span className={`ml-1.5 text-xs ${value === o.value ? 'text-ink-600' : 'text-ink-400'}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
