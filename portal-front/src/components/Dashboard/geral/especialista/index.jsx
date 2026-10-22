import "./GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "./Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "./Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "./LatestUpdates/UltimasAtualizacoes.jsx";
import { useAuth } from "../../../../hooks/useAuth.js";

/**
 * GeralEspecialista (index.jsx) - Painel Analítico do Especialista, Professor e Administrador
 *
 * Papel Didático:
 * Consome o hook unificado useDashboardEspecialista() para buscar os dados reais do endpoint
 * GET /api/dashboard/geral em uma única requisição HTTP e distribuí-los como props para:
 * 1. GeralSmallCards (4 KPIs principais da escola/docência);
 * 2. GeralMediumCards (Gráficos Recharts de Média de Notas e Taxa de Presença por Turma);
 * 3. LatestUpdates (Feed de últimas atualizações de notícias e notas);
 * 4. Destaque das disciplinas lecionadas sob a regência do docente.
 */
const GeralEspecialista = () => {
  const { user } = useAuth();
  const { cards, medias, frequencias, disciplinasDocente, updates, loading, error } =
    useDashboardEspecialista();

  const isProfessor = user?.role === "professor";

  // Define o cabeçalho dinamicamente conforme o papel (Administrador vs Professor vs Especialista)
  const tituloPainel =
    user?.role === "adm"
      ? "Painel Geral do Administrador"
      : isProfessor
      ? "Painel Geral do Professor"
      : "Painel Geral do Especialista";

  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando indicadores...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando estatísticas acadêmicas...</p>
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

  // 3. Estado Assíncrono: Vazio (sem indicadores nem turmas cadastradas)
  const semDadosGlobais =
    cards.length === 0 && medias.length === 0 && frequencias.length === 0 && updates.length === 0;

  if (semDadosGlobais) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        Nenhum indicador acadêmico disponível no momento.
      </div>
    );
  }

  return (
    <div className="geral-especialista-page">
      {/* Cabeçalho estilizado com título da role e subtítulo descritivo */}
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">{tituloPainel}</h1>
        <p className="text-muted small mb-0">
          Acompanhe os principais indicadores e o andamento da escola em tempo real.
        </p>
      </div>

      {/* Destaque contextual exclusivo para o Professor */}
      {isProfessor && (
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
      )}

      {/* Linha superior: 4 Small Cards de KPIs institucionais/docentes */}
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

      {/* Linha intermediária: Gráficos Recharts de Médias e Frequências por Turma */}
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

export default GeralEspecialista;
