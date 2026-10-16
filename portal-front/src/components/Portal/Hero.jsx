/**
 * Hero.jsx - Seção Hero Cinematográfica do Portal Sebastiana
 *
 * Conceito Didático:
 * 1. Banner Cinematográfico (Hero Banner): Elemento visual posicionado acima da dobra (above the fold)
 *    com alta autoridade institucional, combinando fotografia autêntica da fachada da escola com
 *    degradê suave para criar uma zona de leitura (reading zone) com contraste e legibilidade acessível.
 * 2. Rolagem Suave (Smooth Scroll): O botão de chamada para ação (CTA) utiliza uma âncora (#Sobre-nos)
 *    para conduzir o usuário naturalmente até as seções informativas da instituição.
 */

import "./hero.css";

const fotoEscola = "/img/fotoescola.jpg";

const HeroSection = () => {
  return (
    <section id="Hero" className="portal-hero" aria-label="Apresentação da Escola">
      {/* Imagem de fundo institucional da fachada em tela cheia */}
      <img
        src={fotoEscola}
        alt="Fachada da Escola Estadual Professora Sebastiana de Almeida e Silva"
        className="portal-hero__image"
        loading="eager"
        decoding="async"
      />

      {/* Camada de fusão com gradiente azul profundo para legibilidade dos textos */}
      <div className="portal-hero__overlay" aria-hidden="true" />

      {/* Conteúdo textual institucional sobreposto à esquerda */}
      <div className="portal-hero__container">
        <div className="portal-hero__content">
          <p className="portal-hero__eyebrow">
            Tradição, Conhecimento
            <br />
            e Grandes Conquistas
          </p>

          <h1 className="portal-hero__title">
            E.E. Prof. Sebastiana
            <br />
            de Almeida e Silva
          </h1>

          <span className="portal-hero__divider" aria-hidden="true" />

          <p className="portal-hero__description">
            Formando cidadãos críticos, responsáveis
            <br className="d-none d-sm-inline" />
            e preparados para o futuro.
          </p>

          <a href="#Sobre-nos" className="portal-hero__cta">
            <span>Conheça Nossa Escola</span>
            <span className="portal-hero__cta-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;