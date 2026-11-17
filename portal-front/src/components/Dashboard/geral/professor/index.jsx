/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor Conectado às Disciplinas
 *
 * Papel Didático:
 * 1. Consome `/api/dashboard/geral?divisao=...` com filtro padronizado de Etapa Avaliativa (pílulas);
 * 2. Acopla o seletor de disciplinas dentro do componente DesempenhoAlunosCard;
 * 3. Exibe os rankings de Pior e Melhor Desempenho (Top 5) por Nota e por Frequência;
 * 4. Apresenta o feed de Últimas Notificações (filtrado para as turmas do docente)
 *    preenchendo a viewport com rolagem interna no elemento, sem barra na página.
 */

import { useEffect, useMemo, useState } from "react";
import "../especialista/GeralEspecialista.css";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes";
import DesempenhoAlunosCard from "./Cards/DesempenhoAlunosCard";
import PainelPeriodoGeral from "../common/PainelPeriodoGeral";
import { montarOpcoesPeriodoContexto } from "../common/geralPeriodoUtils";
import { fetchDashboardGeral } from "../../../../services/geralService";
import { formatarDisciplinaCiclo } from "../../../../utils/formatters";

const GeralProfessor = () => {
  const [dadosApi, setDadosApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState("");
  const [divisaoSelecionada, setDivisaoSelecionada] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");

  const selecionarDivisao = (divisao) => {
    if (divisao === divisaoSelecionada) return;
    setErroCarregamento("");
    setLoading(true);
    setDivisaoSelecionada(divisao);
  };

  useEffect(() => {
    let ativo = true;

    fetchDashboardGeral({ divisao: divisaoSelecionada })
      .then((payload) => {
        if (ativo) {
          setDadosApi(payload || null);
          if (!divisaoSelecionada && payload?.periodo_contexto?.divisao_selecionada) {
            setDivisaoSelecionada(payload.periodo_contexto.divisao_selecionada);
          }
        }
      })
      .catch((erro) => {
        if (ativo) {
          setErroCarregamento(erro.message || "Não foi possível carregar os dados do painel.");
        }
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [divisaoSelecionada]);

  const periodoContexto = dadosApi?.periodo_contexto;
  const pontosDivisaoAtual =
    divisaoSelecionada === "todos"
      ? periodoContexto?.pontos_consolidados ?? 0
      : periodoContexto?.pontos_divisao ?? 30.0;

  // Constrói a lista estritamente a partir de `disciplinas_detalhadas` reais da API (zero mocks)
  const materiasDisponiveis = useMemo(() => {
    const detalhadas = dadosApi?.disciplinas_detalhadas;
    if (!Array.isArray(detalhadas) || detalhadas.length === 0) {
      return [];
    }

    return detalhadas
      .map((disc) => {
        const ciclosLista = Array.isArray(disc.ciclos) ? disc.ciclos.filter(Boolean) : [];
        const rotuloCompleto = formatarDisciplinaCiclo({
          nome: disc.nome,
          ciclos: ciclosLista,
        });

        return {
          id: String(disc.id_disciplina),
          nome: disc.nome,
          rotuloCompleto,
          aulas_semanais: disc.aulas_semanais ?? 2,
          carga_horaria_anual: disc.carga_horaria_anual ?? 80,
          ciclos: ciclosLista,
          turmas: disc.turmas || [],
          modoSimulacao: Boolean(disc.modo_simulacao),
          risco: disc.risco || {
            alunosAbaixoDaMedia: 0,
            alunosComFrequenciaInsuficiente: 0,
            alunosPorNota: [],
            alunosPorFrequencia: [],
          },
          desempenho: disc.desempenho || null,
        };
      })
      .sort((a, b) => a.rotuloCompleto.localeCompare(b.rotuloCompleto, "pt-BR"));
  }, [dadosApi]);

  // Agrupa disciplinas por ciclo para uso em <optgroup>
  const gruposPorCiclo = useMemo(() => {
    const mapa = new Map();
    for (const mat of materiasDisponiveis) {
      const chaveGrupo = mat.ciclos[0] || "Outras Disciplinas";
      if (!mapa.has(chaveGrupo)) {
        mapa.set(chaveGrupo, []);
      }
      mapa.get(chaveGrupo).push(mat);
    }
    return Array.from(mapa.entries()).sort(([cicloA], [cicloB]) =>
      cicloA.localeCompare(cicloB, "pt-BR")
    );
  }, [materiasDisponiveis]);

  const materiaSelecionada =
    materiasDisponiveis.find((m) => m.id === materiaSelecionadaId) ??
    materiasDisponiveis[0] ??
    null;

  if (loading && !dadosApi) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true"></div>
        <span className="text-muted small">
          Carregando disciplinas e indicadores do período letivo...
        </span>
      </div>
    );
  }

  if (erroCarregamento && !dadosApi) {
    return (
      <div className="alert alert-danger rounded-3" role="alert">
        Não foi possível carregar os dados do painel: {erroCarregamento}
      </div>
    );
  }

  // Estado vazio legítimo quando o docente ainda não possui disciplinas alocadas
  if (!materiaSelecionada) {
    return (
      <div className="teacher-overview geral-page-viewport-lock">
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white text-center flex-shrink-0">
          <div className="mb-2 text-primary">
            <i className="bi bi-journal-bookmark fs-2" aria-hidden="true"></i>
          </div>
          <h2 className="h5 fw-bold text-dark mb-1">
            Nenhuma disciplina vinculada ao seu perfil docente
          </h2>
          <p className="text-secondary small mb-0">
            Solicite ao Especialista Pedagógico ou à Administração a alocação de suas disciplinas nos respectivos ciclos/turmas para acompanhar médias, frequências e alertas de risco reais.
          </p>
        </div>
        <div className="geral-fill-row d-flex flex-column min-h-0">
          <LatestUpdates updates={dadosApi?.ultimas_notificacoes || []} />
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-overview geral-page-viewport-lock">
      {erroCarregamento && (
        <div className="alert alert-danger rounded-3 py-2 flex-shrink-0" role="alert">
          Não foi possível atualizar os dados da etapa selecionada: {erroCarregamento}
        </div>
      )}

      {/* 1. Barra Padronizada de Etapa Avaliativa */}
      {periodoContexto && (
        <PainelPeriodoGeral
          rotulo="Etapa Avaliativa:"
          opcoes={montarOpcoesPeriodoContexto(periodoContexto, "Consolidado Geral")}
          valorSelecionado={divisaoSelecionada || "todos"}
          onSelecionar={selecionarDivisao}
          anoLetivo={periodoContexto.ano}
          ariaLabel="Filtrar indicadores docentes por etapa avaliativa"
          className="flex-shrink-0"
        />
      )}

      {/* 2. Painel Unificado de Desempenho dos Alunos (Por Nota / Por Frequência com Seletor Acoplado) */}
      <div className="flex-shrink-0">
        <DesempenhoAlunosCard
          disciplinas={materiasDisponiveis}
          disciplinaSelecionadaId={materiaSelecionada.id}
          onSelecionarDisciplina={setMateriaSelecionadaId}
          gruposPorCiclo={gruposPorCiclo}
          divisaoNome={divisaoSelecionada}
          pontosDivisao={pontosDivisaoAtual}
        />
      </div>

      {/* 3. Feed das últimas notificações dos alunos acessíveis, ocupando o restante da tela */}
      <div className="geral-fill-row d-flex flex-column min-h-0">
        <LatestUpdates
          updates={dadosApi?.ultimas_notificacoes || []}
          loading={loading}
          error={erroCarregamento}
        />
      </div>
    </div>
  );
};

export default GeralProfessor;
