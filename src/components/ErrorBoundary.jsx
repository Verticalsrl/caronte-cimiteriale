import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Qualcosa è andato storto</h2>
            <p className="text-slate-500 text-sm mb-6">
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Ricarica la pagina
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
