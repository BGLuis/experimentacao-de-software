import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6 sm:p-8 text-center my-6 shadow-sm">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2">
            {this.props.fallbackTitle || "Ocorreu um erro ao renderizar este componente"}
          </h3>
          <p className="text-sm text-red-700 max-w-lg mx-auto mb-5">
            {this.state.error?.message || "Ocorreu uma falha inesperada durante a execução da interface ou do processamento de dados."}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw size={15} />
            <span>Tentar Novamente</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
