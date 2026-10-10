// ---------------------------------------------------------------------------
// Team-Daten, die keine API liefert. Frei anpassbar!
// ---------------------------------------------------------------------------

// Vereinsfarben der National League (für die farbigen Kürzel, da die SIHF keine Logos liefert)
// [Hintergrund, Schrift]
export const NL_COLORS = {
  ZSC: ['#0b2a63', '#ffffff'],
  SCB: ['#d50f25', '#ffd200'],
  HCD: ['#003a8c', '#ffd200'],
  EVZ: ['#0a5bb0', '#ffffff'],
  HCL: ['#111111', '#ffffff'],
  FRI: ['#1c1c1c', '#ffffff'],
  GSHC: ['#7c1d34', '#ffffff'],
  LHC: ['#c8102e', '#ffffff'],
  SCRJ: ['#00377a', '#ffffff'],
  EHCB: ['#e2001a', '#ffd400'],
  SCL: ['#ffcc00', '#d0021b'],
  HCAP: ['#1d3c78', '#ffd700'],
  HCA: ['#f7c600', '#111111'],
  EHCK: ['#e30613', '#ffffff'],
};

// Schweizer Spieler in der NHL – werden in den Spieldetails markiert.
// Die Liste kannst du selbst erweitern (Nachname, wie er in der NHL-API steht).
export const SWISS_NHL = [
  'Hischier', 'Josi', 'Meier', 'Niederreiter', 'Fiala', 'Siegenthaler',
  'Moser', 'Kurashev', 'Suter', 'Biasca', 'Thürkauf', 'Rochette',
];

// Prüft, ob einer der Nachnamen als ganzes Wort im Namen vorkommt ("N. Hischier", "Nico Hischier (3)")
export const isSwiss = (name = '') => SWISS_NHL.some((n) => new RegExp(`(^|[\\s.])${n}($|[\\s(])`).test(name));

// Links zu den legalen Streaming-Anbietern
export const BROADCASTERS = {
  MYSPORTS: { label: 'MySports', url: 'https://www.mysports.ch' },
  BLUE: { label: 'blue Sport', url: 'https://www.blue.ch/sport' },
  SRF: { label: 'SRF', url: 'https://www.srf.ch/play' },
  RTS: { label: 'RTS', url: 'https://www.rts.ch/play' },
  RSI: { label: 'RSI', url: 'https://www.rsi.ch/play' },
};
