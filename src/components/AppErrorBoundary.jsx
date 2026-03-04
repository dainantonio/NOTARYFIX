import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info);
  }

  handleReset = async () => {
    try {
      localStorage.removeItem('notaryfix_data');
      sessionStorage.clear();
    } catch (_) {
      // no-op
    }

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (_) {
      // no-op
    }

    window.location.href = `${import.meta.env.BASE_URL}`;
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            We hit a runtime error while loading the app. You can reset local app data and reload.
          </p>
          {this.state.error?.message ? (
            <p className="mt-3 rounded-lg bg-slate-100 dark:bg-slate-900 p-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              {this.state.error.message}
            </p>
          ) : null}
          <div className="mt-5 flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Reset and Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
