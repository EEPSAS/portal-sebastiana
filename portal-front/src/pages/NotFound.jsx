/**
 * NotFound.jsx - Página de Rota Não Encontrada (404)
 *
 * Papel Didático:
 * Em SPAs com React Router, a rota `*` captura qualquer URL digitada pelo usuário
 * que não coincida com as rotas registradas. Em vez de apresentar tela branca ou erro de rede,
 * orientamos o usuário com uma mensagem clara e um botão para retornar à Home.
 */

import { Link } from 'react-router';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light text-center p-4">
      <div className="card shadow-sm border-0 p-5 rounded-4" style={{ maxWidth: '480px' }}>
        <h1 className="display-1 fw-bold text-primary mb-3">404</h1>
        <h2 className="fs-4 fw-semibold text-dark mb-2">Página não encontrada</h2>
        <p className="text-muted mb-4">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link to="/" className="btn btn-primary fw-semibold px-4 py-2 rounded-pill">
          <i className="bi bi-house-door me-2"></i> Voltar ao Portal
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
