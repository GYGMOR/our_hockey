// ---------------------------------------------------------------------------
// NHL-Adapter
//
// Quelle: die öffentliche NHL-API (https://api-web.nhle.com/v1/...), die auch
// nhl.com selbst benutzt. Kein API-Key nötig.
//
// Aufgabe dieses Moduls: Die NHL-Daten in UNSER eigenes, einheitliches Format
// umwandeln (siehe README, "Das Game-Format"). So muss das Frontend nicht
// wissen, ob ein Spiel aus der NHL oder der National League kommt.
// ---------------------------------------------------------------------------
import { getJson } from './http.js';

const BASE = 'https://api-web.nhle.com/v1';

// NHL-Spielstatus -> unser Status
function mapState(gameState) {
  if (['LIVE', 'CRIT'].includes(gameState)) return 'live';
  if (['FINAL', 'OFF'].includes(gameState)) return 'final';
  return 'scheduled'; // FUT, PRE
}

function periodName(pd) {
  if (!pd) return '';
  if (pd.periodType === 'SO') return 'Penaltyschiessen';
  if (pd.periodType === 'OT') return pd.number > 4 ? `${pd.number - 3}. Verlängerung` : 'Verlängerung';
  return `${pd.number}. Drittel`;
}

function statusText(g, status) {
  if (status === 'final') {
    const last = g.gameOutcome?.lastPeriodType;
    return last === 'OT' ? 'Ende n.V.' : last === 'SO' ? 'Ende n.P.' : 'Ende';
  }
  if (status === 'live') {
    const p = periodName(g.periodDescriptor);
    if (g.clock?.inIntermission) return `Pause nach ${p}`;
    return g.clock?.timeRemaining ? `${p} · ${g.clock.timeRemaining}` : p;
  }
  if (g.gameScheduleState === 'PPD') return 'Verschoben';
  return 'Geplant';
}

function team(t) {
  return {
    name: t.placeName?.default && t.commonName?.default
      ? `${t.placeName.default} ${t.commonName.default}`
      : t.name?.default ?? t.commonName?.default ?? t.abbrev,
    short: t.abbrev,
    score: t.score ?? null,
    sog: t.sog ?? null,
    logo: t.darkLogo ?? t.logo?.replace('_light', '_dark') ?? null,
  };
}

// Ein Spiel aus /score/{datum} oder /landing ins einheitliche Format bringen
export function normalizeGame(g) {
  const status = mapState(g.gameState);
  return {
    id: String(g.id),
    league: 'NHL',
    start: g.startTimeUTC,
    status,
    statusText: statusText(g, status),
    home: team(g.homeTeam),
    away: team(g.awayTeam),
    decision: ['OT', 'SO'].includes(g.gameOutcome?.lastPeriodType) ? g.gameOutcome.lastPeriodType : null,
    venue: g.venue?.default ?? null,
    broadcasts: (g.tvBroadcasts ?? []).map((b) => b.network),
    links: { gamecenter: g.gameCenterLink ? `https://www.nhl.com${g.gameCenterLink}` : null },
  };
}

// Alle Spiele eines Datums (US-Datum = "NHL-Nacht", in der Schweiz also abends/nachts)
export async function getScores(date) {
  const data = await getJson(`${BASE}/score/${date}`);
  return (data.games ?? []).map(normalizeGame);
}

export async function getStandings() {
  const data = await getJson(`${BASE}/standings/now`);
  return (data.standings ?? []).map((s) => ({
    rank: s.leagueSequence,
    team: s.teamName?.default,
    short: s.teamAbbrev?.default,
    logo: s.teamLogoDark ?? s.teamLogo,
    conference: s.conferenceName,
    division: s.divisionName,
    conferenceRank: s.conferenceSequence,
    divisionRank: s.divisionSequence,
    wildcardRank: s.wildcardSequence,
    gp: s.gamesPlayed,
    w: s.wins,
    l: s.losses,
    otl: s.otLosses,
    pts: s.points,
    gf: s.goalFor,
    ga: s.goalAgainst,
    diff: s.goalDifferential,
    pointPct: s.pointPctg,
    streak: s.streakCode ? `${s.streakCode}${s.streakCount}` : '',
    l10: `${s.l10Wins}-${s.l10Losses}-${s.l10OtLosses}`,
  }));
}

// Spieldetail: Verlauf (Tore/Strafen) + Spielerstatistiken
export async function getGame(id) {
  const [landing, box] = await Promise.all([
    getJson(`${BASE}/gamecenter/${id}/landing`),
    getJson(`${BASE}/gamecenter/${id}/boxscore`),
  ]);

  const game = normalizeGame({ ...landing, gameOutcome: box.gameOutcome ?? landing.gameOutcome });
  const homeAbbrev = landing.homeTeam?.abbrev;
  const fullName = (p) => [p?.firstName?.default, p?.lastName?.default].filter(Boolean).join(' ');

  const events = [];
  for (const period of landing.summary?.scoring ?? []) {
    for (const goal of period.goals ?? []) {
      const assists = (goal.assists ?? []).map((a) => a.name?.default ?? a.name).join(', ');
      events.push({
        type: 'goal',
        period: periodName(period.periodDescriptor),
        time: goal.timeInPeriod,
        side: goal.teamAbbrev?.default === homeAbbrev ? 'home' : 'away',
        title: `${fullName(goal) || goal.name?.default} (${goal.goalsToDate ?? '-'})`,
        detail: assists ? `Assists: ${assists}` : 'ohne Assist',
        score: `${goal.homeScore}:${goal.awayScore}`,
        tag: { pp: 'PP', sh: 'SH', en: 'EN' }[goal.strength] ?? (goal.goalModifier === 'empty-net' ? 'EN' : null),
      });
    }
  }
  for (const period of landing.summary?.penalties ?? []) {
    for (const pen of period.penalties ?? []) {
      events.push({
        type: 'penalty',
        period: periodName(period.periodDescriptor),
        time: pen.timeInPeriod,
        side: pen.teamAbbrev?.default === homeAbbrev ? 'home' : 'away',
        title: fullName(pen.committedByPlayer) || pen.servedBy?.default || 'Teamstrafe',
        detail: `${pen.duration} Min · ${String(pen.descKey ?? '').replace(/-/g, ' ')}`,
      });
    }
  }

  const skater = (p) => ({
    name: p.name?.default, number: p.sweaterNumber, pos: p.position,
    g: p.goals, a: p.assists, pts: p.points, pm: p.plusMinus, pim: p.pim, sog: p.sog, toi: p.toi,
  });
  const goalie = (p) => ({
    name: p.name?.default, number: p.sweaterNumber,
    sa: p.shotsAgainst, sv: p.saves, ga: p.goalsAgainst,
    svPct: p.savePctg, toi: p.toi, decision: p.decision ?? '',
  });
  const side = (t) => ({
    skaters: [...(t?.forwards ?? []), ...(t?.defense ?? [])].map(skater),
    goalies: (t?.goalies ?? []).map(goalie),
  });

  return {
    game,
    periods: buildPeriodTable(landing),
    events: sortEvents(events),
    players: { home: side(box.playerByGameStats?.homeTeam), away: side(box.playerByGameStats?.awayTeam) },
    teamStats: game.home.sog != null ? [{ label: 'Schüsse aufs Tor', home: game.home.sog, away: game.away.sog }] : [],
    threeStars: (landing.summary?.threeStars ?? []).map((s) => ({
      star: s.star, name: s.name?.default ?? s.name, team: s.teamAbbrev,
    })),
  };
}

// Tore pro Drittel aus dem Verlauf zusammenzählen
function buildPeriodTable(landing) {
  const homeAbbrev = landing.homeTeam?.abbrev;
  const rows = (landing.summary?.scoring ?? []).map((p) => {
    const goals = p.goals ?? [];
    const home = goals.filter((g) => g.teamAbbrev?.default === homeAbbrev).length;
    return { name: periodName(p.periodDescriptor), home, away: goals.length - home };
  });
  return rows;
}

const periodOrder = (name) => {
  const m = /^(\d+)\./.exec(name);
  if (name.startsWith('Penalty')) return 99;
  if (name.includes('Verlängerung')) return 10 + (m ? Number(m[1]) : 0);
  return m ? Number(m[1]) : 50;
};

export function sortEvents(events) {
  return events.sort((a, b) => periodOrder(a.period) - periodOrder(b.period) || String(a.time).localeCompare(String(b.time)));
}
