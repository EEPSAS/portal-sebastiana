/**
 * ErrorBoundary.jsx - Capturador de Exceções com Redirecionamento de Segurança
 *
 * Papel Didático:
 * Captura qualquer exceção de renderização no React e, em conformidade com as diretrizes
 * da plataforma, redireciona o usuário de forma limpa para o portal público (`/`),
 * evitando telas quebradas ou travamentos de interface.
 */

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ErrorBoundary capturou uma falha na rota. Redirecionando para o portal público...', error?.message, errorInfo);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.replace('/');
    }
  }

  handleRedirecionarPortal = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  render() {
    if (this.state.hasError) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        return null;
      }
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-warning p-4 rounded-4 shadow-sm mx-auto" style={{ maxWidth: '520px' }}>
            <span className="fs-1 d-block mb-2">⚠️</span>
            <h5 className="fw-bold mb-2 text-dark">Portal Sebastiana</h5>
            <p className="text-muted small mb-3">
              Ocorreu uma instabilidade inesperada na página.
            </p>
            <button
              type="button"
              onClick={this.handleRedirecionarPortal}
              className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
            >
              Ir para o Portal Público
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
