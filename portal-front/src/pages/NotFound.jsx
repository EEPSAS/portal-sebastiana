/**
 * NotFound.jsx - Redirecionamento Universal para o Portal Público
 *
 * Papel Didático:
 * Em consonância com a diretriz de experiência do usuário do Portal Sebastiana,
 * qualquer rota não validada, inexistente ou com falha redireciona o usuário
 * imediatamente para a Home do Portal Público (`/`).
 */

import { Navigate } from 'react-router';

const NotFound = () => {
  return <Navigate to="/" replace />;
};

export default NotFound;
