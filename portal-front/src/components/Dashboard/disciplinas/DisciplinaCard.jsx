/**
 * DisciplinaCard.jsx - Card de Catálogo de Disciplina Curricular (Módulo 5.5)
 *
 * Papel Didático:
 * Renderiza uma disciplina individual do catálogo escolar:
 * 1. Nome formatado e cálculo de aulas semanais e anuais;
 * 2. Badges dos ciclos associados com cores temáticas;
 * 3. Docentes vinculados com regência da disciplina;
 * 4. Botão para consulta ao Plano Pedagógico / BNCC (`ModalDetalhesDisciplina`);
 * 5. Botões de ação para Editar e Excluir (Especialista e Administrador).
 */

import { formatarDisciplinaCiclo } from "../../../utils/formatters";

// Paleta de cores semânticas para identificação e distinção visual dos ciclos
const CORES_CICLOS = [
  { primária: "#10b981", bgHeader: "#f0fdf4", border: "#86efac", badgeBg: "#dcfce7", badgeText: "#166534" },
  { primária: "#2563eb", bgHeader: "#eff6ff", border: "#93c5fd", badgeBg: "#dbeafe", badgeText: "#1e40af" },
  { primária: "#d97706", bgHeader: "#fffbeb", border: "#fde68a", badgeBg: "#fef3c7", badgeText: "#92400e" },
  { primária: "#7c3aed", bgHeader: "#f5f3ff", border: "#c4b5fd", badgeBg: "#ede9fe", badgeText: "#5b21b6" },
  { primária: "#db2777", bgHeader: "#fdf2f8", border: "#f9a8d4", badgeBg: "#fce7f3", badgeText: "#9d174d" },
  { primária: "#0891b2", bgHeader: "#ecfeff", border: "#67e8f9", badgeBg: "#cffafe", badgeText: "#155e75" },
];

const getCorCiclo = (idCiclo) => {
  const idNum = Number(idCiclo) || 0;
  return CORES_CICLOS[idNum % CORES_CICLOS.length];
};

export default function DisciplinaCard({
  disc,
  podeGerenciar,
  excluindoId,
  onVerDetalhes,
  onEditar,
  onExcluir,
}) {
  const aulasSem =
    disc.aulas_semanais ||
    Math.max(1, Math.round((disc.carga_horaria_anual || 160) / 40));
  const totalAulas =
    disc.total_aulas_anuais ||
    disc.carga_horaria_anual ||
    aulasSem * 40;

  return (
    <div className="col-12 col-md-6 col-xl-4">
      <div
        className="card disciplina-card h-100 border rounded-3 shadow-xs bg-white d-flex flex-column justify-content-between"
        style={{ padding: "1.25rem 1.35rem" }}
      >
        <div>
          {/* Topo do Card: Nome e Carga Horária */}
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h3 className="h6 fw-bold text-dark mb-0" title={formatarDisciplinaCiclo(disc)}>
              {formatarDisciplinaCiclo(disc)}
            </h3>
            <span className="badge bg-primary-subtle text-primary rounded-pill text-nowrap">
              {aulasSem} a/sem • {totalAulas} a/ano
            </span>
          </div>

          {/* Ciclos aos quais a disciplina pertence */}
          <div className="mb-2">
            <small className="text-muted d-block fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
              CICLOS VINCULADOS:
            </small>
            {Array.isArray(disc.ciclos) && disc.ciclos.length > 0 ? (
              <div className="d-flex flex-wrap gap-1">
                {disc.ciclos.map((c) => {
                  const cor = getCorCiclo(c.id_ciclo);
                  return (
                    <span
                      key={c.id_ciclo}
                      className="badge rounded-pill fw-medium"
                      style={{
                        fontSize: "0.74rem",
                        backgroundColor: cor.badgeBg,
                        color: cor.badgeText,
                        border: `1px solid ${cor.border}`,
                      }}
                    >
                      <i className="bi bi-diagram-3 me-1" style={{ color: cor.primária }}></i>
                      {c.nome}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span
                className="badge bg-warning-subtle text-dark rounded-pill"
                style={{ fontSize: "0.72rem" }}
              >
                <i className="bi bi-exclamation-triangle me-1 text-warning"></i>
                Não vinculada a ciclos
              </span>
            )}
          </div>

          {/* Professores Vinculados */}
          <div className="mb-2">
            <small className="text-muted d-block fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
              DOCENTE(S):
            </small>
            {Array.isArray(disc.professores) && disc.professores.length > 0 ? (
              <div className="small text-secondary text-truncate" title={disc.professores.map((p) => p.name).join(", ")}>
                <i className="bi bi-person-badge me-1 text-primary"></i>
                {disc.professores.map((p) => p.name).join(", ")}
              </div>
            ) : (
              <span className="text-muted fst-italic small">
                Nenhum professor vinculado ainda.
              </span>
            )}
          </div>

          {/* Resumo de Ementa ou BNCC */}
          {disc.ementa && (
            <p
              className="text-muted small mb-2"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <strong>Ementa:</strong> {disc.ementa}
            </p>
          )}
        </div>

        {/* Rodapé do Card com Ações */}
        <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none px-0 fw-semibold text-primary"
            onClick={() => onVerDetalhes(disc)}
          >
            <i className="bi bi-eye me-1"></i>
            Plano Pedagógico
          </button>

          {podeGerenciar && (
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-primary rounded-start-pill px-2"
                onClick={() => onEditar(disc)}
                title="Editar disciplina"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-danger rounded-end-pill px-2"
                onClick={() => onExcluir(disc)}
                disabled={excluindoId === disc.id_disciplina}
                title="Excluir disciplina do catálogo"
              >
                {excluindoId === disc.id_disciplina ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-trash"></i>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
