// Grundgerüst: Kopfzeile, Navigation und die Seiten (Routen)
import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import Scores from './pages/Scores.jsx';
import Standings from './pages/Standings.jsx';
import Game from './pages/Game.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const NAV = [
  { to: '/', label: 'Spiele', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/tabellen', label: 'Tabellen', icon: 'M4 5h16v14H4zM4 10h16M10 5v14' },
];

function Icon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent shadow-lg shadow-accent/30">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 3l7 13M19 3l-7 13" />
          <ellipse cx="12" cy="19" rx="5" ry="2" fill="#fff" />
        </svg>
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">my<span className="text-accent">_</span>Hockey</span>
    </Link>
  );
}

export default function App() {
  const location = useLocation();
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-ink-300 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1a1f2e_0%,_#07090f_60%)]">
      {/* Kopfzeile (Desktop) */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkClass}>
                <Icon d={n.icon} /> {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pb-12">
        {/* key: beim Seitenwechsel wird ein evtl. Fehler zurückgesetzt */}
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Scores />} />
          <Route path="/tabellen" element={<Standings />} />
          <Route path="/spiel/:league/:id" element={<Game />} />
          <Route path="*" element={<p className="text-ink-400">Seite nicht gefunden.</p>} />
        </Routes>
        </ErrorBoundary>
      </main>

      {/* Untere Tab-Leiste (Handy) – wie bei einer App */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-white/5 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? 'text-accent' : 'text-ink-400'}`}
          >
            <Icon d={n.icon} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
