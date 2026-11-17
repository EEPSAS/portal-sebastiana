/**
 * PainelPeriodoGeral.jsx - Seletor Padronizado de Etapa Avaliativa / Período
 *
 * Papel Didático:
 * Padroniza a seleção de períodos letivos e etapas avaliativas em todos os perfis
 * (Especialista, Administrador, Professor e Aluno), eliminando selects divergentes
 * e garantindo acessibilidade (role="group", aria-pressed) com botões em formato de pílula.
 */
export default function PainelPeriodoGeral({
  rotulo = "Etapa Avaliativa:",
  icone = "bi-calendar-range",
  opcoes = [],
  valorSelecionado = "",
  onSelecionar,
  anoLetivo = null,
  badgeExtra = null,
  ariaLabel = "Filtrar por etapa do período letivo",
  className = "",
}) {
  return (
    <div
      className={`d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-2 px-3 bg-white rounded-3 border shadow-xs ${className}`}
    >
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span className="small fw-bold text-dark text-uppercase d-flex align-items-center gap-1 me-2">
          <i className={`bi ${icone} text-primary`} aria-hidden="true"></i>
          {rotulo}
        </span>

        <div
          className="btn-group btn-group-sm flex-wrap p-1 bg-light rounded-pill border"
          role="group"
          aria-label={ariaLabel}
        >
          {opcoes.map((opcao) => {
            const isAtiva = valorSelecionado === opcao.valor;
            return (
              <button
                type="button"
                key={opcao.valor || "todos"}
                className={`btn-pill-filter ${isAtiva ? "is-active" : ""}`}
                aria-pressed={isAtiva}
                onClick={() => onSelecionar && onSelecionar(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        {badgeExtra}
        {anoLetivo && (
          <span className="badge bg-light text-secondary border rounded-pill px-3 py-2 small">
            Ano Letivo {anoLetivo}
          </span>
        )}
      </div>
    </div>
  );
}
