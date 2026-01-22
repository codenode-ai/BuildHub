import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Erro inesperado na UI:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground">
            Atualize a pagina para continuar.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
