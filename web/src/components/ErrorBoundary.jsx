import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FUHSI ERS ErrorBoundary caught an error:', error, errorInfo);
  }

  handleHardRefresh = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (let name of names) caches.delete(name);
      });
    }
    localStorage.removeItem('fuhsi_token');
    localStorage.removeItem('fuhsi_user_data');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D2040] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M9 11h6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">FUHSI ERS — Emergency Service</h1>
          <p className="text-xs text-slate-300 max-w-sm mb-6">
            A client cache update is required. Please tap below to refresh and load the latest emergency service interface.
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg"
            >
              Refresh Application
            </button>
            <button
              onClick={this.handleHardRefresh}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-white/20"
            >
              Clear Cache & Reset
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 text-left max-w-sm w-full bg-black/40 border border-red-500/30 rounded-xl p-3 text-[11px] text-red-200 overflow-x-auto">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-mono text-[10px]">
                Technical Diagnostics
              </summary>
              <p className="mt-2 font-mono text-red-400 break-all">{this.state.error?.toString()}</p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
