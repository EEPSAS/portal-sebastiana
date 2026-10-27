import "../especialista/GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "../especialista/Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes.jsx";

/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor
 *
 * Papel Didático:
 * Renderiza a visão consultiva do docente sobre suas turmas sob regência.
 * Trata os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio)
 * consumindo os dados pedagógicos reais entregues pelo backend.
 */
const GeralProfessor = () => {
  const { cards, medias, frequencias, disciplinasDocente, updates, loading, error } =
    useDashboardEspecialista();

  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando indicadores...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando estatísticas docentes...</p>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error) {
    return (
      <div className="alert alert-danger rounded-3 shadow-sm" role="alert">
        Não foi possível carregar os dados no momento: {error}
      </div>
    );
  }

  // 3. Estado Assíncrono: Vazio
  const semDadosGlobais =
    cards.length === 0 && medias.length === 0 && frequencias.length === 0 && updates.length === 0;

  if (semDadosGlobais) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        Nenhum indicador de turma disponível para o seu perfil no momento.
      </div>
    );
  }

  return (
    <div className="geral-professor-page">
      {/* Cabeçalho exclusivo da role com título e contextualização pedagógica */}
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">Painel Geral do Professor</h1>
        <p className="text-muted small mb-0">
          Acompanhe o rendimento acadêmico e a frequência dos alunos nas turmas sob sua regência.
        </p>
      </div>

      {/* Destaque contextual das disciplinas sob regência do Professor */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white border-start border-4 border-success">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <div>
            <span className="fw-bold text-dark d-block">
              <i className="bi bi-journal-check me-2 text-success"></i>
              Disciplinas sob sua Regência Docente
            </span>
            <small className="text-muted">
              Os dados analíticos e as notas deste painel refletem os alunos nas matérias atribuídas a você.
            </small>
          </div>

          {disciplinasDocente && disciplinasDocente.length > 0 ? (
            <div className="d-flex flex-wrap gap-1">
              {disciplinasDocente.map((nomeDisc) => (
                <span
                  key={nomeDisc}
                  className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-2 py-1 rounded-pill fw-semibold"
                >
                  {nomeDisc}
                </span>
              ))}
            </div>
          ) : (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 rounded-pill">
              Nenhuma disciplina atribuída pelo Especialista
            </span>
          )}
        </div>
      </div>

      {/* Linha superior: Small Cards com KPIs docentes */}
      <div className="row g-3">
        {cards.map((card) => (
          <GeralSmallCards
            key={card.id}
            titulo={card.titulo}
            valor={card.valor}
            bgIcone={card.bgIcone}
            textIcone={card.textIcone}
            tipoIcone={card.tipoIcone}
          />
        ))}
      </div>

      {/* Linha intermediária: Gráficos de Médias e Frequências por Turma */}
      <GeralMediumCards
        medias={medias}
        frequencias={frequencias}
        loading={loading}
        error={error}
      />

      {/* Linha inferior: Feed de últimas atualizações escolares */}
      <LatestUpdates
        updates={updates}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default GeralProfessor;
