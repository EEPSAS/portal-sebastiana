/**
 * ModalNoticia.jsx - Diálogo Modal para Criação e Edição de Notícias (Módulo 2)
 *
 * Papel Didático:
 * Renderiza o formulário completo de gestão editorial de notícias:
 * 1. Campos: Título, Categoria, Resumo, Conteúdo e Switch de Destaque;
 * 2. Uploads de arquivo com pré-visualização instantânea (Capa e Miniatura);
 * 3. Validação inline de campos obrigatórios com mensagens em português;
 * 4. Rodapé fixo (sticky footer) para facilitar o salvamento em telas menores.
 */

const CATEGORIAS_SUGERIDAS = [
  'Geral',
  'Avisos',
  'Pedagógico',
  'Eventos',
  'Biblioteca',
  'Projetos',
];

export default function ModalNoticia({
  aberto,
  modoEdicao,
  formulario,
  errosValidacao,
  salvando,
  onFechar,
  onCampoChange,
  onArquivoChange,
  onSubmit,
}) {
  if (!aberto) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
        <div className="modal-content border-0 shadow-lg rounded-4 d-flex flex-column" style={{ maxHeight: '90vh' }}>
          <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0 bg-white">
            <h2 className="modal-title h5 fw-bold text-dark d-flex align-items-center gap-2 mb-0">
              <i className={`bi ${modoEdicao ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'}`}></i>
              {modoEdicao ? 'Editar Notícia Escolar' : 'Cadastrar Nova Notícia'}
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              disabled={salvando}
              onClick={onFechar}
            ></button>
          </div>

          <form onSubmit={onSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden m-0">
            <div className="modal-body px-4 py-3 overflow-y-auto" style={{ flex: '1 1 auto' }}>
              {/* Erro geral de salvamento */}
              {errosValidacao.geral && (
                <div className="alert alert-danger small py-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errosValidacao.geral}
                </div>
              )}
              <div className="row g-3">
                {/* Título */}
                <div className="col-12 col-md-8">
                  <label htmlFor="titulo" className="form-label fw-semibold small text-dark">
                    Título da Matéria <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    className={`form-control ${errosValidacao.titulo ? 'is-invalid' : ''}`}
                    placeholder="Ex: Semana de Avaliações Institucionais 2026"
                    value={formulario.titulo}
                    onChange={onCampoChange}
                    disabled={salvando}
                    required
                  />
                  {errosValidacao.titulo && (
                    <div className="invalid-feedback">
                      {Array.isArray(errosValidacao.titulo) ? errosValidacao.titulo[0] : errosValidacao.titulo}
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="col-12 col-md-4">
                  <label htmlFor="categoria" className="form-label fw-semibold small text-dark">
                    Categoria
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    className="form-select"
                    value={formulario.categoria}
                    onChange={onCampoChange}
                    disabled={salvando}
                  >
                    {CATEGORIAS_SUGERIDAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resumo / Descrição Curta */}
                <div className="col-12">
                  <label htmlFor="descricao" className="form-label fw-semibold small text-dark">
                    Resumo / Descrição Breve
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    name="descricao"
                    className="form-control"
                    placeholder="Breve linha explicativa que aparece nos cards do portal"
                    value={formulario.descricao}
                    onChange={onCampoChange}
                    disabled={salvando}
                    maxLength={500}
                  />
                </div>

                {/* Conteúdo Completo */}
                <div className="col-12">
                  <label htmlFor="conteudo" className="form-label fw-semibold small text-dark">
                    Conteúdo Completo da Matéria <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="conteudo"
                    name="conteudo"
                    rows={5}
                    className={`form-control ${errosValidacao.conteudo ? 'is-invalid' : ''}`}
                    placeholder="Escreva detalhadamente o comunicado ou matéria escolar..."
                    value={formulario.conteudo}
                    onChange={onCampoChange}
                    disabled={salvando}
                    required
                  ></textarea>
                  {errosValidacao.conteudo && (
                    <div className="invalid-feedback">
                      {Array.isArray(errosValidacao.conteudo) ? errosValidacao.conteudo[0] : errosValidacao.conteudo}
                    </div>
                  )}
                </div>

                {/* Switch de Notícia em Destaque */}
                <div className="col-12">
                  <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                    <div>
                      <span className="fw-semibold text-dark d-block">
                        <i className="bi bi-star-fill text-warning me-2"></i>
                        Notícia em Destaque Principal
                      </span>
                      <small className="text-muted">
                        Se ativado, esta notícia ocupará a posição principal e desmarcará qualquer destaque anterior.
                      </small>
                    </div>
                    <div className="form-check form-switch fs-4 mb-0">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        role="switch"
                        id="destaque"
                        name="destaque"
                        checked={formulario.destaque}
                        onChange={onCampoChange}
                        disabled={salvando}
                      />
                    </div>
                  </div>
                </div>

                {/* Upload da Imagem de Capa (Principal) */}
                <div className="col-12 col-md-6">
                  <label htmlFor="arquivo_foto" className="form-label fw-semibold small text-dark d-flex align-items-center gap-1">
                    <i className="bi bi-image text-primary"></i>
                    <span>Imagem de Capa (Principal)</span>
                  </label>
                  <input
                    type="file"
                    id="arquivo_foto"
                    className="form-control form-control-sm"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => onArquivoChange(e, 'foto')}
                    disabled={salvando}
                  />
                  <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                    Exibida no topo da matéria e no destaque horizontal da Home.
                  </div>

                  {/* Pré-visualização da Capa */}
                  {formulario.preview_foto && (
                    <div className="mt-2 p-1 border rounded-3 bg-light text-center position-relative">
                      <img
                        src={formulario.preview_foto}
                        alt="Pré-visualização da Capa"
                        className="img-fluid rounded-2 shadow-sm"
                        style={{ maxHeight: '90px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="badge bg-primary position-absolute top-0 start-0 m-1" style={{ fontSize: '0.65rem' }}>Capa</span>
                    </div>
                  )}
                </div>

                {/* Upload da Imagem de Miniatura */}
                <div className="col-12 col-md-6">
                  <label htmlFor="arquivo_miniatura" className="form-label fw-semibold small text-dark d-flex align-items-center gap-1">
                    <i className="bi bi-file-earmark-image text-success"></i>
                    <span>Imagem de Miniatura</span>
                  </label>
                  <input
                    type="file"
                    id="arquivo_miniatura"
                    className="form-control form-control-sm"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => onArquivoChange(e, 'miniatura')}
                    disabled={salvando}
                  />
                  <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                    Exibida nos cards secundários da Home e listagens compactas.
                  </div>

                  {/* Pré-visualização da Miniatura */}
                  {formulario.preview_miniatura && (
                    <div className="mt-2 p-1 border rounded-3 bg-light text-center position-relative">
                      <img
                        src={formulario.preview_miniatura}
                        alt="Pré-visualização da Miniatura"
                        className="img-fluid rounded-2 shadow-sm"
                        style={{ maxHeight: '90px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="badge bg-success position-absolute top-0 start-0 m-1" style={{ fontSize: '0.65rem' }}>Miniatura</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé Fixo */}
            <div className="modal-footer border-top px-4 py-3 flex-shrink-0 bg-white" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={salvando}
                onClick={onFechar}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-semibold px-4 d-flex align-items-center gap-2"
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>{modoEdicao ? 'Salvar Alterações' : 'Publicar Notícia'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
