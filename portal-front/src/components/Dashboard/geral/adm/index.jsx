import "../especialista/GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "../especialista/Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes.jsx";

/**
 * GeralAdm (index.jsx) - Painel Analítico Geral do Administrador
 *
 * Papel Didático:
 * Renderiza a visão executiva de toda a escola conectada aos dados reais de turmas, notas,
 * frequências, períodos letivos e notificações, alinhando filtro de etapa e escalas gráficas.
 */
const GeralAdm = () => {
  const {
    cards,
    medias,
    frequencias,
    updates,
    divisaoSelecionada,
    setDivisaoSelecionada,
    periodoContexto,
    loading,
    error,
  } = useDashboardEspecialista();

  // 1. Estado Assíncrono: Carregando
  if (loading && cards.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" aria-hidden="true"></div>
        <p className="text-muted mt-2 small mb-0">
          Carregando indicadores da escola...
        </p>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error && cards.length === 0) {
    return (
      <div className="alert alert-danger rounded-3 shadow-sm" role="alert">
        Não foi possível carregar os dados no momento: {error}
      </div>
    );
  }

  // 3. Estado Assíncrono: Vazio
  const semDadosGlobais =
    cards.length === 0 && medias.length === 0 && frequencias.length === 0 && updates.length === 0;
  const divisaoAtiva = divisaoSelecionada || periodoContexto?.divisao_selecionada;
  const pontosDivisaoSelecionada =
    divisaoAtiva === "todos"
      ? periodoContexto?.pontos_consolidados ?? 0
      : periodoContexto?.pontos_divisao ?? 30;
  const destinosCards = {
    "total-alunos": "/dashboard/turmas?aba=turmas",
    "media-geral": "/dashboard/turmas?aba=notas",
    frequencia: "/dashboard/turmas?aba=notas",
    noticias: "/dashboard/noticias",
  };

  if (semDadosGlobais) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        Nenhum indicador acadêmico consolidado disponível no momento.
      </div>
    );
  }

  return (
    <div className="geral-adm-page">
      {error && (
        <div className="alert alert-danger rounded-3 py-2" role="alert">
          Não foi possível atualizar os dados da etapa selecionada: {error}
        </div>
      )}

      {/* Filtro de Etapa Avaliativa do Período Letivo */}
      {periodoContexto && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-2 px-3 bg-white rounded-3 border shadow-xs">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small fw-bold text-dark text-uppercase d-flex align-items-center gap-1 me-2">
              <i className="bi bi-calendar-range text-primary" aria-hidden="true"></i>
              Etapa Avaliativa:
            </span>
            <div
              className="btn-group btn-group-sm flex-wrap p-1 bg-light rounded-pill border"
              role="group"
              aria-label="Filtrar indicadores institucionais por etapa do período letivo"
            >
              <button
                type="button"
                className={`btn-pill-filter ${divisaoAtiva === "todos" ? "is-active" : ""}`}
                aria-pressed={divisaoAtiva === "todos"}
                onClick={() => setDivisaoSelecionada("todos")}
              >
                Consolidado Geral
              </button>
              {(periodoContexto.divisoes_disponiveis || []).map((divisao) => {
                const isAtiva = divisaoAtiva === divisao.nome;
                return (
                  <button
                    type="button"
                    key={divisao.id_divisao || divisao.nome}
                    className={`btn-pill-filter ${isAtiva ? "is-active" : ""}`}
                    aria-pressed={isAtiva}
                    onClick={() => setDivisaoSelecionada(divisao.nome)}
                  >
                    {divisao.nome} ({divisao.pontos} pts)
                    {divisao.is_atual ? " • Atual" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <span className="badge bg-light text-secondary border rounded-pill px-3 py-2 small">
            Ano Letivo {periodoContexto.ano}
          </span>
        </div>
      )}

      {/* Linha superior: Small Cards de KPIs globais da instituição */}
      <div className="row g-2 g-md-3">
        {cards.map((card) => (
          <GeralSmallCards
            key={card.id}
            titulo={card.titulo}
            valor={card.valor}
            bgIcone={card.bgIcone}
            textIcone={card.textIcone}
            tipoIcone={card.tipoIcone}
            href={destinosCards[card.id]}
          />
        ))}
      </div>

      {/* Linha intermediária: Gráficos de Médias e Frequências por Turma */}
      <GeralMediumCards
        medias={medias.map((item) => ({
          ...item,
          nota: Number(item.nota ?? 0) * 10,
        }))}
        frequencias={frequencias}
        loading={false}
        error={null}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
        badgeMedia={
          divisaoAtiva && divisaoAtiva !== "todos" && pontosDivisaoSelecionada > 0
            ? `Meta mín. 60% (${(pontosDivisaoSelecionada * 0.6).toFixed(1)} pts)`
            : "Meta mín. 60%"
        }
        href="/dashboard/turmas?aba=notas"
      />

      {/* Linha inferior: Feed das últimas notificações escolares */}
      <LatestUpdates
        updates={updates}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default GeralAdm;
