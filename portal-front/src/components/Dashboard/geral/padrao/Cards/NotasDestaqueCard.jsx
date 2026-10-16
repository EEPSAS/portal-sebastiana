/**
 * NotasDestaqueCard.jsx - Cards de Melhores Notas e Alerta Pedagógico
 *
 * Papel Didático:
 * Renderiza em cards brancos limpos o indicador da maior nota alcançada (destaque positivo)
 * e da disciplina que demanda maior acompanhamento do estudante (destaque preventivo).
 */

export function MelhorNotaCard({
  nota = "9,8",
  disciplina = "Língua Portuguesa",
  mensagem = "Parabéns! Você está indo muito bem nesta disciplina!"
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-between bg-white"
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span
              className="badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
              style={{ backgroundColor: "var(--dashboard-navy-soft)", color: "var(--dashboard-navy)", width: "28px", height: "28px" }}
            >
              <i className="bi bi-star-fill" style={{ fontSize: "0.85rem" }}></i>
            </span>
            <span className="small text-secondary fw-semibold">Melhor Nota</span>
          </div>

          <div className="d-flex align-items-baseline gap-2">
            <span className="fw-bold fs-2 text-dark lh-1">{nota}</span>
            <span className="text-secondary small fw-medium">{disciplina}</span>
          </div>
        </div>

        <div
          className="rounded-3 p-2 mt-2"
          style={{ backgroundColor: "var(--dashboard-navy-soft)", border: "1px solid var(--dashboard-navy-soft)" }}
        >
          <p className="mb-0 text-success" style={{ fontSize: "0.74rem", lineHeight: 1.3 }}>
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotaAtencaoCard({
  nota = "5,6",
  disciplina = "Matemática",
  mensagem = "Fique atento! Matemática precisa de mais dedicação."
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-between bg-white"
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span
              className="badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
              style={{ backgroundColor: "var(--dashboard-pink-soft)", color: "var(--dashboard-pink)", width: "28px", height: "28px" }}
            >
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize: "0.85rem" }}></i>
            </span>
            <span className="small text-secondary fw-semibold">Nota que precisa de mais atenção</span>
          </div>

          <div className="d-flex align-items-baseline gap-2">
            <span className="fw-bold fs-2 text-danger lh-1">{nota}</span>
            <span className="text-secondary small fw-medium">{disciplina}</span>
          </div>
        </div>

        <div
          className="rounded-3 p-2 mt-2"
          style={{ backgroundColor: "var(--dashboard-pink-soft)", border: "1px solid var(--dashboard-pink-soft)" }}
        >
          <p className="mb-0 text-danger" style={{ fontSize: "0.74rem", lineHeight: 1.3 }}>
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}
