// ---------------------------------------------------------------------------
// Ganz einfacher In-Memory-Cache.
//
// Warum? Wenn du die App offen hast, fragt das Frontend alle ~30 Sekunden
// nach neuen Resultaten. Ohne Cache würde jede Anfrage direkt bei NHL/SIHF
// landen. Mit Cache holen wir die Daten höchstens alle X Sekunden neu.
//
// Bonus: Wenn die Quelle mal nicht erreichbar ist, liefern wir die letzten
// bekannten Daten ("stale") statt einer Fehlermeldung.
// ---------------------------------------------------------------------------

const store = new Map();

export async function cached(key, ttlSeconds, loader) {
  const hit = store.get(key);
  const now = Date.now();

  if (hit && hit.expires > now) return hit.value;

  try {
    const value = await loader();
    store.set(key, { value, expires: now + ttlSeconds * 1000 });
    return value;
  } catch (err) {
    if (hit) {
      console.warn(`[cache] ${key}: Quelle nicht erreichbar, liefere alte Daten (${err.message})`);
      return hit.value;
    }
    throw err;
  }
}
