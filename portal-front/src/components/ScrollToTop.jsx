/**
 * ScrollToTop.jsx - Utilitário Global de Restauração de Rolagem em SPAs
 *
 * Papel Didático:
 * Em aplicações SPA com React Router, a mudança de rota não recarrega o navegador
 * e, por padrão, mantém a posição anterior de scroll (Y).
 * Este componente escuta qualquer mudança no caminho (`pathname`) da URL e
 * rola a tela instantaneamente para o topo (0, 0), garantindo que o usuário
 * sempre inicie a leitura da nova página pelo cabeçalho/conteúdo principal.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Rola a janela até o topo (x: 0, y: 0) a cada transição de rota
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
