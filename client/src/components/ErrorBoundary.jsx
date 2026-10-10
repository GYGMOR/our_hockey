// Fängt Fehler in einer Seite ab, damit nicht die ganze App weiss/leer wird.
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[my_Hockey] Fehler in der Seite:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
        <p className="font-semibold">Hoppla, diese Seite konnte nicht angezeigt werden.</p>
        <p className="mt-1 font-mono text-xs text-red-300/80">{String(this.state.error?.message ?? this.state.error)}</p>
        <button type="button" onClick={() => { this.setState({ error: null }); window.history.back(); }} className="mt-3 rounded-full bg-red-500/20 px-3 py-1 font-semibold hover:bg-red-500/30">
          Zurück
        </button>
      </div>
    );
  }
}
