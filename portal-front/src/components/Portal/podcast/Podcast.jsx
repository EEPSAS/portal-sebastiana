/**
 * Podcast.jsx - Seção Institucional do Projeto "Radioatividade" (Podcast Escolar)
 *
 * Papel Didático:
 * Apresenta na página inicial do Portal o projeto de protagonismo estudantil do Terceirão.
 */
import './podcast.css';

const PodcastSection = () => {
  return (
    <section id="podcast" className="portal-podcast-section">
      <div className="container">
        {/* GRID PRINCIPAL */}
        <div className="row gy-5 align-items-start">

          {/* COLUNA ESQUERDA: APRESENTAÇÃO */}
          <div className="col-12 col-lg-6">
            <span className="portal-podcast__badge">
              PODCAST DO TERCEIRÃO 2026
            </span>

            <h2 className="portal-podcast__title">
              RADIO<span>ATIVIDADE</span>
            </h2>

            <p className="portal-podcast__lead">
              O conhecimento é o maior ato de rebeldia contra o sistema.
            </p>

            <p className="portal-podcast__desc">
              A Radioatividade é o podcast oficial do Terceirão 2026, produzido pelos próprios estudantes para debater temas que importam: educação, carreira, sociedade, ciência e cidadania.
            </p>

            <p  className="portal-podcast__btn-learn">
              Saiba mais sobre o projeto
            </p>

            <h3 className="portal-podcast__section-heading">
              Conheça a Radioatividade
            </h3>

            {/* 4 CARDS PEQUENOS */}
            <div className="portal-podcast__features-grid">
              <div className="portal-podcast__feature-card">
                <div className="portal-podcast__feature-icon">🎙️</div>
                <h4 className="portal-podcast__feature-title">Feito por alunos</h4>
                <p className="portal-podcast__feature-desc">Produzido integralmente pelos estudantes do Terceirão 2026.</p>
              </div>

              <div className="portal-podcast__feature-card">
                <div className="portal-podcast__feature-icon">📻</div>
                <h4 className="portal-podcast__feature-title">Temas atuais</h4>
                <p className="portal-podcast__feature-desc">Abordagem relevante e atualizada sobre os temas que impactam a vida dos estudantes.</p>
              </div>

              <div className="portal-podcast__feature-card">
                <div className="portal-podcast__feature-icon">📡</div>
                <h4 className="portal-podcast__feature-title">Senso de pertencimento</h4>
                <p className="portal-podcast__feature-desc">Fortalecimento do sentimento de pertencimento à comunidade estudantil.</p>
              </div>

              <div className="portal-podcast__feature-card">
                <div className="portal-podcast__feature-icon">👥</div>
                <h4 className="portal-podcast__feature-title">Comunidade</h4>
                <p className="portal-podcast__feature-desc">Conteúdo de valor para estudantes, famílias e educadores.</p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: EPISÓDIOS & DESTAQUE */}
          <div className="col-12 col-lg-6">
            {/* CARD GRANDE EM DESTAQUE */}
            <div className="portal-podcast__featured-card">
              <div>
                <span className="portal-podcast__tag">EPISÓDIO EM DESTAQUE</span>
                <h3 className="portal-podcast__featured-title">
                  Ep. 01 – COMO FUNCIONA O PORTAL-SEBASTIANA
                </h3>
                <p>
                 Os criadores do Portal Sebastiana explicam como funciona a plataforma, o que é possível fazer e como os estudantes podem se beneficiar dela.
                </p>
              </div>
              <div className="portal-podcast__featured-actions">

                
                <a href="https://youtu.be/DVkXXb2DGG4?is=eqgaOGd8ax8kGiHq" type="button" className="portal-podcast__btn-listen text-decoration-none" target="_blank"  >
                  Ouvir episódio
                </a>
              </div>
            </div>

            {/* LISTA DE EPISÓDIOS */}
            <div className="portal-podcast__episodes-header">
              <h3 className="portal-podcast__episodes-title">
                Últimos episódios
              </h3>
            </div>

            <div className="portal-podcast__episodes-list">
              <div className="portal-podcast__episode-item">
                <a href="https://youtu.be/DVkXXb2DGG4?is=eqgaOGd8ax8kGiHq" type="button" className="portal-podcast__play-circle text-decoration-none" aria-label="Tocar episódio 2" target="_blank">
                  ▶
                </a>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 01 Entrevista com os professores do técnico 
                  </h4>
                </div>
              </div>

              <div className="portal-podcast__episode-item">
               <a href="https://youtu.be/DVkXXb2DGG4?is=eqgaOGd8ax8kGiHq" type="button" className="portal-podcast__play-circle text-decoration-none" aria-label="Tocar episódio 2" target="_blank">
                  ▶
                </a>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 02 - Entrevista com o professor de física
                  </h4>
                </div>
              </div>

              <div className="portal-podcast__episode-item">
                <a href="https://youtu.be/DVkXXb2DGG4?is=eqgaOGd8ax8kGiHq" type="button" className="portal-podcast__play-circle text-decoration-none" aria-label="Tocar episódio 2" target="_blank">
                  ▶
                </a>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 03 - O que esperar da Copa do Mundo 
                  </h4>
                </div>
              </div>
            </div>
          </div>

        </div>

       
        

      </div>
    </section>
  );
};

export default PodcastSection;
