// Datums- und Zeit-Helfer. Alles wird in Schweizer Zeit angezeigt.
const TZ = 'Europe/Zurich';

export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Ungültige/fehlende Zeiten dürfen die App nie zum Absturz bringen -> dann einfach ''
const valid = (v) => v && !Number.isNaN(new Date(v).getTime());

export const timeCH = (isoDateTime) =>
  valid(isoDateTime)
    ? new Intl.DateTimeFormat('de-CH', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(isoDateTime))
    : '';

export const dateCH = (isoDateTime) =>
  valid(isoDateTime) ? new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(isoDateTime)) : null;

export const weekdayShort = (iso) =>
  new Intl.DateTimeFormat('de-CH', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)).replace('.', '');

export const dayMonth = (iso) =>
  new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

export const longDate = (iso) =>
  !iso ? '' : new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

export function dayLabel(iso) {
  const t = todayISO();
  if (iso === t) return 'Heute';
  if (iso === addDays(t, -1)) return 'Gestern';
  if (iso === addDays(t, 1)) return 'Morgen';
  return weekdayShort(iso);
}

/** Liegt der Spielbeginn auf einem anderen Kalendertag (CH) als `iso`? -> NHL-Nacht */
export const isNextDayCH = (isoDateTime, iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(isoDateTime)) !== iso;

export const fmtDiff = (n) => (n > 0 ? `+${n}` : String(n ?? ''));
