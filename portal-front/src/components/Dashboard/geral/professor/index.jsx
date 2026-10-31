/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor Conectado às Disciplinas e Ciclos
 *
 * Papel Didático:
 * Atende ao Upgrade do Módulo Acadêmico e à Diretriz 3.4a:
 * 1. Consome `/api/dashboard/geral` com suporte ao parâmetro `divisao` (1º Trimestre, 2º Trimestre, etc.);
 * 2. Disponibiliza seletor em pills para alternar entre as etapas cadastradas do Período Letivo ou Consolidado Geral;
 * 3. Alimenta os 2 componentes principais (AlunosRiscoCards e ResumoTurmasCard) com dados dinâmicos
 *    e réguas de avaliação proporcionais à pontuação da etapa (ex: 60% de 30 pts = 18 pts).
 */

import { useEffect, useMemo, useState } from "react";
import "../especialista/GeralEspecialista.css";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import materiasProfessorMock from "./materiasProfessorMock";
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
      .catch(() => {})
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
  const pontosDivisaoAtual = periodoContexto?.pontos_divisao || 30.0;

  // Formata o intervalo de datas da etapa ativa (ex: '05/02 a 30/04')
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

    if (divisaoSelecionada.includes("1º")) return "05/02 a 30/04";
    if (divisaoSelecionada.includes("2º")) return "02/05 a 31/08";
    if (divisaoSelecionada.includes("3º")) return "01/09 a 18/12";

    return null;
  }, [divisaoSelecionada, divisoesDisponiveis, periodoContexto]);

  // Constrói a lista de matérias do professor a partir de `disciplinas_detalhadas` da API
  // ou utiliza o fallback demonstrativo caso o professor ainda não tenha disciplinas com dados
  const materiasDisponiveis = useMemo(() => {
    const detalhadas = dadosApi?.disciplinas_detalhadas;
    if (Array.isArray(detalhadas) && detalhadas.length > 0) {
      const mediasGerais = dadosApi?.resumo_turmas?.medias || [];
      const freqGerais = dadosApi?.resumo_turmas?.frequencias || [];

      return detalhadas
        .map((disc) => {
          const turmasNomes = new Set(
            (disc.turmas || []).map((t) => t.nome_identificador)
          );
          const mediasDaDisciplina =
            turmasNomes.size > 0
              ? mediasGerais.filter((m) => turmasNomes.has(m.turma))
              : mediasGerais;
          const freqDaDisciplina =
            turmasNomes.size > 0
              ? freqGerais.filter((f) => turmasNomes.has(f.turma))
              : freqGerais;

          return {
            id: String(disc.id_disciplina),
            nome: disc.nome,
            aulas_semanais: disc.aulas_semanais || 4,
            carga_horaria_anual: disc.carga_horaria_anual || 160,
            ciclos: disc.ciclos || [],
            turmas: disc.turmas || [],
            origemReal: true,
            risco: disc.risco || {
              alunosAbaixoDaMedia: 0,
              alunosComFrequenciaInsuficiente: 0,
              alunosPorNota: [],
              alunosPorFrequencia: [],
            },
            medias: mediasDaDisciplina.map((m) => ({
              ...m,
              nota: Number(m.nota || 0) <= 10 ? Number(m.nota || 0) * 10 : Number(m.nota || 0),
            })),
            frequencias: freqDaDisciplina,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }

    return [...materiasProfessorMock].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [dadosApi]);

  const materiaSelecionada =
    materiasDisponiveis.find((m) => m.id === materiaSelecionadaId) ??
    materiasDisponiveis[0];

  if (loading && !dadosApi) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span className="text-muted small">Carregando disciplinas e indicadores do período letivo...</span>
      </div>
    );
  }

  if (!materiaSelecionada) {
    return (
      <p className="text-muted">
        Nenhuma disciplina vinculada ao seu perfil no momento.
      </p>
    );
  }

  return (
    <div className="teacher-overview">
      {/* 1. Barra de Seleção da Etapa do Período Letivo (Trimestres / Bimestres) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 p-2 px-3 bg-white rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="small fw-bold text-dark text-uppercase d-flex align-items-center gap-1 me-2" style={{ letterSpacing: "0.5px" }}>
            <i className="bi bi-calendar-range text-primary"></i>
            Etapa Avaliativa:
          </span>
          <div className="btn-group btn-group-sm flex-wrap p-1 bg-light rounded-pill border" role="group" aria-label="Filtrar por etapa do período letivo">
            <button
              type="button"
              className={`btn-pill-filter ${divisaoSelecionada === "todos" ? "is-active" : ""}`}
              onClick={() => setDivisaoSelecionada("todos")}
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
                  onClick={() => setDivisaoSelecionada(div.nome)}
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
            Ano Letivo {periodoContexto.ano} • {pontosDivisaoAtual} pts na etapa
          </span>
        )}
      </div>

      {/* 2. Seletor de Disciplinas Vinculadas ao Professor */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div
          className="btn-group flex-wrap p-1 bg-light rounded-pill border"
          role="group"
          aria-label="Selecionar matéria"
        >
          {materiasDisponiveis.map((materia) => (
            <button
              type="button"
              key={materia.id}
              className={`btn-pill-filter ${materia.id === materiaSelecionada.id ? "is-active" : ""}`}
              aria-pressed={materia.id === materiaSelecionada.id}
              onClick={() => setMateriaSelecionadaId(materia.id)}
            >
              {materia.nome}
            </button>
          ))}
        </div>

        {/* Metadados da Disciplina (Ciclos, Aulas Semanais e Turmas Herdadas) */}
        {materiaSelecionada.origemReal && (
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
        )}
      </div>

      {/* 3. Componente Impactado 1: Alunos em Risco */}
      <div className="row g-3 mb-3">
        <AlunosRiscoCards
          dados={materiaSelecionada.risco}
          datasPeriodo={datasDivisaoFormatadas}
          periodo={
            divisaoSelecionada && divisaoSelecionada !== "todos"
              ? `${divisaoSelecionada} (${pontosDivisaoAtual} pts)`
              : "Ano Letivo Consolidado"
          }
          metaPontos={
            divisaoSelecionada && divisaoSelecionada !== "todos"
              ? (pontosDivisaoAtual * 0.6).toFixed(1)
              : "60.0"
          }
          isReal={materiaSelecionada.origemReal}
        />
      </div>

      {!materiaSelecionada.origemReal && (
        <p className="text-muted small mb-2">
          Indicadores demonstrativos por matéria; vincule disciplinas ao docente para exibir dados reais.
        </p>
      )}

      {/* 4. Componente Impactado 2: Resumo Gráfico Médias e Frequências por Turma */}
      <GeralMediumCards
        medias={materiaSelecionada.medias}
        frequencias={materiaSelecionada.frequencias}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
        badgeMedia={
          divisaoSelecionada && divisaoSelecionada !== "todos"
            ? `Meta mín. 60% (${(pontosDivisaoAtual * 0.6).toFixed(1)} pts)`
            : "Meta mín. 60%"
        }
      />
    </div>
  );
};

export default GeralProfessor;
