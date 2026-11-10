/**
 * NoticiasTabela.jsx - Tabela Administrativa de Notícias Escolares (Módulo 2)
 *
 * Papel Didático:
 * Renderiza a listagem tabular das notícias cadastradas:
 * 1. Miniatura com fallback de imagem quebrada;
 * 2. Título, resumo, categoria e badges de destaque;
 * 3. Botões de ação para Edição e Exclusão;
 * 4. Rodapé com paginação declarativa.
 */

export default function NoticiasTabela({
  noticias,
  paginacao,
  paginaAtual,
  onAbrirEdicao,
  onSolicitarExclusao,
  onMudarPagina,
}) {
  return (
    <div className="card noticias-admin-card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
      <div className="table-responsive">
        <table className="table noticias-admin-table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" style={{ width: '80px' }}>Foto</th>
              <th scope="col">Título e Resumo</th>
              <th scope="col" style={{ width: '130px' }}>Categoria</th>
              <th scope="col" style={{ width: '140px' }}>Autor</th>
              <th scope="col" style={{ width: '110px' }}>Data</th>
              <th scope="col" style={{ width: '100px' }} className="text-center">Destaque</th>
              <th scope="col" style={{ width: '140px' }} className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {noticias.map((item) => (
              <tr key={item.id}>
                {/* Miniatura da Imagem */}
                <td>
                  {item.url_foto || item.url_miniatura ? (
                    <div className="position-relative d-inline-block rounded-3 overflow-hidden" style={{ width: '60px', height: '45px' }}>
                      <img
                        src={item.url_foto || item.url_miniatura}
                        alt={item.titulo}
                        className="w-100 h-100 rounded-3 object-fit-cover shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div
                        className="bg-light text-muted align-items-center justify-content-center rounded-3 border w-100 h-100"
                        style={{ display: 'none' }}
                      >
                        <i className="bi bi-image fs-6"></i>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-light text-muted d-flex align-items-center justify-content-center rounded-3 border"
                      style={{ width: '60px', height: '45px' }}
                    >
                      <i className="bi bi-image fs-5"></i>
                    </div>
                  )}
                </td>

                {/* Título e Resumo */}
                <td>
                  <div className="fw-semibold text-dark mb-0" style={{ fontSize: '0.92rem' }}>
                    {item.titulo}
                  </div>
                  {item.descricao && (
                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '380px' }}>
                      {item.descricao}
                    </small>
                  )}
                </td>

                {/* Categoria */}
                <td>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1">
                    {item.categoria || 'Geral'}
                  </span>
                </td>

                {/* Autor */}
                <td>
                  <span className="small text-secondary">
                    <i className="bi bi-person me-1"></i>
                    {item.autor?.name || 'Administração'}
                  </span>
                </td>

                {/* Data */}
                <td>
                  <span className="small text-muted">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('pt-BR')
                      : 'Recente'}
                  </span>
                </td>

                {/* Destaque */}
                <td className="text-center">
                  {item.destaque ? (
                    <span className="badge bg-warning-subtle text-dark border border-warning-subtle rounded-pill px-2 py-1">
                      <i className="bi bi-star-fill text-warning me-1"></i> Sim
                    </span>
                  ) : (
                    <span className="text-muted small">—</span>
                  )}
                </td>

                {/* Ações */}
                <td className="text-end">
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      title="Editar notícia"
                      onClick={() => onAbrirEdicao(item)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      title="Excluir notícia"
                      onClick={() => onSolicitarExclusao(item)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé da Tabela: Paginação */}
      {paginacao && paginacao.totalPaginas > 1 && (
        <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3">
          <span className="text-muted small">
            Página <strong>{paginacao.paginaAtual || paginaAtual}</strong> de <strong>{paginacao.totalPaginas}</strong> ({paginacao.total} matérias)
          </span>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={(paginacao.paginaAtual || paginaAtual) <= 1}
              onClick={() => onMudarPagina(Math.max(1, paginaAtual - 1))}
            >
              <i className="bi bi-chevron-left me-1"></i> Anterior
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={(paginacao.paginaAtual || paginaAtual) >= paginacao.totalPaginas}
              onClick={() => onMudarPagina(paginaAtual + 1)}
            >
              Próxima <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
