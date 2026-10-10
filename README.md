# my_Hockey 🏒

Deine eigene Hockey-App für **National League** und **NHL**: Live-Resultate, Spielplan, Tabellen, Spieldetails und Favoriten, mit Links zu den legalen Streams (MySports / blue Sport).

---

## 1. Starten

**Einmalig:** [Node.js LTS](https://nodejs.org) installieren (Version 20 oder neuer).

Dann im Ordner `my_Hockey` ein Terminal öffnen (im Explorer in die Adresszeile `cmd` tippen und Enter drücken):

```bash
npm install        # einmalig: lädt alle Pakete (dauert 1–2 Minuten)
npm run dev        # startet Backend + Frontend
```

Danach im Browser **http://localhost:5173** öffnen.

| Befehl | Was passiert |
|---|---|
| `npm run dev` | Entwicklungsmodus mit echten Daten. Code-Änderungen sind sofort sichtbar. |
| `npm run dev:mock` | Gleiches, aber mit Beispieldaten aus `server/fixtures/` (ohne Internet, oder wenn gerade kein Spiel läuft). |
| `npm run build` und danach `npm start` | „Fertige“ Version: alles läuft auf **http://localhost:3001** |

> Tipp fürs Handy: Wenn PC und Handy im gleichen WLAN sind, startest du `npm run build` und `npm start` und öffnest auf dem Handy `http://<IP-deines-PCs>:3001`.

---

## 2. So ist das Projekt aufgebaut

```
my_Hockey/
├─ package.json            ← startet beide Teile gleichzeitig
├─ server/                 ← BACKEND (Node.js + Express)
│  ├─ src/index.js         ← die API-Routen (/api/scores, /api/standings, /api/game)
│  ├─ src/nhl.js           ← holt & übersetzt NHL-Daten
│  ├─ src/nl.js            ← holt & übersetzt National-League-Daten (SIHF)
│  ├─ src/cache.js         ← merkt sich Antworten ein paar Sekunden
│  ├─ src/http.js          ← fetch + Mock-Modus
│  └─ fixtures/            ← Beispieldaten für den Mock-Modus
└─ client/                 ← FRONTEND (React + Vite + Tailwind)
   └─ src/
      ├─ App.jsx           ← Grundgerüst: Kopfzeile, Navigation, Routen
      ├─ pages/            ← die drei Seiten: Scores, Standings, Game
      ├─ components/       ← Bausteine: GameCard, TeamBadge, Buttons …
      └─ lib/              ← Helfer: API-Aufrufe, Datum, Favoriten, Teamfarben
```

### Der Datenfluss

```
Browser (React)  ──/api/...──▶  dein Backend (Express)  ──▶  api-web.nhle.com   (NHL)
     ▲                               │  cached + vereinheitlicht  └▶  data.sihf.ch  (NL)
     └──────────── einheitliches JSON ◀┘
```

Das Backend ist der „Übersetzer“: NHL und SIHF liefern komplett unterschiedliche Formate. `nhl.js` und `nl.js` bauen daraus das **gleiche** Format. Darum kann das Frontend mit derselben `GameCard` NL- und NHL-Spiele anzeigen.

### Das Game-Format (so sieht ein Spiel im Frontend aus)

```js
{
  id: "20271105000074",
  league: "NL",                       // oder "NHL"
  start: "2026-10-10T19:45:00+02:00",
  status: "live",                     // "scheduled" | "live" | "final"
  statusText: "2. Drittel",
  home: { name: "Genève-Servette HC", short: "GSHC", score: 1, logo: null },
  away: { name: "HC Davos",           short: "HCD",  score: 2, logo: null },
  periods: [{ name: "1. Drittel", home: 1, away: 2 }, ...],
  broadcasts: ["MYSPORTS"]
}
```

---

## 3. Datenquellen

| Liga | Quelle | Bemerkung |
|---|---|---|
| NHL | `https://api-web.nhle.com/v1/...` | Die API, die nhl.com selbst nutzt. Kein Key nötig. |
| National League | `https://data.sihf.ch/Statistic/api/cms/...` | Die Statistik-Schnittstelle des Verbands (SIHF). |

Beide Schnittstellen sind nicht offiziell dokumentiert. Wenn sich dort etwas ändert, musst du nur `nhl.js` bzw. `nl.js` anpassen; der Rest der App bleibt gleich.

**Zeitzonen:** Unter einem Datum siehst du die NL-Spiele dieses Tages und die NHL-Spiele der amerikanischen „Nacht“ dazu (also bei uns spätabends bis frühmorgens). Alle Zeiten werden in Schweizer Zeit angezeigt.

---

## 4. Ideen zum Selbst-Weiterbauen

Sortiert von einfach bis anspruchsvoll:

1. **Teamfarben anpassen:** `client/src/lib/teams.js` → `NL_COLORS`
2. **Schweizer NHL-Spieler ergänzen:** gleiche Datei → `SWISS_NHL`
3. **Neue Farbe für die App:** `client/tailwind.config.js` → `accent`
4. **Topscorer-Seite:** NHL hat `/v1/skater-stats-leaders/current`, die SIHF hat `alias=player` mit Scorer-Statistiken. Neue Route in `server/src/index.js`, neue Seite in `client/src/pages/`.
5. **Team-Seite:** Spielplan eines Teams (NHL: `/v1/club-schedule-season/{TEAM}/now`)
6. **Benachrichtigung bei Toren** deines Lieblingsteams (Browser Notification API)
7. **Swiss League** dazunehmen (bei der SIHF eine andere Liga-Nummer im `searchQuery`)

---

## 5. Probleme?

- **„Datenquelle nicht erreichbar“** → Internet prüfen. Mit `npm run dev:mock` testen, ob die App selbst funktioniert.
- **`npm` wird nicht gefunden** → Node.js installieren und das Terminal neu öffnen.
- **Port schon belegt** → Ein anderes Programm nutzt 3001 oder 5173. Alte Terminals schliessen.
- **NHL-Logos fehlen** → Die App zeigt dann automatisch das Team-Kürzel an.
