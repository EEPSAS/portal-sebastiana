/**
 * authContext.js - Objeto de Contexto de Autenticação do React
 *
 * Didática:
 * Separamos o `createContext` em um arquivo próprio para cumprir o princípio de responsabilidade
 * única e atender às regras do ESLint/Vite Fast Refresh (arquivos .jsx que exportam componentes
 * devem exportar apenas componentes).
 */
import { createContext } from 'react';

export const AuthContext = createContext(null);
