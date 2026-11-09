/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor Conectado às Disciplinas e Ciclos
 *
 * Papel Didático:
 * 1. Consome `/api/dashboard/geral` com suporte ao parâmetro `divisao` (1º Trimestre, 2º Trimestre, etc.);
 * 2. Organiza a seleção de Ciclo Escolar, Disciplina (com <optgroup> por ciclo) e Etapa Avaliativa
 *    em menus <select> nativos e acessíveis, comportando dezenas de disciplinas sem poluição visual;
 * 3. Alimenta AlunosRiscoCards e ResumoTurmasCard com as médias e frequências específicas da disciplina ativa.
 */

import { useEffect, useMemo, useState } from "react";
import "../especialista/GeralEspecialista.css";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import { fetchDashboardGeral } from "../../../../services/geralService";
import { formatarDisciplinaCiclo } from "../../../../utils/formatters";

const SEM_CICLO_VALOR = "__sem_ciclo__";

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
  const [filtroCiclo, setFiltroCiclo] = useState("");
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
          medias: (disc.medias || []).map((m) => ({
            id: m.id,
            turma: m.turma,
            nota:
              m.aproveitamento !== undefined
                ? Number(m.aproveitamento)
                : Number(m.nota ?? 0) * 10,
          })),
          frequencias: disc.frequencias || [],
        };
      })
      .sort((a, b) => a.rotuloCompleto.localeCompare(b.rotuloCompleto, "pt-BR"));
  }, [dadosApi]);

  // Extrai a relação única de ciclos presentes nas disciplinas disponíveis para o filtro superior
  const opcoesCiclo = useMemo(() => {
    const conjunto = new Set();
    let possuiSemCiclo = false;

    for (const mat of materiasDisponiveis) {
      if (mat.ciclos.length === 0) {
        possuiSemCiclo = true;
      } else {
        mat.ciclos.forEach((c) => conjunto.add(c));
      }
    }

    const ordenados = Array.from(conjunto).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return { ciclos: ordenados, possuiSemCiclo };
  }, [materiasDisponiveis]);

  // Aplica o filtro de ciclo sobre as disciplinas disponíveis
  const materiasFiltradas = useMemo(() => {
    if (!filtroCiclo) return materiasDisponiveis;
    if (filtroCiclo === SEM_CICLO_VALOR) {
      return materiasDisponiveis.filter((m) => m.ciclos.length === 0);
    }
    return materiasDisponiveis.filter((m) => m.ciclos.includes(filtroCiclo));
  }, [materiasDisponiveis, filtroCiclo]);

  // Agrupa disciplinas por ciclo principal para uso em <optgroup> quando "Todos os Ciclos" está ativo
  const gruposPorCiclo = useMemo(() => {
    const mapa = new Map();
    for (const mat of materiasFiltradas) {
      const chaveGrupo = mat.ciclos[0] || "Outras Disciplinas";
      if (!mapa.has(chaveGrupo)) {
        mapa.set(chaveGrupo, []);
      }
      mapa.get(chaveGrupo).push(mat);
    }
    return Array.from(mapa.entries()).sort(([cicloA], [cicloB]) =>
      cicloA.localeCompare(cicloB, "pt-BR")
    );
  }, [materiasFiltradas]);

  const materiaSelecionada =
    materiasFiltradas.find((m) => m.id === materiaSelecionadaId) ??
    materiasFiltradas[0] ??
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

      {/* Barra unificada de seleção via <select> (no mesmo padrão limpo de Acadêmico - Disciplinas) */}
      <div className="card border-0 bg-light rounded-4 p-3 mb-3">
        <div className="row g-2 align-items-end">
          {/* 1. Filtro por Ciclo Escolar */}
          <div className="col-12 col-md-4 col-lg-3">
            <label
              htmlFor="prof-filtro-ciclo"
              className="form-label small fw-semibold text-secondary mb-1"
            >
              Ciclo Escolar
            </label>
            <select
              id="prof-filtro-ciclo"
              name="ciclo"
              className="form-select"
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
            >
              <option value="">Todos os Ciclos</option>
              {opcoesCiclo.ciclos.map((cicloNome) => (
                <option key={cicloNome} value={cicloNome}>
                  {cicloNome}
                </option>
              ))}
              {opcoesCiclo.possuiSemCiclo && (
                <option value={SEM_CICLO_VALOR}>Sem ciclo vinculado</option>
              )}
            </select>
          </div>

          {/* 2. Seletor de Disciplina agrupado por Ciclo (<optgroup>) */}
          <div className="col-12 col-md-8 col-lg-5">
            <label
              htmlFor="prof-select-disciplina"
              className="form-label small fw-semibold text-secondary mb-1"
            >
              Disciplina Curricular
            </label>
            <select
              id="prof-select-disciplina"
              name="disciplina"
              className="form-select"
              value={materiaSelecionada.id}
              onChange={(e) => setMateriaSelecionadaId(e.target.value)}
            >
              {!filtroCiclo && gruposPorCiclo.length > 1
                ? gruposPorCiclo.map(([nomeGrupo, itensGrupo]) => (
                    <optgroup key={nomeGrupo} label={nomeGrupo}>
                      {itensGrupo.map((materia) => (
                        <option key={materia.id} value={materia.id}>
                          {materia.rotuloCompleto}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : materiasFiltradas.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.rotuloCompleto}
                    </option>
                  ))}
            </select>
          </div>

          {/* 3. Seletor de Etapa Avaliativa do Período Letivo */}
          <div className="col-12 col-md-12 col-lg-4">
            <label
              htmlFor="prof-select-etapa"
              className="form-label small fw-semibold text-secondary mb-1"
            >
              Etapa Avaliativa
            </label>
            <select
              id="prof-select-etapa"
              name="divisao"
              className="form-select"
              value={divisaoSelecionada || "todos"}
              onChange={(e) => selecionarDivisao(e.target.value)}
            >
              <option value="todos">
                Consolidado Geral
                {periodoContexto?.pontos_consolidados
                  ? ` (${periodoContexto.pontos_consolidados} pts acumulados)`
                  : ""}
              </option>
              {divisoesDisponiveis.map((div) => (
                <option key={div.id_divisao || div.nome} value={div.nome}>
                  {div.nome} ({div.pontos} pts){div.is_atual ? " • Atual" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rodapé informativo discreto (sem botões de flag) */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top small text-muted">
          <span>
            <strong className="text-dark">{materiaSelecionada.rotuloCompleto}</strong>
            {" • "}
            {materiaSelecionada.aulas_semanais} a/sem ({materiaSelecionada.carga_horaria_anual}h/ano)
            {" • "}
            {materiaSelecionada.turmas?.length || 0} turma(s) vinculada(s)
          </span>
          <span>
            <strong>{materiasFiltradas.length}</strong> de{" "}
            <strong>{materiasDisponiveis.length}</strong> disciplina(s)
            {periodoContexto ? ` • Ano Letivo ${periodoContexto.ano}` : ""}
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
