// ---------------------------------------------------------------------------
// my_Hockey – Backend
//
// Ein kleiner Express-Server mit einer eigenen, einheitlichen API:
//
//   GET /api/scores?date=2026-10-10          -> Spiele NL + NHL eines Tages
//   GET /api/standings/nl                     -> Tabelle National League
//   GET /api/standings/nhl                    -> Tabelle NHL
//   GET /api/game/nl/:id  |  /api/game/nhl/:id -> Spieldetail
//
// Warum ein eigenes Backend und nicht direkt aus dem Browser?
//  1. CORS: Browser dürfen fremde APIs oft nicht direkt abfragen.
//  2. Cache: Wir schonen die Quellen und sind schneller.
//  3. Ein Format: Das Frontend bekommt NL und NHL im gleichen Aufbau.
// ---------------------------------------------------------------------------
import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cached } from './cache.js';
import { MOCK } from './http.js';
import * as nhl from './nhl.js';
import * as nl from './nl.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Heutiges Datum in Schweizer Zeit als YYYY-MM-DD
const todayCH = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '');

const LEAGUES = { nl, nhl };

// Hilfsfunktion: Fehler sauber als JSON zurückgeben statt Server-Absturz
const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    console.error(`[api] ${req.originalUrl}:`, err.message);
    res.status(502).json({ error: 'Datenquelle nicht erreichbar', detail: err.message });
  }
};

// Eine Liga laden, ohne dass ein Fehler die andere Liga mitreisst
async function safe(label, promise) {
  try {
    return { games: await promise, error: null };
  } catch (err) {
    console.error(`[api] ${label}:`, err.message);
    return { games: [], error: err.message };
  }
}

app.get('/api/scores', handle(async (req) => {
  const date = isDate(req.query.date) ? req.query.date : todayCH();
  // Live-Tage kurz cachen (20s), vergangene/zukünftige Tage länger (5 Min)
  const ttl = date === todayCH() ? 20 : 300;
  const [nlRes, nhlRes] = await Promise.all([
    safe('NL', cached(`nl:scores:${date}`, ttl, () => nl.getScores(date))),
    safe('NHL', cached(`nhl:scores:${date}`, ttl, () => nhl.getScores(date))),
  ]);
  return { date, today: todayCH(), mock: MOCK, leagues: { NL: nlRes, NHL: nhlRes } };
}));

app.get('/api/standings/:league', handle(async (req) => {
  const league = req.params.league.toLowerCase();
  if (!LEAGUES[league]) throw new Error('Unbekannte Liga');
  const date = todayCH();
  return { league: league.toUpperCase(), rows: await cached(`${league}:standings`, 300, () => LEAGUES[league].getStandings(date)) };
}));

app.get('/api/game/:league/:id', handle(async (req) => {
  const league = req.params.league.toLowerCase();
  const { id } = req.params;
  if (!LEAGUES[league] || !/^\d+$/.test(id)) throw new Error('Ungültige Spiel-ID');
  return cached(`${league}:game:${id}`, 15, () => LEAGUES[league].getGame(id));
}));

// Produktion: das gebaute Frontend (client/dist) gleich mit ausliefern
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`🏒 my_Hockey API läuft auf http://localhost:${PORT}${MOCK ? '  (MOCK-Modus: Beispieldaten)' : ''}`);
});
