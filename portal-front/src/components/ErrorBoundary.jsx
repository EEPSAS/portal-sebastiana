/**
 * ErrorBoundary.jsx - Capturador de Exceções de Renderização no React
 *
 * Papel Didático:
 * Em React, um ErrorBoundary captura exceções de renderização que ocorram em
 * qualquer componente filho (como mutações de nós por extensões ou traduções automáticas),
 * impedindo que a aplicação inteira caia em tela branca e oferecendo recuperação amigável.
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
    console.warn('ErrorBoundary capturou um erro de reconciliação:', error?.message, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <div className="alert alert-warning p-4 rounded-4 shadow-sm mx-auto" style={{ maxWidth: '520px' }}>
            <span className="fs-1 d-block mb-2">⚠️</span>
            <h5 className="fw-bold mb-2 text-dark">Falha temporária ao renderizar este componente</h5>
            <p className="text-muted small mb-3">
              Isso costuma ocorrer quando uma extensão (ou o tradutor automático do navegador)
              modifica os nós de texto da página durante a renderização.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
