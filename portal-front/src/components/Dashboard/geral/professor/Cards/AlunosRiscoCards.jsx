const CARDS_RISCO = [
  {
    id: "notas",
    titulo: "Alunos em risco por nota",
    descricao: "Abaixo de 60%",
    valor: "alunosAbaixoDaMedia",
    cor: "#b91c1c",
  },
  {
    id: "frequencia",
    titulo: "Alunos em risco por frequência",
    descricao: "Abaixo de 75%",
    valor: "alunosComFrequenciaInsuficiente",
    cor: "#c2410c",
  },
];

/** Exibe os totais demonstrativos com a linguagem visual dos cards bibliotecários. */
export default function AlunosRiscoCards({ dados, periodo }) {
  return (
    <>
      {CARDS_RISCO.map((card) => (
        <div className="col-12 col-md-6" key={card.id}>
          <section
            className="card border-0 dashboard-card-shadow rounded-4 h-100 text-white p-4"
            style={{ backgroundColor: card.cor }}
            aria-label={card.titulo}
          >
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <h2 className="h6 fw-bold mb-1">{card.titulo}</h2>
                <p className="small text-white mb-0">{card.descricao}</p>
              </div>
              <span className="badge rounded-pill text-bg-light text-dark">
                Demonstrativo
              </span>
            </div>

            <strong className="display-4 lh-1 my-3">{dados[card.valor]}</strong>
            <span className="small">alunos</span>
            <p className="small text-white mt-3 mb-0">{periodo}</p>
          </section>
        </div>
      ))}
    </>
  );
}
