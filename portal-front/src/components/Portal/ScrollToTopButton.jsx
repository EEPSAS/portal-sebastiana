/**
 * ScrollToTopButton.jsx - Botão Flutuante de Retorno ao Topo / Hero
 *
 * Conceito Didático:
 * 1. Estado de Visibilidade (useState): Controla se o botão deve estar visível ou não na interface,
 *    evitando poluir a visualização enquanto o usuário ainda está no topo contemplando a seção Hero.
 * 2. Efeito Colateral e Limpeza de Eventos (useEffect): Adicionamos um ouvinte ('scroll') na janela do
 *    navegador para inspecionar a posição de rolagem vertical (window.scrollY). A função de retorno (cleanup)
 *    remove o ouvinte para prevenir vazamento de memória (memory leak) caso o componente seja desmontado.
 * 3. Rolagem Suave (Smooth Scroll API): window.scrollTo({ top: 0, behavior: 'smooth' }) instrui o navegador
 *    a animar suavemente a subida de volta ao cabeçalho.
 */

import { useEffect, useState } from "react";

const ScrollToTopButton = () => {
  // Estado que armazena se o botão deve ser visível na tela
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Função disparada a cada movimento de rolagem da tela
    const handleScroll = () => {
      // Exibe o botão apenas se o usuário rolou mais de 300 pixels para baixo
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Registra o ouvinte no evento de rolagem global da janela
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Função de limpeza: remove o ouvinte ao desmontar o componente
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Executa o deslocamento suave até o topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      className={`portal-scroll-top ${isVisible ? "portal-scroll-top--visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Voltar ao início da página"
      title="Voltar ao início"
    >
      <i className="bi bi-arrow-up-short" aria-hidden="true" />
    </button>
  );
};

export default ScrollToTopButton;
