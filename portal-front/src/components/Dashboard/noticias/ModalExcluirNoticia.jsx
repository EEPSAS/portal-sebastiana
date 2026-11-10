/**
 * ModalExcluirNoticia.jsx - Confirmação de Exclusão Segura de Notícia (Módulo 2)
 *
 * Papel Didático:
 * Evita exclusões acidentais de matérias publicadas no portal da escola,
 * exibindo o título da notícia e exigindo confirmação explícita do usuário.
 */

export default function ModalExcluirNoticia({
  noticia,
  excluindoId,
  onFechar,
  onConfirmar,
}) {
  if (!noticia) return null;

  const isExcluindo = excluindoId !== null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom px-4 pt-4 pb-2">
            <h2 className="modal-title h5 fw-bold text-danger d-flex align-items-center gap-2 mb-0">
              <i className="bi bi-trash-fill"></i> Confirmar Exclusão
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              disabled={isExcluindo}
              onClick={onFechar}
            ></button>
          </div>
          <div className="modal-body px-4 py-3">
            <p className="text-dark mb-2">
              Tem certeza que deseja excluir permanentemente a notícia:
            </p>
            <div className="p-3 bg-light rounded-3 border fw-semibold text-dark mb-3">
              {noticia.titulo}
            </div>
            <p className="text-muted small mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Esta ação não pode ser desfeita e a matéria deixará de ser exibida no portal escolar.
            </p>
          </div>
          <div className="modal-footer border-top px-4 py-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={isExcluindo}
              onClick={onFechar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger fw-semibold px-4 d-flex align-items-center gap-2"
              disabled={isExcluindo}
              onClick={onConfirmar}
            >
              {isExcluindo ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash"></i>
                  <span>Sim, Excluir Notícia</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
