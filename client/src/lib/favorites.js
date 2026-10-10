// Lieblingsteams – werden im Browser (localStorage) gespeichert.
// Ein Favorit ist z. B. "NL:ZSC" oder "NHL:NJD".
import { useEffect, useState } from 'react';

const KEY = 'myhockey.favorites';
const EVENT = 'myhockey:favorites';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState(read);

  // Alle Komponenten synchron halten, wenn irgendwo ein Stern geklickt wird
  useEffect(() => {
    const sync = () => setFavs(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const key = (league, short) => `${league}:${short}`;
  const isFav = (league, short) => favs.includes(key(league, short));
  const toggle = (league, short) => {
    const k = key(league, short);
    const next = favs.includes(k) ? favs.filter((f) => f !== k) : [...favs, k];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* z. B. privater Modus – dann halt nur bis zum Neuladen */
    }
    setFavs(next);
    window.dispatchEvent(new Event(EVENT));
  };
  const gameHasFav = (g) => isFav(g.league, g.home.short) || isFav(g.league, g.away.short);

  return { favs, isFav, toggle, gameHasFav };
}
