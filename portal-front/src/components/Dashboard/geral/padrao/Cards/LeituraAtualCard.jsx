import { useState } from "react";

/**
 * LeituraAtualCard.jsx - Card de Acompanhamento de Empréstimo / Leitura Atual
 *
 * Papel Didático:
 * Exibe o livro realmente emprestado ao estudante na Biblioteca Escolar (tabela `emprestimos`),
 * permitindo anotar localmente a página de leitura atual sem inventar obras fictícias.
 */
export default function LeituraAtualCard({ leitura, onSave }) {
  const tituloReal = leitura?.livro || "Nenhum empréstimo ativo";
  const semLivro = tituloReal === "Nenhum empréstimo ativo";
  const detalheAtual = leitura?.pagina || (semLivro ? "Visite a biblioteca" : "Em leitura");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    livro: "",
    pagina: "",
    autor: "",
  });

  const handleOpenModal = () => {
    setFormData({
      livro: semLivro ? "" : tituloReal,
      pagina: String(leitura?.pagina || "").match(/Pág\.\s*(\d+)/i)?.[1] || "",
      autor: leitura?.autor || "",
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave && formData.livro.trim()) {
      await onSave({
        livro: formData.livro.trim(),
        autor: formData.autor.trim(),
        pagina: formData.pagina ? `Pág. ${formData.pagina}` : detalheAtual,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 text-white p-2 px-md-3 d-flex flex-column justify-content-between position-relative"
        style={{
          backgroundColor: "var(--dashboard-amber)",
        }}
      >
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <span
              className="fw-semibold text-white-50 text-uppercase small"
              style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
            >
              Leitura Atual
            </span>
            <button
              type="button"
              className="btn btn-link text-white-50 p-0 border-0"
              onClick={handleOpenModal}
              aria-label="Editar anotação de leitura atual"
            >
              <i className="bi bi-pencil-fill" style={{ fontSize: "0.9rem" }} aria-hidden="true"></i>
            </button>
          </div>

          <h3
            className="fw-bold mt-2 mb-1 text-white text-truncate"
            style={{ fontSize: semLivro ? "1.05rem" : "1.35rem", lineHeight: 1.25 }}
            title={tituloReal}
          >
            {tituloReal}
          </h3>
          {!semLivro && leitura?.autor && (
            <p className="small text-white-50 mb-1 text-truncate">{leitura.autor}</p>
          )}
        </div>

        <div>
          <span className="badge bg-white text-dark fw-bold rounded-pill px-3 py-1">
            {detalheAtual}
          </span>
        </div>
      </div>

      {/* Modal de marcação de página com rótulos programaticamente associados */}
      {isEditing && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(var(--dashboard-navy-rgb), 0.5)",
            zIndex: 1060,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-leitura-titulo"
            className="bg-white rounded-4 shadow-lg text-dark p-4 w-100"
            style={{ maxWidth: "480px" }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <h5 id="modal-leitura-titulo" className="fw-bold mb-0">
                Anotar Progresso de Leitura
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar janela de leitura"
                onClick={() => setIsEditing(false)}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="leitura-livro-input" className="form-label small fw-semibold">
                  Título do Livro
                </label>
                <input
                  id="leitura-livro-input"
                  type="text"
                  className="form-control"
                  value={formData.livro}
                  onChange={(e) => setFormData({ ...formData, livro: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="leitura-pagina-input" className="form-label small fw-semibold">
                  Página Atual
                </label>
                <input
                  id="leitura-pagina-input"
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.pagina}
                  onChange={(e) => setFormData({ ...formData, pagina: e.target.value })}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning text-white rounded-pill px-4 fw-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
