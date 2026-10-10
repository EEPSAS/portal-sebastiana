/**
 * main.jsx - Ponto de Entrada da Aplicação React
 *
 * Envolve a aplicação inteira (<App />) com o <AuthProvider>, disponibilizando
 * as informações da sessão de usuário para todas as rotas e componentes.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './components/AuthProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

