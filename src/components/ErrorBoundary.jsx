import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100">
                <h1 className="text-xl font-bold text-red-600 mb-4">Application Error</h1>
                <p className="text-sm text-slate-500 mb-4">Please check the console for details.</p>
                <pre className="mt-2 text-xs text-red-400 bg-red-50 p-4 rounded text-left overflow-auto max-w-md">{this.state.error?.toString()}</pre>
                <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Refresh Page</button>
            </div>
        </div>
      );
    }
    return this.props.children;
  }
}
