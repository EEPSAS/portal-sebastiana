import { useState } from "react";

/**
 * LeituraAtualCard.jsx - Card de Acompanhamento de Livro com Edição
 *
 * Papel Didático:
 * Exibe o livro atualmente lido pelo aluno com página marcada em destaque laranja.
 * Oferece modal amigável para atualização da página ou do título lido.
 */
export default function LeituraAtualCard({
  leitura,
  onSave
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    livro: leitura?.livro || "Dom Casmurro",
    pagina: String(leitura?.pagina || "").match(/\d+/)?.[0] || "120",
    autor: leitura?.autor || "Machado de Assis"
  });

  const handleOpenModal = () => {
    setFormData({
      livro: leitura?.livro || "Dom Casmurro",
      pagina: String(leitura?.pagina || "").match(/\d+/)?.[0] || "120",
      autor: leitura?.autor || "Machado de Assis"
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) {
      await onSave({
        ...formData,
        pagina: `Pág. ${formData.pagina}`
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 text-white p-2 px-md-3 d-flex flex-column justify-content-between position-relative"
        style={{
          backgroundColor: "var(--dashboard-amber)", // Laranja âmbar vibrante
        }}
      >
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="fw-semibold text-white-50 text-uppercase small" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
              Leitura Atual
            </span>
            <button
              type="button"
              className="btn btn-link text-white-50 p-0 border-0"
              onClick={handleOpenModal}
              title="Editar leitura atual"
              aria-label="Editar livro ou página"
            >
              <i className="bi bi-pencil-fill" style={{ fontSize: "0.9rem" }}></i>
            </button>
          </div>

          <h3
            className="fw-bold mt-2 mb-1 text-white text-truncate"
            style={{ fontSize: "1.45rem", lineHeight: 1.2 }}
            title={leitura?.livro || "Dom Casmurro"}
          >
            {leitura?.livro || "Dom Casmurro"}
          </h3>
        </div>

        <div>
          <span className="badge bg-white text-dark fw-bold rounded-pill px-3 py-1">
            {leitura?.pagina || "Pág. 120"}
          </span>
        </div>
      </div>

      {/* Modal didático de atualização */}
      {isEditing && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(var(--dashboard-navy-rgb), 0.5)", zIndex: 1060, padding: "1rem" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg text-dark p-4 w-100"
            style={{ maxWidth: "480px" }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
              <h5 className="fw-bold mb-0">Atualizar Leitura</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsEditing(false)}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Título do Livro</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.livro}
                  onChange={(e) => setFormData({ ...formData, livro: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Página Atual</label>
                <input
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
                <button type="submit" className="btn btn-warning text-white rounded-pill px-4 fw-semibold">
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
