/**
 * AuthProvider.jsx - Provedor Global de Autenticação, Sessão e Simulação para Administrador
 *
 * Conceito Didático:
 * O Context API permite compartilhar o estado do usuário logado (nome, papel/role, token)
 * com qualquer tela ou componente da aplicação.
 *
 * Resolução do Bug de Tela de Carregamento Infinita:
 * 1. O estado `loading` só é ativado se houver um token salvo E ainda não tivermos o usuário
 *    em cache. Se o usuário já estiver salvo no localStorage, a aplicação inicia instantaneamente.
 * 2. O `useEffect` valida o token com o backend de forma segura, garantindo que `setLoading(false)`
 *    seja sempre executado no bloco `finally`, prevenindo qualquer travamento em loading infinito.
 * 3. Suporte nativo à simulação de papéis pelo Administrador (`switchSimulatedRole`),
 *    atualizando o estado do React imediatamente para permitir navegação SPA fluida.
 */

import { useEffect, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import * as authService from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [user, setUser] = useState(() => authService.getStoredUser());

  // Só ativa a tela de carregamento se há token salvo mas os dados do usuário ainda não estão no cache
  const [loading, setLoading] = useState(() => Boolean(authService.getStoredToken() && !authService.getStoredUser()));

  // Papel simulado pelo Administrador (lido do localStorage)
  const [simulatedRole, setSimulatedRole] = useState(
    () => localStorage.getItem('admin_simulated_role') || null
  );

  /**
   * Efeito de Validação de Token:
   * Confirma em segundo plano se o token armazenado continua válido na API Sanctum.
   */
  useEffect(() => {
    // Se não há token, o estado inicial de loading já é false
    if (!token) return;

    let isMounted = true;

    authService
      .fetchCurrentUser()
      .then((usuarioValido) => {
        if (isMounted) {
          setUser(usuarioValido);
        }
      })
      .catch((err) => {
        // Se a sessão expirou no backend (status 401), desloga o usuário
        if (isMounted && err?.status === 401) {
          localStorage.removeItem('admin_simulated_role');
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  /**
   * Função executada no formulário de login.
   * Salva o token e dados do usuário retornado pela API Sanctum.
   */
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data;
  };

  /**
   * Função para encerrar a sessão do usuário.
   * Redireciona obrigatoriamente para a página inicial pública do portal (/).
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignora erro de rede para assegurar a limpeza dos dados locais
    }
    localStorage.removeItem('admin_simulated_role');
    setSimulatedRole(null);
    setToken(null);
    setUser(null);
    // Redireciona diretamente para o portal público
    window.location.href = '/';
  };

  /**
   * Alterna a visualização ativa para o administrador (simulação de perfil).
   */
  const switchSimulatedRole = (novaRole) => {
    const isAdmin = user?.role === 'adm' || user?.realRole === 'adm';
    if (isAdmin) {
      if (!novaRole || novaRole === 'adm') {
        localStorage.removeItem('admin_simulated_role');
        setSimulatedRole(null);
      } else {
        localStorage.setItem('admin_simulated_role', novaRole);
        setSimulatedRole(novaRole);
      }
    }
  };

  // Identificação do papel original vs papel simulado
  const realRole = user?.role || 'aluno';
  const isRealAdmin = realRole === 'adm';
  const effectiveRole = isRealAdmin && simulatedRole ? simulatedRole : realRole;

  // Objeto de usuário exposto com a role ativa e sinalizador de simulação
  const effectiveUser = user
    ? {
        ...user,
        role: effectiveRole,
        realRole,
        isSimulated: Boolean(isRealAdmin && simulatedRole && simulatedRole !== 'adm'),
      }
    : null;

  const value = {
    user: effectiveUser,
    token,
    loading,
    login,
    logout,
    switchSimulatedRole,
    isRealAdmin,
    simulatedRole,
    isAuthenticated: Boolean(token && user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
