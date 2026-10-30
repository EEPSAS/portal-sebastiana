import ListaAlunosRisco from "../ListaAlunosRisco";

const CARDS_RISCO = [
  {
    id: "notas",
    titulo: "Alunos em risco por nota",
    descricao: "Abaixo de 60%",
    valor: "alunosAbaixoDaMedia",
    indicador: "nota",
    alunos: "alunosPorNota",
    icone: "bi-mortarboard",
    cor: "#991b3b",
    fundo: "#fffafa",
    borda: "#f0dfe4",
  },
  {
    id: "frequencia",
    titulo: "Alunos em risco por frequência",
    descricao: "Abaixo de 75%",
    valor: "alunosComFrequenciaInsuficiente",
    indicador: "frequencia",
    alunos: "alunosPorFrequencia",
    icone: "bi-people",
    cor: "#c2410c",
    fundo: "#fffaf7",
    borda: "#f2e3dc",
  },
];

/** Exibe os totais demonstrativos com a linguagem visual dos cards bibliotecários. */
export default function AlunosRiscoCards({ dados, periodo, metaPontos = null, isReal = false }) {
  return (
    <>
      {CARDS_RISCO.map((card) => (
        <div className="col-12 col-md-6" key={card.id}>
          <section
            className="card dashboard-card-shadow rounded-4 h-100 p-4"
            style={{
              backgroundColor: card.fundo,
              border: `1px solid ${card.borda}`,
            }}
            aria-label={card.titulo}
          >
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    color: card.cor,
                    backgroundColor: `${card.cor}1a`,
                  }}
                  aria-hidden="true"
                >
                  <i className={`bi ${card.icone} fs-5`} />
                </span>
                <div>
                  <h2 className="h6 fw-bold mb-1" style={{ color: "#26344a" }}>
                    {card.titulo}
                  </h2>
                  <p className="small mb-0" style={{ color: "#687386" }}>
                    {card.id === "notas" && metaPontos ? `Abaixo de 60% (${metaPontos} pts)` : card.descricao}
                  </p>
                </div>
              </div>
              <span
                className="badge rounded-pill fw-normal"
                style={{
                  color: card.cor,
                  backgroundColor: `${card.cor}12`,
                  border: `1px solid ${card.cor}25`,
                }}
              >
                {isReal ? "Monitoramento Ativo" : "Demonstrativo"}
              </span>
            </div>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mt-3">
              <div className="flex-shrink-0">
                <strong
                  className="display-4 lh-1"
                  style={{ color: card.cor }}
                >
                  {dados[card.valor]}
                </strong>
                <span className="small d-block" style={{ color: "#596579" }}>
                  alunos
                </span>
                <span
                  className="d-block mt-3 mb-2"
                  style={{ width: "2rem", borderTop: `2px solid ${card.cor}` }}
                  aria-hidden="true"
                />
                <p className="small mb-0" style={{ color: "#687386" }}>
                  {periodo}
                </p>
              </div>
              <ListaAlunosRisco
                indicador={card.indicador}
                alunos={dados[card.alunos] || []}
                corFundo={card.fundo}
                corTexto={card.cor}
              />
            </div>
          </section>
        </div>
      ))}
    </>
  );
}
