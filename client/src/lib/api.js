// Alle Anfragen ans eigene Backend laufen über diese Datei.
import { useEffect, useState, useCallback } from 'react';

export async function api(path) {
  const res = await fetch(`/api${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || body.error || `Fehler ${res.status}`);
  return body;
}

/**
 * React-Hook: lädt Daten und lädt sie optional alle `refreshMs` neu.
 *   const { data, error, loading, reload } = useApi('/scores?date=...', 30000)
 */
export function useApi(path, refreshMs = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true }));
    try {
      const data = await api(path);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, [path]);

  useEffect(() => {
    setState({ data: null, error: null, loading: true });
    load();
    if (!refreshMs) return undefined;
    // Im Hintergrund still neu laden (ohne Lade-Spinner)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, refreshMs);
    return () => clearInterval(timer);
  }, [load, refreshMs]);

  return { ...state, reload: () => load(true) };
}
