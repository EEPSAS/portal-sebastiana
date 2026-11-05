import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { obterPeriodoLetivoAtivo } from "../../../services/periodosLetivosService";
import { formatarDisciplinaCiclo } from "../../../utils/formatters";
import ModalGerarBoletim from "./ModalGerarBoletim";
import ModalLancamentoManual from "./ModalLancamentoManual";
import VelocimetroPresenca from "./VelocimetroPresenca";

/**
 * NotasAba.jsx - Gestão e Consulta de Notas e Diário Escolar por Turma
 *
 * Papel Didático:
 * 1. Controle de guias superiores em alto contraste (estilo Access estilizado) exibindo
 *    `nome_identificador` da turma e abaixo Ciclo, Turno e Contagem de Alunos.
 * 2. Painel Esquerdo ("Resumo da Turma"):
 *    - Gráfico Donut de Média Geral no topo (sem legendas inferiores redundantes);
 *    - Velocímetro / Manômetro semicircular de Faltas logo abaixo, consumindo `taxa_absenteismo`.
 * 3. Painel Direito:
 *    - Destaque imediato do nome da turma selecionada (`nome_identificador`) no cabeçalho;
 *    - Filtros cumulativos (Aluno + Período + Matéria) e tabela inteligente com teto oficial da etapa.
 */
export default function NotasAba({
  turmas = [],
  resumoGeral = [],
  turmaSelecionadaId = "",
  onSelecionarTurma,
  notas = [],
  periodoFiltro = "",
  onPeriodoFiltroChange,
  podeGerenciar = false,
  onAbrirImportarNotas,
  onAbrirExcluirDadosCsv,
  onManualSave,
  loadingNotas = false,
  alunosTurma = [],
  alunoFiltroId = "",
  onAlunoFiltroChange,
  divisoesPeriodo = [],
}) {
  const [periodoAtivoLocal, setPeriodoAtivoLocal] = useState(null);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [baseCalculoAnual, setBaseCalculoAnual] = useState("100");
  const [modalBoletimAberto, setModalBoletimAberto] = useState(false);
  const [modalManualAberto, setModalManualAberto] = useState(false);
  const [subAbaPainel, setSubAbaPainel] = useState("notas");

  // Busca o período letivo ativo institucional para compor as etapas oficiais
  useEffect(() => {
    let ativo = true;
    obterPeriodoLetivoAtivo()
      .then((p) => {
        if (ativo && p) setPeriodoAtivoLocal(p);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  // Divisões do período letivo para o seletor temporal
  const divisoesDisponiveis =
    divisoesPeriodo && divisoesPeriodo.length > 0
      ? divisoesPeriodo
      : periodoAtivoLocal?.divisoes && periodoAtivoLocal.divisoes.length > 0
      ? periodoAtivoLocal.divisoes
      : [
          { id_divisao: 1, nome: "1º Trimestre", pontos: 30 },
          { id_divisao: 2, nome: "2º Trimestre", pontos: 35 },
          { id_divisao: 3, nome: "3º Trimestre", pontos: 35 },
        ];

  // Turma ativa selecionada (usa resumoGeral como fallback caso turmas esteja sincronizando)
  const listaBaseTurmas = turmas.length > 0 ? turmas : resumoGeral;
  const turmaAtiva =
    listaBaseTurmas.find((t) => String(t.id_turma) === String(turmaSelecionadaId)) ||
    listaBaseTurmas[0] ||
    null;

  // Resumo analítico da turma ativa validado pelo contrato Zod (TurmaResumoSchema)
  const resumoTurmaAtiva = turmaAtiva
    ? resumoGeral.find((r) => String(r.id_turma) === String(turmaAtiva.id_turma)) || null
    : null;

  const mediaGeralTurma = Number(resumoTurmaAtiva?.media_geral ?? 0);
  const taxaFaltasTurma = Number(resumoTurmaAtiva?.taxa_absenteismo ?? 0);

  // Dados reais para o Gráfico Donut de Desempenho (ou anel neutro quando ainda sem avaliações)
  const dist = resumoTurmaAtiva?.distribuicao;
  const somaDist =
    Number(dist?.acima ?? 0) + Number(dist?.na_media ?? 0) + Number(dist?.abaixo ?? 0);

  const dadosDonut =
    somaDist > 0
      ? [
          { name: "Acima da Média", value: Math.max(0.1, Number(dist.acima)), color: "#3b82f6" },
          { name: "Na Média", value: Math.max(0.1, Number(dist.na_media)), color: "#f59e0b" },
          { name: "Abaixo da Média", value: Math.max(0.1, Number(dist.abaixo)), color: "#ec4899" },
        ]
      : [{ name: "Sem Avaliações", value: 100, color: "#e2e8f0" }];

  // Relação única de disciplinas disponíveis para o filtro da turma selecionada
  const mapaDisciplinas = new Map();
  notas.forEach((n) => {
    if (n.disciplina_id && n.disciplina?.nome) {
      mapaDisciplinas.set(String(n.disciplina_id), n.disciplina.nome);
    }
  });
  const disciplinasDisponiveis = Array.from(mapaDisciplinas.entries()).map(([id, nome]) => ({
    id,
    nome,
  }));

  const temFiltroAluno = Boolean(alunoFiltroId);

  // Formatação segura de datas no padrão brasileiro DD/MM/AAAA
  const formatarData = (dataStr) => {
    if (!dataStr) return "-";
    try {
      const d = new Date(dataStr.includes("T") ? dataStr : `${dataStr}T00:00:00`);
      if (Number.isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString("pt-BR");
    } catch {
      return dataStr;
    }
  };

  // Filtragem cumulativa (Aluno + Disciplina + Período)
  let notasFiltradas = [...notas];

  if (alunoFiltroId) {
    notasFiltradas = notasFiltradas.filter(
      (n) => String(n.usuario_id) === String(alunoFiltroId)
    );
  }

  if (disciplinaFiltro) {
    notasFiltradas = notasFiltradas.filter(
      (n) => String(n.disciplina_id) === String(disciplinaFiltro)
    );
  }

  let notasExibidas;

  if (periodoFiltro && periodoFiltro !== "todos") {
    const porEtapa = notasFiltradas.filter(
      (n) => String(n.periodo_letivo).toLowerCase() === String(periodoFiltro).toLowerCase()
    );

    notasExibidas = porEtapa.map((n) => {
      const notaValor = Number(n.valor_nota ?? 0);
      const maximo = Number(n.valor_maximo_periodo ?? 30.0);
      const percentual = maximo > 0 ? (notaValor / maximo) * 100 : 0;

      const situacaoCalculada =
        n.situacao ||
        (percentual >= 80
          ? "Acima da Média"
          : percentual >= 60
          ? "Na Média"
          : "Abaixo da Média");

      return {
        id: n.id_nota || `${n.usuario_id}_${n.disciplina_id}_${n.periodo_letivo}`,
        aluno_id: n.usuario_id,
        aluno_nome: n.aluno?.name || "Aluno",
        disciplina_id: n.disciplina_id,
        disciplina_nome: n.disciplina?.nome || "Disciplina",
        periodo_letivo: n.periodo_letivo || periodoFiltro,
        nota: notaValor,
        valor_maximo_periodo: maximo,
        situacao: situacaoCalculada,
        percentual_faltas: Number(n.percentual_faltas ?? 0),
        total_faltas: Number(n.total_faltas ?? 0),
        data_registro: formatarData(n.data_registro),
      };
    });
  } else {
    // Consolidação em "Todos os Períodos": agrupa por disciplina (e aluno) somando notas e pegando data mais recente
    const agrupado = {};

    notasFiltradas.forEach((n) => {
      const chave = alunoFiltroId
        ? `disc_${n.disciplina_id}`
        : `aluno_${n.usuario_id}_disc_${n.disciplina_id}`;

      if (!agrupado[chave]) {
        agrupado[chave] = {
          id: chave,
          aluno_id: n.usuario_id,
          aluno_nome: n.aluno?.name || "Aluno",
          disciplina_id: n.disciplina_id,
          disciplina_nome: n.disciplina?.nome || "Disciplina",
          periodo_letivo: "Todos os Períodos",
          somaNotas: 0,
          pontosConcluidos: 0,
          percentual_faltas: Number(n.percentual_faltas ?? 0),
          total_faltas: Number(n.total_faltas ?? 0),
          data_mais_recente: n.data_registro || "",
        };
      }

      const valorNota = Number(n.valor_nota ?? 0);
      const maximoEtapa = Number(n.valor_maximo_periodo ?? 30.0);

      agrupado[chave].somaNotas += valorNota;
      agrupado[chave].pontosConcluidos += maximoEtapa;

      if (
        n.data_registro &&
        (!agrupado[chave].data_mais_recente ||
          new Date(n.data_registro) > new Date(agrupado[chave].data_mais_recente))
      ) {
        agrupado[chave].data_mais_recente = n.data_registro;
      }

      if (n.percentual_faltas !== undefined && n.percentual_faltas !== null) {
        agrupado[chave].percentual_faltas = Number(n.percentual_faltas);
      }
    });

    notasExibidas = Object.values(agrupado).map((item) => {
      const divisorTotal = baseCalculoAnual === "100" ? 100.0 : item.pontosConcluidos || 100.0;
      const percentual = divisorTotal > 0 ? (item.somaNotas / divisorTotal) * 100 : 0;

      const situacao =
        percentual >= 80
          ? "Acima da Média"
          : percentual >= 60
          ? "Na Média"
          : "Abaixo da Média";

      return {
        id: item.id,
        aluno_id: item.aluno_id,
        aluno_nome: item.aluno_nome,
        disciplina_id: item.disciplina_id,
        disciplina_nome: item.disciplina_nome,
        periodo_letivo: item.periodo_letivo,
        nota: item.somaNotas,
        valor_maximo_periodo: divisorTotal,
        situacao,
        percentual_faltas: item.percentual_faltas,
        total_faltas: item.total_faltas,
        data_registro: formatarData(item.data_mais_recente),
      };
    });
  }

  // Badge semântica de situação do estudante
  const renderBadgeSituacao = (situacao) => {
    switch (situacao) {
      case "Acima da Média":
        return (
          <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold">
            Acima da Média
          </span>
        );
      case "Na Média":
        return (
          <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 fw-semibold">
            Na Média
          </span>
        );
      default:
        return (
          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 fw-semibold">
            Abaixo da Média
          </span>
        );
    }
  };

  // Metadados da turma ativa validados via contrato (nome_identificador, ciclo_nome, turno, total_alunos)
  const nomeTurmaAtiva =
    turmaAtiva?.nome_identificador || resumoTurmaAtiva?.nome_identificador || "Nenhuma turma cadastrada";
  const cicloNomeAtivo =
    turmaAtiva?.ciclo_nome || resumoTurmaAtiva?.ciclo_nome || "Sem Ciclo Vinculado";
  const turnoNomeAtivo = turmaAtiva?.turno || resumoTurmaAtiva?.turno || "Integral";
  const totalAlunosAtivo =
    turmaAtiva?.total_alunos ?? resumoTurmaAtiva?.total_alunos ?? alunosTurma.length ?? 0;

  return (
    <div className="notas-aba-container">
      {/* 1. Controle de Guias Horizontais das Turmas em Alto Destaque (Estilo Access) */}
      <div className="turmas-tab-bar" role="tablist" aria-label="Guias de turmas escolares">
        {listaBaseTurmas.map((t) => {
          const ativa = String(t.id_turma) === String(turmaAtiva?.id_turma);
          const nomeGuia = t.nome_identificador || `Turma #${t.id_turma}`;
          const cNome = t.ciclo_nome || "Sem Ciclo";
          const tNome = t.turno || "Integral";
          const countAlunos = t.total_alunos ?? 0;

          return (
            <button
              key={t.id_turma}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => onSelecionarTurma && onSelecionarTurma(String(t.id_turma))}
              className={`turmas-tab-item text-start ${ativa ? "is-active" : ""}`}
            >
              <div className="turmas-tab-title d-flex align-items-center gap-1.5">
                <i className={`bi ${ativa ? "bi-mortarboard-fill text-primary" : "bi-mortarboard text-secondary"}`}></i>
                <span className="text-truncate">{nomeGuia}</span>
              </div>
              <div className="turmas-tab-subtitle">
                {cNome} • {tNome} • {countAlunos} {countAlunos === 1 ? "aluno" : "alunos"}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Painel Central da Turma Selecionada */}
      <div className="row g-3">
        {/* Painel Esquerdo: Resumo da Turma (Donut de Média + Velocímetro logo abaixo, sem legendas intermediárias) */}
        <div className="col-12 col-lg-4 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white d-flex flex-column justify-content-between">
            <div>
              {/* Título do Card */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary"
                  style={{ width: 34, height: 34 }}
                >
                  <i className="bi bi-people-fill fs-6"></i>
                </div>
                <h6 className="fw-bold mb-0 text-dark">Resumo da Turma</h6>
              </div>

              {/* Gráfico 1: Donut de Média Geral de Notas */}
              <div
                className="position-relative d-flex justify-content-center align-items-center"
                style={{ height: 170 }}
              >
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={dadosDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={somaDist > 0 ? 3 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {dadosDonut.map((entry, index) => (
                        <Cell key={`donut-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="position-absolute text-center" style={{ pointerEvents: "none" }}>
                  <span className="d-block fw-bolder fs-3 text-dark lh-1">
                    {mediaGeralTurma.toFixed(1)}
                  </span>
                  <small className="text-muted fw-semibold" style={{ fontSize: "0.75rem" }}>
                    Média Geral
                  </small>
                </div>
              </div>
            </div>

            <hr className="my-2 border-secondary-subtle" />

            {/* Gráfico 2: Velocímetro / Manômetro de Faltas (subido diretamente para abaixo do Donut) */}
            <div className="pt-1 pb-1">
              <VelocimetroPresenca taxaFaltas={taxaFaltasTurma} />
            </div>
          </div>
        </div>

        {/* Painel Direito: Turma Selecionada em Destaque e Diário Escolar */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            {/* Cabeçalho de Identificação da Turma Selecionada */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white shadow-sm"
                  style={{ width: 48, height: 48 }}
                >
                  <i className="bi bi-mortarboard-fill fs-4"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h4 className="fw-bolder mb-0 text-primary">
                      {nomeTurmaAtiva}
                    </h4>
                    <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-semibold">
                      Turma Selecionada
                    </span>
                  </div>
                  <div className="small text-secondary fw-medium mt-0.5">
                    {cicloNomeAtivo} • {turnoNomeAtivo} • {totalAlunosAtivo}{" "}
                    {totalAlunosAtivo === 1 ? "aluno" : "alunos"}
                  </div>
                </div>
              </div>
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-1.5 fw-semibold">
                {turmaAtiva?.status || "Ativa"}
              </span>
            </div>

            {/* Sub-abas de Navegação: Notas | Alunos | Informações */}
            <div className="d-flex align-items-center gap-4 mb-4 border-bottom">
              <button
                type="button"
                onClick={() => setSubAbaPainel("notas")}
                className={`btn btn-link text-decoration-none px-1 pb-2 pt-0 fw-semibold position-relative border-0 ${
                  subAbaPainel === "notas" ? "text-primary" : "text-muted"
                }`}
                style={{ fontSize: "0.95rem" }}
              >
                <i className="bi bi-file-earmark-text me-1.5"></i>
                Notas
                {subAbaPainel === "notas" && (
                  <span
                    className="position-absolute bottom-0 start-0 w-100 bg-primary"
                    style={{ height: 2, borderRadius: 2 }}
                  ></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSubAbaPainel("alunos")}
                className={`btn btn-link text-decoration-none px-1 pb-2 pt-0 fw-semibold position-relative border-0 ${
                  subAbaPainel === "alunos" ? "text-primary" : "text-muted"
                }`}
                style={{ fontSize: "0.95rem" }}
              >
                <i className="bi bi-person-lines-fill me-1.5"></i>
                Alunos ({alunosTurma.length})
                {subAbaPainel === "alunos" && (
                  <span
                    className="position-absolute bottom-0 start-0 w-100 bg-primary"
                    style={{ height: 2, borderRadius: 2 }}
                  ></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSubAbaPainel("informacoes")}
                className={`btn btn-link text-decoration-none px-1 pb-2 pt-0 fw-semibold position-relative border-0 ${
                  subAbaPainel === "informacoes" ? "text-primary" : "text-muted"
                }`}
                style={{ fontSize: "0.95rem" }}
              >
                <i className="bi bi-info-circle me-1.5"></i>
                Informações
                {subAbaPainel === "informacoes" && (
                  <span
                    className="position-absolute bottom-0 start-0 w-100 bg-primary"
                    style={{ height: 2, borderRadius: 2 }}
                  ></span>
                )}
              </button>
            </div>

            {/* CONTEÚDO 1: SUB-ABA NOTAS */}
            {subAbaPainel === "notas" && (
              <>
                {/* Linha de Título e Botões de Ação */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary"
                      style={{ width: 28, height: 28 }}
                    >
                      <i className="bi bi-card-checklist fs-6"></i>
                    </div>
                    <h5 className="fw-bold mb-0 text-dark">Notas da Turma</h5>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {/* Botão Gerar Boletim Técnico */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                      onClick={() => setModalBoletimAberto(true)}
                      disabled={!turmaAtiva}
                      title="Gerar Boletim Escolar em PDF técnico ou planilha Excel"
                    >
                      <i className="bi bi-printer"></i>
                      Gerar Boletim
                    </button>

                    {/* Botão Importar Notas CSV */}
                    {podeGerenciar && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                        onClick={onAbrirImportarNotas}
                        disabled={!turmaAtiva}
                        title="Importar planilha consolidada CSV de notas e faltas"
                      >
                        <i className="bi bi-upload"></i>
                        Cadastrar Notas (CSV)
                      </button>
                    )}

                    {podeGerenciar && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                        onClick={() => setModalManualAberto(true)}
                        disabled={!turmaAtiva || alunosTurma.length === 0}
                        title="Registrar nota ou frequência manual para um aluno"
                      >
                        <i className="bi bi-pencil-square"></i>
                        Lançamento manual
                      </button>
                    )}

                    {/* Botão Excluir Diário CSV */}
                    {podeGerenciar && notas.length > 0 && onAbrirExcluirDadosCsv && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-2.5"
                        onClick={onAbrirExcluirDadosCsv}
                        title="Excluir dados importados via CSV da turma e período selecionados"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de Filtros Cumulativos (Aluno + Período + Disciplina) */}
                <div className="row g-2 mb-3 align-items-center">
                  {/* Filtro 1: Seleção de Aluno */}
                  <div className="col-12 col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-person"></i>
                      </span>
                      <select
                        className="form-select border-start-0 ps-1"
                        value={alunoFiltroId}
                        onChange={(e) => onAlunoFiltroChange && onAlunoFiltroChange(e.target.value)}
                        aria-label="Filtrar por estudante"
                      >
                        <option value="">Todos os Alunos</option>
                        {alunosTurma.map((aluno) => (
                          <option key={aluno.id} value={aluno.id}>
                            {aluno.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filtro 2: Período Letivo */}
                  <div className="col-12 col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-calendar3"></i>
                      </span>
                      <select
                        className="form-select border-start-0 ps-1"
                        value={periodoFiltro}
                        onChange={(e) => onPeriodoFiltroChange && onPeriodoFiltroChange(e.target.value)}
                        aria-label="Filtrar por etapa do período letivo"
                      >
                        <option value="todos">Todos os Períodos</option>
                        {divisoesDisponiveis.map((div) => (
                          <option key={div.id_divisao || div.id || div.nome} value={div.nome}>
                            {div.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filtro 3: Select de Disciplinas da Turma */}
                  <div className="col-12 col-sm-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-journal-bookmark"></i>
                      </span>
                      <select
                        className="form-select border-start-0 ps-1"
                        value={disciplinaFiltro}
                        onChange={(e) => setDisciplinaFiltro(e.target.value)}
                        aria-label="Filtrar por matéria da turma"
                      >
                        <option value="">Todas as Matérias</option>
                        {disciplinasDisponiveis.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Toggle Pill de Base de Cálculo Anual (quando "Todos os Períodos" está ativo) */}
                {periodoFiltro === "todos" && (
                  <div className="d-flex align-items-center justify-content-between p-2 mb-3 bg-light rounded-3 border">
                    <div className="small text-muted d-flex align-items-center gap-1.5">
                      <i className="bi bi-calculator text-primary"></i>
                      <span>Base de totalização dos pontos:</span>
                    </div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        onClick={() => setBaseCalculoAnual("100")}
                        className={`btn btn-xs px-2.5 py-0.5 rounded-pill fw-semibold ${
                          baseCalculoAnual === "100"
                            ? "btn-primary text-white shadow-xs"
                            : "btn-outline-secondary"
                        }`}
                      >
                        Total Anual (100 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaseCalculoAnual("concluidas")}
                        className={`btn btn-xs px-2.5 py-0.5 rounded-pill ms-1 fw-semibold ${
                          baseCalculoAnual === "concluidas"
                            ? "btn-primary text-white shadow-xs"
                            : "btn-outline-secondary"
                        }`}
                      >
                        Etapas Concluídas
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabela de Notas e Diário Escolar */}
                <div className="table-responsive rounded-3 border">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
                    <thead className="table-light text-muted small fw-bold">
                      <tr>
                        {!temFiltroAluno && <th className="ps-3 py-2.5">ALUNO</th>}
                        <th className="py-2.5">DISCIPLINA</th>
                        {temFiltroAluno && <th className="py-2.5 text-center">% FALTAS</th>}
                        <th className="py-2.5">PERÍODO LETIVO</th>
                        <th className="py-2.5 text-center">NOTA</th>
                        <th className="py-2.5 text-center">SITUAÇÃO</th>
                        <th className="pe-3 py-2.5 text-end">DATA REGISTRO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingNotas ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            <span
                              className="spinner-border spinner-border-sm me-2 text-primary"
                              role="status"
                            ></span>
                            Carregando notas da turma...
                          </td>
                        </tr>
                      ) : notasExibidas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                            Nenhum registro de nota encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        notasExibidas.map((item) => (
                          <tr key={item.id}>
                            {!temFiltroAluno && (
                              <td className="ps-3 fw-bold text-dark text-nowrap">
                                {item.aluno_nome}
                              </td>
                            )}

                            <td>
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fw-semibold text-wrap text-start">
                                {formatarDisciplinaCiclo(item.disciplina_nome, cicloNomeAtivo)}
                              </span>
                            </td>

                            {temFiltroAluno && (
                              <td className="text-center">
                                <span
                                  className={`badge rounded-pill px-2 py-1 fw-semibold ${
                                    Number(item.percentual_faltas) >= 20
                                      ? "bg-danger-subtle text-danger border border-danger-subtle"
                                      : Number(item.percentual_faltas) >= 10
                                      ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                                      : "bg-success-subtle text-success border border-success-subtle"
                                  }`}
                                >
                                  {Number(item.percentual_faltas || 0).toFixed(1)}%
                                </span>
                              </td>
                            )}

                            <td className="text-muted text-nowrap">{item.periodo_letivo}</td>

                            <td className="text-center text-nowrap">
                              <span
                                className={`fw-bolder ${
                                  item.situacao === "Abaixo da Média"
                                    ? "text-danger"
                                    : "text-primary"
                                }`}
                              >
                                {Number(item.nota).toFixed(1)}
                              </span>
                              <span className="text-muted small ms-1">
                                / {Number(item.valor_maximo_periodo).toFixed(0)}
                              </span>
                            </td>

                            <td className="text-center text-nowrap">
                              {renderBadgeSituacao(item.situacao)}
                            </td>

                            <td className="pe-3 text-end text-muted small text-nowrap">
                              {item.data_registro}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* CONTEÚDO 2: SUB-ABA ALUNOS DA TURMA */}
            {subAbaPainel === "alunos" && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0 text-dark">
                    Estudantes Matriculados ({alunosTurma.length})
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                    onClick={() => {
                      setSubAbaPainel("notas");
                      onAlunoFiltroChange && onAlunoFiltroChange("");
                    }}
                  >
                    Ver Todas as Notas
                  </button>
                </div>
                <div className="list-group list-group-flush rounded-3 border">
                  {alunosTurma.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="list-group-item d-flex align-items-center justify-content-between py-2.5 px-3"
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle bg-light text-secondary d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 34, height: 34 }}
                        >
                          {aluno.name ? aluno.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <div className="fw-bold text-dark small">{aluno.name}</div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {aluno.email}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
                        onClick={() => {
                          onAlunoFiltroChange && onAlunoFiltroChange(String(aluno.id));
                          setSubAbaPainel("notas");
                        }}
                      >
                        Filtrar Notas
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTEÚDO 3: SUB-ABA INFORMAÇÕES DA TURMA */}
            {subAbaPainel === "informacoes" && (
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted mb-1">Nome da Turma</div>
                    <div className="fw-bold text-dark">{nomeTurmaAtiva}</div>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted mb-1">Ciclo Escolar</div>
                    <div className="fw-bold text-dark">{cicloNomeAtivo}</div>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted mb-1">Turno</div>
                    <div className="fw-bold text-dark">{turnoNomeAtivo}</div>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="small text-muted mb-1">Ano Letivo</div>
                    <div className="fw-bold text-dark">{turmaAtiva?.ano_letivo || "-"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Modal Oficial de Geração de Boletim Técnico (PDF A4 e Excel) */}
      <ModalGerarBoletim
        isOpen={modalBoletimAberto}
        onClose={() => setModalBoletimAberto(false)}
        turma={turmaAtiva}
        alunos={alunosTurma}
        notas={notas}
        periodosDisponiveis={divisoesDisponiveis}
        alunoPreSelecionadoId={alunoFiltroId}
      />
      {modalManualAberto && turmaAtiva && (
        <ModalLancamentoManual
          turmaId={turmaAtiva.id_turma}
          alunos={alunosTurma}
          periodos={divisoesDisponiveis}
          periodoInicial={periodoFiltro}
          alunoInicial={alunoFiltroId}
          onClose={() => setModalManualAberto(false)}
          onSuccess={onManualSave}
        />
      )}
    </div>
  );
}
