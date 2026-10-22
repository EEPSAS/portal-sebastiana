import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import dadosRiscoProfessorMock from "./dadosRiscoProfessorMock";

/** Monta a visão do professor com os indicadores disponíveis no frontend atual. */
const GeralProfessor = () => {
  const { medias, frequencias, loading, error } = useDashboardEspecialista();

  const mediasNaEscalaPercentual = medias.map((item) => ({
    ...item,
    nota:
      item.nota === null || item.nota === undefined
        ? item.nota
        : Number(item.nota) * 10,
  }));

  return (
    <div className="teacher-overview">
      <h1 className="h3 fw-bold mb-4">Painel Geral do Professor</h1>

      <div className="row g-3 mb-3">
        <AlunosRiscoCards
          dados={dadosRiscoProfessorMock}
          periodo={dadosRiscoProfessorMock.periodo}
        />
      </div>

      <p className="text-muted small mb-2">
        Gráficos com agregados atuais da API por turma, sem recorte trimestral.
      </p>
      <GeralMediumCards
        medias={mediasNaEscalaPercentual}
        frequencias={frequencias}
        loading={loading}
        error={error}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
      />
    </div>
  );
};

export default GeralProfessor;