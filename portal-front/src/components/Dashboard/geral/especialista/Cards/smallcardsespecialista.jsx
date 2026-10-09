// Ícones dinâmicos com base na prop tipoIcone
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
  bgIcone,
  textIcone,
  tipoIcone,
}) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div className="card h-100 border-0 shadow-sm rounded-3 p-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${bgIcone} ${textIcone}`}
            style={{ width: "48px", height: "48px" }}
          >
            <RenderIcon tipo={tipoIcone} />
          </div>

          <div className="d-flex flex-column">
            <span
              className="text-muted fw-medium"
              style={{ fontSize: "0.85rem" }}
            >
              {titulo}
            </span>
            <span
              className="fw-bold fs-4 text-dark"
              style={{ minHeight: "32px" }}
            >
              {valor !== undefined && valor !== null ? valor : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
