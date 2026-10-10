// ---------------------------------------------------------------------------
// Zentrale Funktion um JSON von einer URL zu holen.
//
// Im Mock-Modus (npm run dev:mock) werden statt echter Requests die Beispiel-
// Dateien aus server/fixtures/ geladen. Praktisch zum Entwickeln ohne Internet
// oder wenn gerade keine Spiele laufen.
// ---------------------------------------------------------------------------
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const MOCK = process.argv.includes('--mock') || process.env.MOCK === '1';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

// Welche URL entspricht welcher Beispiel-Datei?
const MOCK_ROUTES = [
  [/nhle\.com\/v1\/score\//, 'nhl-score.json'],
  [/nhle\.com\/v1\/standings\//, 'nhl-standings.json'],
  [/nhle\.com\/v1\/gamecenter\/\d+\/landing/, 'nhl-landing.json'],
  [/nhle\.com\/v1\/gamecenter\/\d+\/boxscore/, 'nhl-boxscore.json'],
  [/sihf\.ch.*alias=results/, 'nl-results.json'],
  [/sihf\.ch.*alias=standing/, 'nl-standing.json'],
  [/sihf\.ch.*alias=gameDetail/, 'nl-game.json'],
];

export async function getJson(url) {
  if (MOCK) {
    const match = MOCK_ROUTES.find(([re]) => re.test(url));
    if (!match) throw new Error(`Kein Mock für ${url}`);
    return JSON.parse(await readFile(path.join(fixturesDir, match[1]), 'utf8'));
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'my-hockey/1.0 (private project)', Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} bei ${url}`);

  const text = await res.text();
  // Die SIHF-API antwortet manchmal als JSONP: callback({...}); -> wir schneiden das weg
  const json = text.trim().replace(/^[\w$.]+\(([\s\S]*)\);?$/, '$1');
  return JSON.parse(json);
}
