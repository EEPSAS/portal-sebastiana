/**
 * PlanoSecaoItens.jsx - Seção Modular de Materiais da Trilha (Módulo 3.4)
 *
 * Papel Didático:
 * Componente genérico e reutilizável para exibição dos materiais vinculados ao Plano:
 * - Trata os 3 tipos de materiais pedagógicos (Livros, Videoaulas e Conteúdo Web);
 * - Exibe miniatura ou emoji temático como fallback;
 * - Oferece link de acesso externo e botão de desvinculação (apenas para o proprietário).
 */

export default function PlanoSecaoItens({
  idSecao,
  tipo,
  tituloSecao,
  icone,
  itens,
  mensagemVazio,
  rotuloAcessar,
  podeEditarItens,
  removendoId,
  onRemoverItem,
}) {
  const badgeEmoji = tipo === 'livro' ? '📘' : tipo === 'videoaula' ? '📺' : '📄';
  const badgeBgClass =
    tipo === 'livro'
      ? 'bg-primary-subtle text-primary'
      : tipo === 'videoaula'
      ? 'bg-danger-subtle text-danger'
      : 'bg-info-subtle text-info';

  const thumbnailWidth = tipo === 'videoaula' ? '100px' : '64px';
  const thumbnailHeight = tipo === 'videoaula' ? '68px' : '80px';

  return (
    <section className="mb-5" aria-labelledby={idSecao}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 id={idSecao} className="fw-bold mb-0 text-dark fs-5 d-flex align-items-center gap-2">
          <span>{icone}</span> {tituloSecao} ({itens.length})
        </h4>
      </div>

      {itens.length === 0 ? (
        <div className="p-4 rounded-4 bg-light text-center text-muted border">
          <p className="mb-0 small">{mensagemVazio}</p>
        </div>
      ) : (
        <div className="row g-3">
          {itens.map((item) => (
            <div key={item.id} className="col-12 col-md-6">
              <div className="card h-100 border p-3 rounded-4 shadow-sm d-flex flex-row gap-3 align-items-center">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="rounded object-fit-cover flex-shrink-0"
                    style={{ width: thumbnailWidth, height: thumbnailHeight }}
                  />
                ) : (
                  <div
                    className={`${badgeBgClass} rounded d-flex align-items-center justify-content-center flex-shrink-0`}
                    style={{ width: thumbnailWidth, height: thumbnailHeight, fontSize: '28px' }}
                  >
                    {badgeEmoji}
                  </div>
                )}
                <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                  <h5 className="h6 fw-bold text-dark mb-1 text-truncate" title={item.titulo}>
                    {item.titulo}
                  </h5>

                  {item.fonte && (
                    <p className="text-muted small mb-1 text-truncate">
                      {tipo === 'videoaula' ? `Canal: ${item.fonte}` : item.fonte}
                    </p>
                  )}

                  {item.duracao && (
                    <div className="mb-1">
                      <span className="badge bg-primary-subtle text-primary rounded-pill small">
                        ⏱️ {item.duracao}
                      </span>
                    </div>
                  )}

                  {item.descricao && (
                    <p className="text-secondary small mb-2 text-truncate">{item.descricao}</p>
                  )}

                  <div className="d-flex gap-2 mt-auto">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn btn-sm ${
                          tipo === 'videoaula' ? 'btn-primary' : 'btn-outline-primary'
                        } rounded-pill px-3 small`}
                      >
                        {rotuloAcessar} ↗
                      </a>
                    )}
                    {podeEditarItens && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 small"
                        onClick={() => onRemoverItem(item.id)}
                        disabled={removendoId === item.id}
                      >
                        {removendoId === item.id ? 'Removendo...' : 'Desvincular'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
