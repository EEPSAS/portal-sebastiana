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
              Vozes que informam, ideias que transformam.
            </p>

            <p className="portal-podcast__desc">
              A Radioatividade é o podcast oficial do Terceirão 2026, produzido pelos próprios estudantes para debater temas que importam: educação, carreira, sociedade, ciência e cidadania.
            </p>

            <a href="#saiba-mais" className="portal-podcast__btn-learn">
              Saiba mais sobre o projeto &rarr;
            </a>

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
                <p className="portal-podcast__feature-desc">Educação, sociedade, mercado, escolhas e atualidades.</p>
              </div>

              <div className="portal-podcast__feature-card">
                <div className="portal-podcast__feature-icon">📡</div>
                <h4 className="portal-podcast__feature-title">Semanal</h4>
                <p className="portal-podcast__feature-desc">Novos episódios a cada semana nas principais plataformas.</p>
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
                  Ep. 03 – Escolhas que moldam o futuro
                </h3>
                <p>
                  Nossos alunos conversam sobre carreira, mercado de trabalho, propósito e como fazer escolhas mais conscientes para o vestibular e a vida profissional.
                </p>
              </div>
              <div className="portal-podcast__featured-actions">
                <button type="button" className="portal-podcast__btn-listen">
                  Ouvir episódio
                </button>
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
                <button type="button" className="portal-podcast__play-circle" aria-label="Tocar episódio 2">
                  ▶
                </button>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 02 - Saúde mental na adolescência
                  </h4>
                </div>
              </div>

              <div className="portal-podcast__episode-item">
                <button type="button" className="portal-podcast__play-circle" aria-label="Tocar episódio 1">
                  ▶
                </button>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 01 - O que nos move?
                  </h4>
                </div>
              </div>

              <div className="portal-podcast__episode-item">
                <button type="button" className="portal-podcast__play-circle" aria-label="Tocar episódio piloto">
                  ▶
                </button>
                <div className="portal-podcast__episode-info">
                  <h4 className="portal-podcast__episode-title">
                    Ep. 00 - Piloto: Boas-vindas!
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
