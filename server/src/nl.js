// ---------------------------------------------------------------------------
// National-League-Adapter
//
// Quelle: die Statistik-Schnittstelle der Swiss Ice Hockey Federation (SIHF),
// data.sihf.ch – dieselbe, die sihf.ch und nationalleague.ch für ihre
// Resultat-Tabellen verwenden.
//
// Die SIHF liefert Tabellen als { header: [...], data: [[...], [...]] }.
// Jede Zeile ist ein Array, die Bedeutung jeder Spalte steht im header.alias.
// Darum suchen wir die Spalten immer über ihren alias statt über die Position –
// so bricht nichts, wenn die SIHF mal eine Spalte hinzufügt.
// ---------------------------------------------------------------------------
import { getJson } from './http.js';
import { sortEvents } from './nhl.js';

const BASE = 'https://data.sihf.ch/Statistic/api/cms';
const LEAGUE_SEARCH = '1/2015-2099/1'; // "1" = National League

// Die SIHF benennt eine Saison nach ihrem End-Jahr: 2026/27 = "2027"
export function seasonFor(isoDate) {
  const [y, m] = isoDate.split('-').map(Number);
  return m >= 7 ? y + 1 : y;
}

const toSihfDate = (iso) => iso.split('-').reverse().join('.'); // 2026-10-10 -> 10.10.2026

// Aus { header, data } eine Liste von Objekten machen: [{ date: ..., homeTeam: ... }, ...]
function rowsByAlias(table) {
  const aliases = (table?.header ?? []).map((h) => h.alias);
  return (table?.data ?? []).map((row) => Object.fromEntries(aliases.map((a, i) => [a, row[i]])));
}

const cleanName = (name = '') => name.replace(/\*+$/, '').trim();
const num = (v) => (v === '-' || v === '' || v == null ? null : Number(v));

function mapStatus(s) {
  if (!s) return 'scheduled';
  if (s.canceled) return 'canceled';
  if (s.id === 0 || s.percent === 0) return 'scheduled';
  if (s.percent >= 100) return 'final';
  return 'live';
}

function statusText(s, status, decision) {
  if (status === 'final') return decision === 'OT' ? 'Ende n.V.' : decision === 'SO' ? 'Ende n.P.' : 'Ende';
  if (status === 'scheduled') return 'Geplant';
  if (status === 'canceled') return 'Abgesagt';
  return s?.name ?? 'Live';
}

// Team-Logos: die gleichen Bilder, die sihf.ch im Game-Center anzeigt.
// Muster: https://www.sihf.ch/images/team/<teamId>.png  (clubId optional)
export const logoUrl = (t) =>
  t?.id ? `https://www.sihf.ch/images/team/${t.id}.png?${t.clubId ? `clubId=${t.clubId}&` : ''}rmode=Pad&format=webp&quality=100&height=120` : null;

const team = (t, score) => ({
  name: cleanName(t?.name),
  short: t?.acronym,
  id: t?.id,
  score: num(score),
  logo: logoUrl(t),
});

export async function getScores(date) {
  const season = seasonFor(date);
  const url =
    `${BASE}/cache300?alias=results&searchQuery=${LEAGUE_SEARCH}` +
    `&filterQuery=${season}/all/${toSihfDate(date)}/all&filterBy=Season,Phase,Date,Team&take=500&language=de`;
  const data = await getJson(url);

  return rowsByAlias(data).map((r) => {
    const status = mapStatus(r.status);
    const decision = r.decision || null;
    const [d, m, y] = String(r.date).split('.');
    return {
      id: r.details?.gameId ?? `${r.date}-${r.homeTeam?.acronym}`,
      league: 'NL',
      start: r.status?.startDateTime ?? `${y}-${m}-${d}T${r.time}:00+02:00`,
      status,
      statusText: statusText(r.status, status, decision),
      home: team(r.homeTeam, r.score?.homeTeam),
      away: team(r.awayTeam, r.score?.awayTeam),
      periods: periodsFromRow(r.scorePerPeriod),
      decision,
      venue: null,
      broadcasts: r.broadcasts?.entries ?? [],
      links: {},
    };
  });
}

// { homeTeam: ["1","0","-"], awayTeam: [...] } -> [{ name: "1. Drittel", home: 1, away: 0 }, ...]
function periodsFromRow(p) {
  if (!p?.homeTeam) return [];
  return p.homeTeam.map((h, i) => ({
    name: i < 3 ? `${i + 1}. Drittel` : 'Verlängerung',
    home: num(h),
    away: num(p.awayTeam?.[i]),
  }));
}

export async function getStandings(date) {
  const season = seasonFor(date);
  const url =
    `${BASE}/cache300?alias=standing&searchQuery=${LEAGUE_SEARCH}` +
    `&filterQuery=${season}/1&filterBy=Season,League&language=de`;
  const data = await getJson(url);

  return rowsByAlias(data).map((r) => ({
    rank: Number(r.rank),
    team: cleanName(r.team?.name),
    short: r.team?.acronym,
    logo: logoUrl(r.team),
    gp: num(r.gamesPlayed),
    pts: num(r.points),
    w: num(r.gamesWonInTime),
    otw: num(r.gamesWonExtraTime) + num(r.gamesWonPenalty),
    otl: num(r.gamesLostExtraTime) + num(r.gamesLostPenalty),
    l: num(r.gamesLostInTime),
    gf: num(r.goalsFor),
    ga: num(r.goalsAgainst),
    diff: num(r.goalsDifference),
    // "W+W-L+..." -> "WWL" (die +/- Zeichen der SIHF lassen wir weg)
    streak: String(r.streak ?? '').replace(/[^WL]/g, '').slice(0, 5),
  }));
}

// Spieldetail
export async function getGame(id) {
  const data = await getJson(`${BASE}/gameoverview?alias=gameDetail&searchQuery=${id}&language=de`);
  const d = data.details ?? {};
  // Achtung: Je nach Spiel liegen Startzeit und Status in "details" ODER direkt
  // im obersten Objekt (bei laufenden Spielen z. B. nur oben). Darum beide prüfen.
  const gameStatus = d.status ?? data.status;
  const startTime = d.startDateTime ?? data.startDateTime ?? gameStatus?.startDateTime;
  const homeId = d.homeTeam?.id;

  const scores = data.result?.scores ?? [];
  const total = scores.find((s) => /total|gesamt/i.test(s.name ?? '')) ?? null;
  const periodRows = scores
    .filter((s) => s !== total)
    .map((s) => ({ name: s.name, home: num(s.homeTeam), away: num(s.awayTeam) }));
  const homeScore = num(data.result?.homeTeam) ?? num(total?.homeTeam) ?? sumOf(periodRows, 'home');
  const awayScore = num(data.result?.awayTeam) ?? num(total?.awayTeam) ?? sumOf(periodRows, 'away');

  const status = mapStatus(gameStatus);
  const decision = data.summary?.shootout?.goals?.length
    ? 'SO'
    : periodRows.some((r) => /Verlängerung/.test(r.name)) ? 'OT' : null;

  const game = {
    id: String(data.gameId ?? id),
    league: 'NL',
    start: startTime,
    status,
    statusText: statusText(gameStatus, status, decision),
    home: team(d.homeTeam, homeScore),
    away: team(d.awayTeam, awayScore),
    decision,
    venue: d.venue ? [d.venue.name, d.venue.city].filter(Boolean).join(', ') : null,
    spectators: num(d.venue?.spectators),
    referees: [...(d.referees ?? []), ...(d.linesmen ?? [])].map((r) => r.fullName ?? r.name).filter(Boolean),
    broadcasts: data.broadcasts?.entries ?? data.broadcasts ?? [],
    links: {},
  };

  const events = [];
  for (const p of data.summary?.periods ?? []) {
    for (const goal of p.goals ?? []) {
      // text: "**EQ** / **0:1** - **Berni Tim (2)**\nAndrighetto Sven (8), Knak Simon (4)"
      const [first = '', assists = ''] = String(goal.text ?? '').replace(/\*\*/g, '').split('\n');
      const scorer = first.split(' - ').slice(1).join(' - ').trim();
      events.push({
        type: 'goal',
        period: p.name,
        time: goal.time,
        side: goal.teamId === homeId ? 'home' : 'away',
        title: scorer || first,
        detail: assists.trim() ? `Assists: ${assists.trim()}` : 'ohne Assist',
        score: goal.result ? `${goal.result.home}:${goal.result.away}` : null,
        tag: goal.isEmptyNet ? 'EN' : goal.isPenaltyShot ? 'PS' : /^(PP|SH)/.exec(goal.situation?.code ?? '')?.[1] ?? null,
      });
    }
    for (const foul of p.fouls ?? []) {
      // text: "Frödén Jesper  (2 Min  / Halten)"
      const playerName = String(foul.text ?? '').split('(')[0].replace(/\s+/g, ' ').trim();
      events.push({
        type: 'penalty',
        period: p.name,
        time: foul.time,
        side: foul.teamId === homeId ? 'home' : 'away',
        title: playerName || 'Teamstrafe',
        detail: `${foul.minutes} Min · ${foul.name ?? ''}`,
      });
    }
  }

  // Spielerstatistiken: SIHF-Tabellen ins gleiche Format wie bei der NHL bringen
  const statTable = (alias) => rowsByAlias((data.stats ?? []).find((s) => s.alias === alias)).map(
    (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cellText(v)])),
  );
  const skaters = (alias) => statTable(alias).map((p) => ({
    name: p.player, number: p.playerNumber, pos: posShort(p.playerPosition),
    g: num(p.goals), a: num(p.assists), pts: num(p.points), pm: num(p.plusMinus),
    pim: num(p.pimTotal), sog: num(p.shotsOnGoal), toi: p.timeOnIce,
  }));
  const goalies = (alias) => statTable(alias).map((p) => ({
    name: p.player, number: p.playerNumber,
    sa: num(p.shotsAgainst), sv: num(p.saves), ga: num(p.goalsAgainst),
    svPct: num(p.savesPercentage) != null ? num(p.savesPercentage) / 100 : null, toi: p.secondsPlayed, decision: '',
  }));

  // Team-Vergleich (Schüsse, Bullys, Powerplay ...)
  const WANTED = { 'SOG Total': 'Schüsse aufs Tor', 'BkS': 'Geblockte Schüsse', 'FO%': 'Bully-Quote %', 'PIM Total': 'Strafminuten', 'PP%': 'Powerplay %', 'PK%': 'Boxplay %' };
  const teamTable = (data.stats ?? []).find((s) => s.alias === 'gameTeamStats');
  const teamStats = (teamTable?.data ?? [])
    .map((row) => row.map(cellText))
    .filter(([label]) => WANTED[label])
    .map(([label, home, away]) => ({ label: WANTED[label], home, away }));

  return {
    game,
    periods: periodRows,
    events: sortEvents(events),
    players: {
      home: { skaters: skaters('gamePlayerStatsHome'), goalies: goalies('gameGoalieStatsHome') },
      away: { skaters: skaters('gamePlayerStatsAway'), goalies: goalies('gameGoalieStatsAway') },
    },
    teamStats,
    threeStars: [],
  };
}

const posShort = (p = '') => ({ Stürmer: 'F', Verteidiger: 'D', Torhüter: 'G' })[p] ?? p.slice(0, 1);

const sumOf = (rows, key) => (rows.length ? rows.reduce((s, r) => s + (r[key] ?? 0), 0) : null);

// Eine SIHF-Tabellenzelle kann ein Text oder ein Objekt sein -> immer Text daraus machen
function cellText(c) {
  if (c == null) return '';
  if (typeof c !== 'object') return String(c);
  return c.fullName ?? c.name ?? c.text ?? c.value ?? c.acronym ?? '';
}
