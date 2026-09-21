

const PodcastSection = () => {
  return (
<section className="radioatividade-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      {/* GRID PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

        {/* COLUNA ESQUERDA */}
        <div>
          <span style={{ color: '#e6007e', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            PODCAST DO TERCEIRÃƒO 2026
          </span>

          <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '10px 0', color: '#1a103c' }}>
            RADIO<span style={{ color: '#e6007e' }}>ATIVIDADE</span>
          </h1>

          <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#1a103c', marginBottom: '10px' }}>
            Vozes que informam, ideias que transformam.
          </p>

          <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#444', marginBottom: '20px' }}>
            A Radioatividade Ã© o podcast oficial do TerceirÃ£o 2026, produzido pelos prÃ³prios alunos para falar sobre temas que importam: educaÃ§Ã£o, carreira, sociedade, ciÃªncia e muito mais.
          </p>

          <a href="#saiba-mais" style={{ display: 'inline-block', border: '2px solid #e6007e', color: '#e6007e', padding: '10px 20px', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '30px' }}>
            Saiba mais sobre o projeto &rarr;
          </a>

          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a103c', marginBottom: '15px' }}>
            ConheÃ§a a Radioatividade
          </h3>

          {/* 4 CARDS PEQUENOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(110px, 1fr) )', gap: '10px' }}>
            <div style={{ border: '1px solid #ccc', padding: '12px 8px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>ðŸŽ™ï¸</div>
              <h4 style={{ fontSize: '13px', margin: '5px 0' }}>Feito por alunos</h4>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Produzido pelos estudantes do TerceirÃ£o 2026.</p>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '12px 8px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>ðŸ“»</div>
              <h4 style={{ fontSize: '13px', margin: '5px 0' }}>Temas relevantes</h4>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Conversas sobre educaÃ§Ã£o, sociedade, carreira e atualidades.</p>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '12px 8px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>ðŸ“¡</div>
              <h4 style={{ fontSize: '13px', margin: '5px 0' }}>Novos episÃ³dios</h4>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>EpisÃ³dios novos todas as semanas nas principais plataformas.</p>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '12px 8px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>ðŸ‘¥</div>
              <h4 style={{ fontSize: '13px', margin: '5px 0' }}>Para toda a comunidade</h4>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>ConteÃºdo feito para informar e inspirar alunos, famÃ­lias e educadores.</p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div>
          {/* CARD GRANDE / VÃDEO EM DESTAQUE */}
          <div style={{ position: 'relative', backgroundColor: '#1a103c', color: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '25px', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', tracking: '1px', color: '#aaa' }}>EPISÃ“DIO EM DESTAQUE</span>
              <h2 style={{ fontSize: '20px', margin: '8px 0' }}>Ep. 03 â€“ Escolhas que moldam o futuro</h2>
              <p style={{ fontSize: '12px', color: '#ddd', lineHeight: '1.4' }}>
                Nossos alunos conversam sobre carreira, mercado de trabalho, propÃ³sito e como fazer escolhas mais conscientes para o futuro.
              </p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button style={{ backgroundColor: '#e6007e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                Ouvir episÃ³dio
              </button>
              <button style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid #fff', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                Ver no Youtube ðŸ”—
              </button>
            </div>
          </div>

          {/* LISTA DE EPISÃ“DIOS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Ãšltimos episÃ³dios</h3>
            <a href="#todos" style={{ color: '#e6007e', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
              Ver todos os episÃ³dios &rarr;
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '100px', height: '60px', backgroundColor: '#ddd', borderRadius: '4px' }}></div>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e6007e', color: '#fff', cursor: 'pointer' }}>â–¶</button>
              <div>
                <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Ep.02-SaÃºde mental na adolescÃªncia</h4>
                <span style={{ fontSize: '11px', color: '#777' }}>10 mai 2026 - 28:15</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '100px', height: '60px', backgroundColor: '#ddd', borderRadius: '4px' }}></div>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e6007e', color: '#fff', cursor: 'pointer' }}>â–¶</button>
              <div>
                <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Ep.01-O que nos move?</h4>
                <span style={{ fontSize: '11px', color: '#777' }}>03 mai 2026 - 24:30</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '100px', height: '60px', backgroundColor: '#ddd', borderRadius: '4px' }}></div>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#e6007e', color: '#fff', cursor: 'pointer' }}>â–¶</button>
              <div>
                <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Ep.00-Piloto:Boas-vindas!</h4>
                <span style={{ fontSize: '11px', color: '#777' }}>26 abr 2026 - 15:40</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BARRA INFERIOR DAS PLATAFORMAS */}
      <div style={{ marginTop: '40px', backgroundColor: '#fce4ec', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#1a103c' }}>OuÃ§a a Radioatividade onde quiser</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Estamos disponÃ­veis nas principais plataformas de podcast.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: 'bold' }}>
          <span>â–¶ Youtube</span>
          <span>ðŸŸ¢ Spotify</span>
          <span>ðŸŽ™ï¸ Apple Podcast</span>
          <span>ðŸ“Š Google Podcasts</span>
        </div>
      </div>

    </section>
  )
}

export default PodcastSection
