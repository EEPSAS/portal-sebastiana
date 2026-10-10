/**
 * ProtectedRoute.jsx - Guarda de Rotas Autenticadas e Controle de Acesso por Perfil
 *
 * Conceito Didático:
 * Em aplicações de página única (SPA), rotas privadas não podem ser acessadas por visitantes
 * anônimos nem por usuários sem a devida permissão. Este componente atua como uma barreira:
 * 1. Enquanto a sessão é verificada na API, exibe um indicador amigável de carregamento.
 * 2. Se não estiver logado, redireciona o usuário para o `/login`.
 * 3. Se a rota exigir perfis específicos (`allowedRoles`) e o perfil do usuário não estiver
 *    na lista, redireciona-o automaticamente para a página inicial do seu perfil, evitando
 *    erros 403 e mantendo a navegação consistente.
 */

import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Estado 1: Carregando a validação inicial do token
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted fw-semibold">Verificando credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  // Estado 2: Usuário não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Estado 3: Validação de perfil (Role-Based Access Control)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'aluno';
    const temPermissao = allowedRoles.includes(userRole);

    if (!temPermissao) {
      // Redireciona para o destino padrão seguro de acordo com o perfil
      const rotaPadrao =
        userRole === 'bibliotecaria' || userRole === 'bibliotecario'
          ? '/dashboard/biblioteca'
          : '/dashboard/geral';
      return <Navigate to={rotaPadrao} replace />;
    }
  }

  // Acesso permitido: renderiza as rotas filhas declaradas dentro de ProtectedRoute
  return <Outlet />;
};

export default ProtectedRoute;
