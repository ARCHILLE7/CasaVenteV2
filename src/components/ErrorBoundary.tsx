import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Une erreur inattendue est survenue.' };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CasaVente ErrorBoundary caught error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <h1 className="text-xl font-bold text-[#142B4A]">Une erreur s’est produite</h1>
            <p className="text-sm text-slate-600">
              L’application a rencontré un problème temporaire. Veuillez actualiser la page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] cursor-pointer"
            >
              Recharger CasaVente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
