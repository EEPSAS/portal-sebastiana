// Função auxiliar para renderizar o ícone com base no tipo de atualização
function RenderUpdateIcon({ tipo }) {
  if (tipo === 'notificacao' || tipo === 'manual') {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
    );
  }

  if (tipo === 'noticia') {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
         <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H5V5h14v12zm-2-7H7v2h11v-2zM7 14h11v2H7v-2zm0-6h11v2H7V8z"/>
      </svg>
    );
  }
  if (tipo === 'notas' || tipo === 'nota') {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    );
  }
  if (tipo === 'biblioteca') {
    return <i className="bi bi-book-fill" style={{ fontSize: '0.85rem' }}></i>;
  }
  if (tipo === 'aprovacao_login') {
    return <i className="bi bi-person-check-fill" style={{ fontSize: '0.85rem' }}></i>;
  }
  
  // Ícone padrão
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}


export default function UpdateItem({
  tipo,
  categoria,
  categoriaRotulo,
  texto,
  titulo,
  assunto,
  criadorNome,
  destinatarioNome,
  tempoAtras,
}) {
  const descricaoTooltip = assunto || titulo || texto;

  return (
    <div className="geral-update-item" title={descricaoTooltip}>
      <div className="d-flex align-items-center gap-3 min-w-0">
        {/* Ícone Redondo com fundo azul claro e ícone azul royal */}
        <div className="geral-update-icon-wrapper flex-shrink-0">
          <RenderUpdateIcon tipo={categoria || tipo} />
        </div>

        {/* Informações da Notificação */}
        <div className="d-flex flex-column min-w-0">
          <span className="geral-update-text text-truncate">
            {texto}
          </span>
          {(destinatarioNome || criadorNome || categoriaRotulo) && (
            <div className="d-flex align-items-center gap-2 small text-muted flex-wrap" style={{ fontSize: '0.73rem', marginTop: '1px' }}>
              {categoriaRotulo && (
                <span className="badge rounded-pill bg-light text-secondary border fw-normal py-0 px-2" style={{ fontSize: '0.68rem' }}>
                  {categoriaRotulo}
                </span>
              )}
              {criadorNome && <span>De: <strong>{criadorNome}</strong></span>}
              {destinatarioNome && <span>Para: <strong>{destinatarioNome}</strong></span>}
            </div>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center flex-shrink-0 ms-2">
        {/* Tempo Atrás */}
        <span className="geral-update-time text-nowrap">
          {tempoAtras}
        </span>
        {/* Seta discreta indicando linha clicável/detalhes */}
        <i className="bi bi-chevron-right geral-update-chevron ms-1"></i>
      </div>
    </div>
  );
}