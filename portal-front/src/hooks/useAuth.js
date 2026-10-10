/**
 * useAuth.js - Hook Customizado de Autenticação
 *
 * Por que criar este hook?
 * Em vez de importar `useContext(AuthContext)` em todas as páginas, criamos o hook `useAuth()`.
 * Ele simplifica o consumo e valida se o componente chamador está dentro do `<AuthProvider>`,
 * emitindo um erro explicativo para o desenvolvedor caso tenha esquecido de configurá-lo.
 */
import { useContext } from 'react';
import { AuthContext } from '../contexts/authContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um componente <AuthProvider>.');
  }

  return context;
};

