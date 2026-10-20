/**
 * EstatisticaDocenteCard.jsx - Card Unitário de Indicador Rápido (KPI)
 *
 * Papel Didático:
 * Renderiza um indicador numérico resumido (Total de Alunos, Média Geral, Frequência Média
 * ou Notícias Publicadas) no topo do painel do Especialista e do Professor.
 */

// Renderiza o ícone vetorial correspondente à categoria do KPI
function RenderIcon({ tipo }) {
  switch (tipo) {
    case "alunos":
      return (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case "notas":
      return (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3v18h18V3H3zm6 14H7v-5h2v5zm4 0h-2v-9h2v9zm4 0h-2v-7h2v7z" />
        </svg>
      );
    case "frequencia":
      return (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        </svg>
      );
    case "noticias":
      return (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H5V5h14v12zm-2-7H7v2h11v-2zM7 14h11v2H7v-2zm0-6h11v2H7V8z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function GeralSmallCards({
  titulo,
  valor,
  tipoIcone,
}) {
  // Mapeia a classe de cor pastel do ícone com base no tipo
  const classeCorIcone = `geral-kpi-icon--${tipoIcone || "alunos"}`;

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="geral-kpi-card h-100 d-flex flex-column justify-content-between">
        <div className="d-flex align-items-center gap-3">
          {/* Círculo com cor pastel e ícone estilizado */}
          <div className={`geral-kpi-icon ${classeCorIcone}`}>
            <RenderIcon tipo={tipoIcone} />
          </div>

          {/* Rótulo descritivo e valor principal do KPI */}
          <div className="d-flex flex-column">
            <span className="geral-kpi-label">{titulo}</span>
            <span className="geral-kpi-value">
              {valor !== undefined && valor !== null ? valor : "—"}
            </span>
          </div>
        </div>

        {/* Seta indicadora sutil no canto inferior direito conforme layout */}
        <div className="geral-kpi-arrow">
          <i className="bi bi-arrow-right fs-5"></i>
        </div>
      </div>
    </div>
  );
}
