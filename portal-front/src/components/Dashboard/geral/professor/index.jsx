import { useState } from "react";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import materiasProfessorMock from "./materiasProfessorMock";

const materiasOrdenadas = [...materiasProfessorMock].sort((a, b) =>
  a.nome.localeCompare(b.nome, "pt-BR"),
);

/** Exibe dados demonstrativos por matéria até a API oferecer esse recorte. */
const GeralProfessor = () => {
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState(
    materiasOrdenadas[0]?.id ?? "",
  );
  const materiaSelecionada =
    materiasOrdenadas.find((materia) => materia.id === materiaSelecionadaId) ??
    materiasOrdenadas[0];

  if (!materiaSelecionada) {
    return (
      <p className="text-muted">
        Nenhuma matéria demonstrativa está disponível.
      </p>
    );
  }

  return (
    <div className="teacher-overview">
      <div className="mb-3">
        <div
          className="btn-group flex-wrap bg-light rounded-pill border"
          style={{ padding: "0.27rem" }}
          role="group"
          aria-label="Selecionar matéria"
        >
          {materiasOrdenadas.map((materia) => (
            <button
              type="button"
              key={materia.id}
              className={`btn rounded-pill fw-semibold transition ${
                materia.id === materiaSelecionada.id
                  ? "btn-primary shadow-sm text-white"
                  : "text-secondary border-0"
              }`}
              style={{ fontSize: "0.945rem", padding: "0.27rem 1.08rem" }}
              aria-pressed={materia.id === materiaSelecionada.id}
              onClick={() => setMateriaSelecionadaId(materia.id)}
            >
              {materia.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <AlunosRiscoCards
          dados={materiaSelecionada.risco}
          periodo="Período trimestral não configurado"
        />
      </div>

      <p className="text-muted small mb-2">
        Indicadores demonstrativos por matéria; aguardando integração com dados reais da API.
      </p>
      <GeralMediumCards
        medias={materiaSelecionada.medias}
        frequencias={materiaSelecionada.frequencias}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
        badgeMedia="Meta mín. 60%"
      />
    </div>
  );
};

export default GeralProfessor;