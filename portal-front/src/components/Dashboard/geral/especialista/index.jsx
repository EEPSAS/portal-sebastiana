import "./GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "./Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "./Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "./LatestUpdates/UltimasAtualizacoes.jsx";
import PainelPeriodoGeral from "../common/PainelPeriodoGeral.jsx";
import { montarOpcoesPeriodoContexto } from "../common/geralPeriodoUtils.js";

/**
 * GeralEspecialista (index.jsx) - Painel Analítico do Especialista Pedagógico
 *
 * Papel Didático:
 * Consome o hook unificado useDashboardEspecialista() para buscar os dados pedagógicos
 * reais entregues pelo backend e distribuí-los para os componentes filhos:
 * 1. GeralSmallCards (4 KPIs principais da gestão pedagógica);
 * 2. GeralMediumCards (Gráficos Recharts de Média de Notas e Taxa de Presença por Turma);
 * 3. LatestUpdates (Feed das cinco notificações mais recentes).
 */
const GeralEspecialista = () => {
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
          Carregando estatísticas pedagógicas...
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

  // 3. Estado Assíncrono: Vazio (sem indicadores nem turmas cadastradas)
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
        Nenhum indicador pedagógico disponível no momento.
      </div>
    );
  }

  return (
    <div className="geral-especialista-page geral-page-viewport-lock">
      {error && (
        <div className="alert alert-danger rounded-3 py-2 flex-shrink-0" role="alert">
          Não foi possível atualizar os dados da etapa selecionada: {error}
        </div>
      )}

      {periodoContexto && (
        <PainelPeriodoGeral
          rotulo="Etapa Avaliativa:"
          opcoes={montarOpcoesPeriodoContexto(periodoContexto, "Consolidado Geral")}
          valorSelecionado={divisaoAtiva || "todos"}
          onSelecionar={(v) => setDivisaoSelecionada(v)}
          anoLetivo={periodoContexto.ano}
          ariaLabel="Filtrar indicadores por etapa do período letivo"
          className="flex-shrink-0"
        />
      )}

      {/* Linha superior: 4 Small Cards de KPIs pedagógicos */}
      <div className="row g-2 g-md-3 flex-shrink-0">
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

      {/* Linha intermediária: Gráficos Recharts de Médias e Frequências por Turma */}
      <div className="flex-shrink-0">
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
      </div>

      {/* Linha inferior: Feed das últimas notificações escolares preenchendo a viewport com scroll interno (isolado da etapa avaliativa) */}
      <div className="geral-fill-row d-flex flex-column min-h-0">
        <LatestUpdates
          updates={updates}
          loading={false}
          error={null}
        />
      </div>
    </div>
  );
};

export default GeralEspecialista;
