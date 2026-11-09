/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor Conectado às Disciplinas e Ciclos
 *
 * Papel Didático:
 * 1. Consome `/api/dashboard/geral` com suporte ao parâmetro `divisao` (1º Trimestre, 2º Trimestre, etc.);
 * 2. Exibe estritamente as disciplinas reais vinculadas ao docente (ou o catálogo real em modo de simulação Adm);
 * 3. Alimenta AlunosRiscoCards e ResumoTurmasCard com as médias e frequências específicas de cada disciplina.
 */

import { useEffect, useMemo, useState } from "react";
import "../especialista/GeralEspecialista.css";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import { fetchDashboardGeral } from "../../../../services/geralService";

const formatarDataDiaMes = (dataString) => {
  if (!dataString) return "";
  const partes = String(dataString).split("T")[0].split("-");
  if (partes.length >= 3) {
    return `${partes[2]}/${partes[1]}`;
  }
  return dataString;
};

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
  const divisoesDisponiveis = useMemo(
    () => periodoContexto?.divisoes_disponiveis || [],
    [periodoContexto?.divisoes_disponiveis]
  );
  const pontosDivisaoAtual =
    divisaoSelecionada === "todos"
      ? periodoContexto?.pontos_consolidados ?? 0
      : periodoContexto?.pontos_divisao ?? 30.0;

  // Formata o intervalo oficial de datas da etapa ativa vindo do Período Letivo cadastrado
  const datasDivisaoFormatadas = useMemo(() => {
    if (!divisaoSelecionada || divisaoSelecionada === "todos") {
      if (periodoContexto?.data_inicio && periodoContexto?.data_fim) {
        return `${formatarDataDiaMes(periodoContexto.data_inicio)} a ${formatarDataDiaMes(periodoContexto.data_fim)}`;
      }
      return null;
    }

    const divisaoObj = divisoesDisponiveis.find((d) => d.nome === divisaoSelecionada);
    if (divisaoObj?.data_inicio && divisaoObj?.data_fim) {
      return `${formatarDataDiaMes(divisaoObj.data_inicio)} a ${formatarDataDiaMes(divisaoObj.data_fim)}`;
    }

    return null;
  }, [divisaoSelecionada, divisoesDisponiveis, periodoContexto]);

  // Constrói a lista estritamente a partir de `disciplinas_detalhadas` reais da API (zero mocks)
  const materiasDisponiveis = useMemo(() => {
    const detalhadas = dadosApi?.disciplinas_detalhadas;
    if (!Array.isArray(detalhadas) || detalhadas.length === 0) {
      return [];
    }

    return detalhadas
      .map((disc) => ({
        id: String(disc.id_disciplina),
        nome: disc.nome,
        aulas_semanais: disc.aulas_semanais ?? 2,
        carga_horaria_anual: disc.carga_horaria_anual ?? 80,
        ciclos: disc.ciclos || [],
        turmas: disc.turmas || [],
        modoSimulacao: Boolean(disc.modo_simulacao),
        risco: disc.risco || {
          alunosAbaixoDaMedia: 0,
          alunosComFrequenciaInsuficiente: 0,
          alunosPorNota: [],
          alunosPorFrequencia: [],
        },
        medias: (disc.medias || []).map((m) => ({
          id: m.id,
          turma: m.turma,
          nota:
            m.aproveitamento !== undefined
              ? Number(m.aproveitamento)
              : Number(m.nota ?? 0) * 10,
        })),
        frequencias: disc.frequencias || [],
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [dadosApi]);

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
      <div className="teacher-overview">
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white text-center">
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
        <LatestUpdates updates={dadosApi?.ultimas_notificacoes || []} />
      </div>
    );
  }

  return (
    <div className="teacher-overview">
      {erroCarregamento && (
        <div className="alert alert-danger rounded-3 py-2" role="alert">
          Não foi possível atualizar os dados da etapa selecionada: {erroCarregamento}
        </div>
      )}

      {materiaSelecionada.modoSimulacao && (
        <div className="alert alert-info rounded-3 py-2 px-3 mb-2 small d-flex align-items-center gap-2">
          <i className="bi bi-eye-fill" aria-hidden="true"></i>
          <span>
            <strong>Visão Consultiva / Simulação:</strong> exibindo todas as disciplinas reais cadastradas na matriz curricular da escola.
          </span>
        </div>
      )}

      {/* 1. Barra de Seleção da Etapa do Período Letivo (Trimestres / Bimestres) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 p-2 px-3 bg-white rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className="small fw-bold text-dark text-uppercase d-flex align-items-center gap-1 me-2"
            style={{ letterSpacing: "0.5px" }}
          >
            <i className="bi bi-calendar-range text-primary" aria-hidden="true"></i>
            Etapa Avaliativa:
          </span>
          <div
            className="btn-group btn-group-sm flex-wrap p-1 bg-light rounded-pill border"
            role="group"
            aria-label="Filtrar por etapa do período letivo"
          >
            <button
              type="button"
              className={`btn-pill-filter ${divisaoSelecionada === "todos" ? "is-active" : ""}`}
              aria-pressed={divisaoSelecionada === "todos"}
              onClick={() => selecionarDivisao("todos")}
            >
              Consolidado Geral
            </button>
            {divisoesDisponiveis.map((div) => {
              const isAtiva = divisaoSelecionada === div.nome;
              return (
                <button
                  type="button"
                  key={div.id_divisao || div.nome}
                  className={`btn-pill-filter ${isAtiva ? "is-active" : ""}`}
                  aria-pressed={isAtiva}
                  onClick={() => selecionarDivisao(div.nome)}
                >
                  {div.nome} ({div.pontos} pts)
                  {div.is_atual ? " • Atual" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {periodoContexto && (
          <span className="badge bg-light text-secondary border rounded-pill px-3 py-2 small">
            Ano Letivo {periodoContexto.ano} • {pontosDivisaoAtual} pts{" "}
            {divisaoSelecionada === "todos" ? "acumulados" : "na etapa"}
          </span>
        )}
      </div>

      {/* 2. Seletor de Disciplinas Reais */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div
          className="btn-group flex-wrap p-1 bg-light rounded-pill border"
          role="group"
          aria-label="Selecionar matéria"
        >
          {materiasDisponiveis.map((materia) => {
            const isMateriaAtiva = materia.id === materiaSelecionada.id;
            return (
              <button
                type="button"
                key={materia.id}
                className={`btn-pill-filter ${isMateriaAtiva ? "is-active" : ""}`}
                aria-pressed={isMateriaAtiva}
                onClick={() => setMateriaSelecionadaId(materia.id)}
              >
                {materia.nome}
              </button>
            );
          })}
        </div>

        {/* Metadados Reais da Disciplina (Ciclos, Aulas Semanais e Turmas Herdadas) */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
            {materiaSelecionada.aulas_semanais} aulas/sem •{" "}
            {materiaSelecionada.carga_horaria_anual}h anuais
          </span>
          {materiaSelecionada.ciclos?.length > 0 && (
            <span className="badge bg-secondary-subtle text-dark rounded-pill px-3 py-2">
              Ciclo(s): {materiaSelecionada.ciclos.join(", ")}
            </span>
          )}
          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
            {materiaSelecionada.turmas?.length || 0} turma(s) vinculada(s)
          </span>
        </div>
      </div>

      {/* 3. Alunos em Risco na Disciplina Selecionada */}
      <div className="row g-3 mb-3">
        <AlunosRiscoCards
          dados={materiaSelecionada.risco}
          datasPeriodo={datasDivisaoFormatadas}
          periodo={
            divisaoSelecionada && divisaoSelecionada !== "todos"
              ? `${divisaoSelecionada} (${pontosDivisaoAtual} pts)`
              : "Ano Letivo Consolidado"
          }
          metaPontos={pontosDivisaoAtual > 0 ? (pontosDivisaoAtual * 0.6).toFixed(1) : null}
          isReal
        />
      </div>

      {/* 4. Resumo Gráfico Médias e Frequências por Turma na Disciplina Selecionada */}
      <GeralMediumCards
        medias={materiaSelecionada.medias}
        frequencias={materiaSelecionada.frequencias}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
        badgeMedia={
          divisaoSelecionada && divisaoSelecionada !== "todos" && pontosDivisaoAtual > 0
            ? `Meta mín. 60% (${(pontosDivisaoAtual * 0.6).toFixed(1)} pts)`
            : "Meta mín. 60%"
        }
        href="/dashboard/turmas?aba=notas"
      />
      <LatestUpdates updates={dadosApi?.ultimas_notificacoes || []} />
    </div>
  );
};

export default GeralProfessor;
