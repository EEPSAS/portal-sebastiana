import { useState } from "react";
import ModalAlunosRisco from "../ModalAlunosRisco";

const CARDS_RISCO = [
  {
    id: "notas",
    titulo: "Alunos em risco por nota",
    descricao: "Abaixo de 60%",
    valor: "alunosAbaixoDaMedia",
    indicador: "nota",
    alunos: "alunosPorNota",
    cor: "#b91c1c",
  },
  {
    id: "frequencia",
    titulo: "Alunos em risco por frequência",
    descricao: "Abaixo de 75%",
    valor: "alunosComFrequenciaInsuficiente",
    indicador: "frequencia",
    alunos: "alunosPorFrequencia",
    cor: "#c2410c",
  },
];

/** Exibe os totais demonstrativos com a linguagem visual dos cards bibliotecários. */
export default function AlunosRiscoCards({ dados, periodo, materia }) {
  const [cardSelecionado, setCardSelecionado] = useState(null);

  return (
    <>
      {CARDS_RISCO.map((card) => (
        <div className="col-12 col-md-6" key={card.id}>
          <section
            className="card border-0 dashboard-card-shadow rounded-4 h-100 text-white p-4 position-relative"
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

            <button
              type="button"
              className="btn border-0 rounded-circle text-white d-flex align-items-center justify-content-center"
              style={{
                position: "absolute",
                right: "1rem",
                bottom: "1rem",
                width: "3.0875rem",
                height: "3.0875rem",
                backgroundColor: "rgba(255, 255, 255, 0.072)",
                boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.116)",
              }}
              title="Ver alunos em risco"
              aria-label={`Ver alunos em risco por ${card.indicador === "nota" ? "nota" : "frequência"}`}
              onClick={() =>
                setCardSelecionado({
                  ...card,
                  alunos: dados[card.alunos] || [],
                })
              }
            >
              <i
                className="bi bi-people"
                style={{ fontSize: "1.425rem" }}
                aria-hidden="true"
              />
            </button>
          </section>
        </div>
      ))}
      {cardSelecionado && (
        <ModalAlunosRisco
          titulo={cardSelecionado.titulo}
          indicador={cardSelecionado.indicador}
          alunos={cardSelecionado.alunos}
          materia={materia}
          onClose={() => setCardSelecionado(null)}
        />
      )}
    </>
  );
}
