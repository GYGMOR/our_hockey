// Eine Spielkarte in der Übersicht (wie bei einer Sport-App)
import { useNavigate } from 'react-router-dom';
import { TeamBadge, LiveBadge, LeagueTag, WatchButtons } from './ui.jsx';
import { timeCH } from '../lib/format.js';
import { useFavorites } from '../lib/favorites.js';

function TeamRow({ team, league, winner, final, fav }) {
  const dim = final && !winner;
  return (
    <div className="flex items-center gap-3">
      <TeamBadge team={team} league={league} size={32} />
      <span className={`flex-1 truncate font-semibold ${dim ? 'text-ink-400' : 'text-white'}`}>
        {team.name}
        {fav && <span className="ml-1.5 text-amber-400">★</span>}
      </span>
      <span className={`font-display text-2xl font-bold tabular-nums ${dim ? 'text-ink-400' : 'text-white'}`}>
        {team.score ?? ''}
      </span>
    </div>
  );
}

export default function GameCard({ game }) {
  const { isFav } = useFavorites();
  const navigate = useNavigate();
  const url = `/spiel/${game.league.toLowerCase()}/${game.id}`;
  const live = game.status === 'live';
  const final = game.status === 'final';
  const scheduled = game.status === 'scheduled';
  const homeWins = (game.home.score ?? 0) > (game.away.score ?? 0);

  return (
    // Kein <a>/<Link>, weil in der Karte selbst Links (Stream-Buttons) stecken
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(url)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(url)}
      className={`group block cursor-pointer rounded-2xl border bg-ink-800/80 p-4 transition hover:-translate-y-0.5 hover:bg-ink-800 ${live ? 'border-live/40 shadow-[0_0_0_1px_rgba(255,45,85,0.15),0_10px_30px_-10px_rgba(255,45,85,0.35)]' : 'border-white/5'}`}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <LeagueTag league={game.league} />
          {live ? <LiveBadge small /> : null}
          <span className={live ? 'font-semibold text-live' : 'text-ink-400'}>
            {scheduled ? timeCH(game.start) : game.statusText}
          </span>
        </div>
        {!scheduled && <span className="text-ink-400">{timeCH(game.start)}</span>}
      </div>

      <div className="space-y-2.5">
        <TeamRow team={game.home} league={game.league} final={final} winner={homeWins} fav={isFav(game.league, game.home.short)} />
        <TeamRow team={game.away} league={game.league} final={final} winner={!homeWins} fav={isFav(game.league, game.away.short)} />
      </div>

      {game.periods?.some((p) => p.home != null) && (
        <div className="mt-3 flex gap-3 text-xs text-ink-400 tabular-nums">
          {game.periods.filter((p) => p.home != null).map((p) => (
            <span key={p.name}>({p.home}:{p.away})</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        {final ? <span className="text-xs text-ink-400">Spiel beendet</span> : <WatchButtons game={game} compact />}
        <span className="text-xs font-semibold text-ink-400 transition group-hover:text-white">Details →</span>
      </div>
    </div>
  );
}
