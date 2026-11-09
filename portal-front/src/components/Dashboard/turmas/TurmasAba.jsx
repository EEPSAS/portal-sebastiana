import { useEffect, useMemo, useRef, useState } from "react";
import ModalDetalhesAluno from "./ModalDetalhesAluno";
import ModalCriarNotificacao from "./ModalCriarNotificacao";

/**
 * Paleta de cores semânticas para os indicadores circulares de turmas.
 * Cria identidade visual e contraste suave em cada card slim da lista.
 */
const CORES_PONTOS_TURMA = [
  "#10b981", // Verde esmeralda (1º Ano)
  "#059669", // Verde petróleo (2º Ano)
  "#2563eb", // Azul royal (3º Ano / ADS)
  "#f59e0b", // Laranja âmbar (4º Ano)
  "#8b5cf6", // Roxo suave (5º Ano)
  "#06b6d4", // Ciano moderno
  "#ec4899", // Rosa vivo
];

/**
 * TurmasAba.jsx - Quadro de Turmas e Alunos Matriculados
 *
 * Papel Didático:
 * Apresenta a gestão de turmas dividida em duas colunas funcionais:
 * 1. Painel Esquerdo ("Turmas"):
 *    - Cabeçalho com botão "+ Nova" para criação ágil de turmas;
 *    - Campo de busca em tempo real com filtro por nome e turno;
 *    - Ações rápidas de "Marcar todas" e "Desmarcar";
 *    - Lista empilhada de cartões slim com checkbox visual e indicador colorido;
 *    - Permite marcar e desmarcar turmas individualmente (seleção múltipla);
 *    - Scroll vertical interno confinado que nunca transborda a viewport.
 *
 * 2. Painel Direito ("Alunos Matriculados"):
 *    - Quando nenhuma turma está selecionada: tabela aparece vazia;
 *    - Quando 1 turma está selecionada: exibe o rótulo de identificação padronizado
 *      de 'Notas e Diário' (Nome da Turma + Badge "Turma Selecionada" + Ciclo • Turno • Alunos);
 *    - Quando mais de 1 turma está selecionada: concatena o nome das turmas e exibe
 *      os alunos de todas as turmas selecionadas;
 *    - Seletor de quantidade de alunos por página (10, 25, 50 - padrão 25);
 *    - Paginação e scroll interno confinado com thead sticky, mantendo a página fixa.
 */
export default function TurmasAba({
  turmas = [],
  matriculas = [],
  podeGerenciar = false,
  podeCriarNotificacao = false,
  role = "",
  onCriarTurma,
  onEditarTurma,
  onVincularAluno,
  onImportarNotas,
  onExcluirTurma,
  onDesvincularAluno,
  onNotificacaoCriada,
  loading = false,
}) {
  // 1. Estados de busca e filtros locais
  const [termoBuscaTurma, setTermoBuscaTurma] = useState("");
  const [termoBuscaAluno, setTermoBuscaAluno] = useState("");
  const [filtroStatusAluno, setFiltroStatusAluno] = useState("todos");

  // 2. Estado para as turmas selecionadas (suporta marcar e desmarcar múltiplas turmas)
  // Inicialmente vazio: se nenhuma turma selecionada, a tabela aparece vazia.
  const [turmasSelecionadasIds, setTurmasSelecionadasIds] = useState([]);

  // 3. Estado de paginação e quantidade de itens por página (padrão 25)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(25);

  // 4. Estados para menus dropdown de ações
  const [menuAcoesTurmaAberto, setMenuAcoesTurmaAberto] = useState(false);
  const [menuAcoesAlunoAbertoId, setMenuAcoesAlunoAbertoId] = useState(null);

  // 5. Estados para modais de detalhes do aluno e de notificação
  const [matriculaModal, setMatriculaModal] = useState(null);
  const [matriculaParaNotificar, setMatriculaParaNotificar] = useState(null);

  const menuTurmaRef = useRef(null);

  // Garante que matriculas seja sempre um array iterável
  const matriculasArray = useMemo(() => {
    if (Array.isArray(matriculas)) return matriculas;
    if (Array.isArray(matriculas?.data)) return matriculas.data;
    return [];
  }, [matriculas]);

  // Contagem de matrículas ativas por turma_id para sincronia instantânea
  const contagemPorTurma = useMemo(() => {
    const mapa = {};
    turmas.forEach((t) => {
      const tid = t.id_turma ?? t.id;
      if (tid) mapa[tid] = 0;
    });
    matriculasArray.forEach((m) => {
      const turmaId = m.turma_id ?? m.turma?.id_turma;
      if (turmaId) {
        mapa[turmaId] = (mapa[turmaId] || 0) + 1;
      }
    });
    return mapa;
  }, [turmas, matriculasArray]);

  // Mapa rápido de id_turma -> nome da turma para exibir badge quando múltiplas turmas
  const mapaNomesTurmas = useMemo(() => {
    const mapa = {};
    turmas.forEach((t) => {
      const tid = String(t.id_turma ?? t.id);
      if (tid) mapa[tid] = t.nome_identificador || `Turma #${tid}`;
    });
    return mapa;
  }, [turmas]);

  // Turmas filtradas pelo campo de busca da coluna esquerda
  const turmasFiltradas = useMemo(() => {
    if (!termoBuscaTurma.trim()) return turmas;
    const termo = termoBuscaTurma.toLowerCase();
    return turmas.filter((t) => {
      const nome = String(t.nome_identificador || "").toLowerCase();
      const turno = String(t.turno || "").toLowerCase();
      const ciclo = String(t.ciclo_nome || "").toLowerCase();
      const ano = String(t.ano_letivo || "").toLowerCase();
      return (
        nome.includes(termo) ||
        turno.includes(termo) ||
        ciclo.includes(termo) ||
        ano.includes(termo)
      );
    });
  }, [turmas, termoBuscaTurma]);

  // Relação de objetos de turmas atualmente ativas/marcadas
  const turmasAtivas = useMemo(() => {
    if (turmasSelecionadasIds.length === 0) return [];
    return turmas.filter((t) =>
      turmasSelecionadasIds.includes(String(t.id_turma ?? t.id))
    );
  }, [turmas, turmasSelecionadasIds]);

  const isUmaTurma = turmasAtivas.length === 1;
  const isMultiplasTurmas = turmasAtivas.length > 1;
  const turmaUnica = isUmaTurma ? turmasAtivas[0] : null;

  // Handlers para marcar/desmarcar turmas
  const handleToggleTurma = (tId) => {
    setTurmasSelecionadasIds((prev) => {
      if (prev.includes(tId)) {
        return prev.filter((id) => id !== tId);
      }
      return [...prev, tId];
    });
    setPaginaAtual(1);
  };

  const handleMarcarTodas = () => {
    const todosIds = turmasFiltradas.map((t) => String(t.id_turma ?? t.id));
    setTurmasSelecionadasIds(todosIds);
    setPaginaAtual(1);
  };

  const handleDesmarcarTodas = () => {
    setTurmasSelecionadasIds([]);
    setPaginaAtual(1);
  };

  const handleBuscaAlunoChange = (valor) => {
    setTermoBuscaAluno(valor);
    setPaginaAtual(1);
  };

  const handleStatusAlunoChange = (valor) => {
    setFiltroStatusAluno(valor);
    setPaginaAtual(1);
  };

  // Fecha menus dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuTurmaRef.current && !menuTurmaRef.current.contains(e.target)) {
        setMenuAcoesTurmaAberto(false);
      }
      if (!e.target.closest(".turmas-dropdown-wrapper")) {
        setMenuAcoesAlunoAbertoId(null);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Alunos filtrados: se nenhuma turma selecionada, retorna vazio.
  const alunosFiltrados = useMemo(() => {
    if (turmasSelecionadasIds.length === 0) {
      return [];
    }

    let lista = matriculasArray.filter((m) => {
      const tId = String(m.turma_id ?? m.turma?.id_turma ?? "");
      return turmasSelecionadasIds.includes(tId);
    });

    // Filtro textual por nome ou matrícula
    if (termoBuscaAluno.trim()) {
      const termo = termoBuscaAluno.toLowerCase();
      lista = lista.filter((m) => {
        const nome = String(m.aluno?.name || m.name || "").toLowerCase();
        const email = String(m.aluno?.email || m.email || "").toLowerCase();
        const matId = String(m.id_matricula ?? m.id ?? "");
        return (
          nome.includes(termo) || email.includes(termo) || matId.includes(termo)
        );
      });
    }

    // Filtro por status
    if (filtroStatusAluno !== "todos") {
      lista = lista.filter((m) => {
        const status = String(m.status_matricula || "Ativo").toLowerCase();
        return status === filtroStatusAluno.toLowerCase();
      });
    }

    return lista;
  }, [matriculasArray, turmasSelecionadasIds, termoBuscaAluno, filtroStatusAluno]);

  // Paginação dos alunos conforme itensPorPagina configurável (10, 25, 50)
  const totalAlunosFiltrados = alunosFiltrados.length;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalAlunosFiltrados / itensPorPagina)
  );
  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const indiceInicio = (paginaValida - 1) * itensPorPagina;
  const indiceFim = Math.min(
    indiceInicio + itensPorPagina,
    totalAlunosFiltrados
  );
  const alunosPaginados = alunosFiltrados.slice(indiceInicio, indiceFim);

  // Formatação segura de datas DD/MM/AAAA
  const formatarData = (dataRaw) => {
    if (!dataRaw) return "—";
    try {
      const str = String(dataRaw);
      const dataIso = str.includes("T") ? str : `${str.slice(0, 10)}T00:00:00`;
      const d = new Date(dataIso);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString("pt-BR")
        : str.slice(0, 10);
    } catch {
      return String(dataRaw).slice(0, 10);
    }
  };

  // Turma do modal de detalhes do estudante
  const turmaDoAlunoModal = matriculaModal
    ? turmas.find(
        (t) =>
          String(t.id_turma ?? t.id) === String(matriculaModal.turma_id)
      ) || null
    : null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        ></div>
        <span className="text-muted small">Carregando quadro de turmas...</span>
      </div>
    );
  }

  // Dados para o cabeçalho concatenado de múltiplas turmas
  const nomesConcatenados = turmasAtivas.map((t) => t.nome_identificador).join(", ");
  const totalAlunosSomados = turmasAtivas.reduce((acc, t) => {
    const tid = t.id_turma ?? t.id;
    return acc + Number(contagemPorTurma[tid] ?? t.total_alunos ?? 0);
  }, 0);

  return (
    <div className="quadro-turmas-viewport-lock">
      <div className="row gx-3 gy-3 gy-lg-0 quadro-turmas-row">
        {/* =========================================================================
            COLUNA ESQUERDA: LISTA SLIM DE TURMAS (com marcar/desmarcar na viewport)
            ========================================================================= */}
        <div className="col-12 col-lg-4 col-xl-3 quadro-turmas-col-esquerda">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white quadro-turmas-card-esquerdo">
            {/* Topo do Painel de Turmas: Título e Botão "+ Nova" */}
            <div className="d-flex align-items-center justify-content-between mb-2 flex-shrink-0">
              <h5 className="fw-bolder mb-0 text-dark">Turmas</h5>
              {podeGerenciar && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-3 px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-xs"
                  onClick={onCriarTurma}
                  title="Cadastrar nova turma escolar"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nova</span>
                </button>
              )}
            </div>

            {/* Campo de Busca Rápida de Turma */}
            <div className="mb-2 flex-shrink-0">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-1"
                  placeholder="Buscar turma..."
                  value={termoBuscaTurma}
                  onChange={(e) => setTermoBuscaTurma(e.target.value)}
                  aria-label="Buscar turma por nome ou turno"
                />
              </div>
            </div>

            {/* Barra de Seleção Rápida: Marcar Todas e Desmarcar */}
            <div className="d-flex align-items-center justify-content-between px-1 mb-2 small text-muted flex-shrink-0">
              <span style={{ fontSize: "0.72rem" }}>
                <strong>{turmasSelecionadasIds.length}</strong> de{" "}
                {turmasFiltradas.length} marcadas
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small text-primary fw-semibold"
                  style={{ fontSize: "0.72rem" }}
                  onClick={handleMarcarTodas}
                  disabled={turmasFiltradas.length === 0}
                  title="Marcar todas as turmas filtradas"
                >
                  Marcar todas
                </button>
                <span className="text-secondary opacity-50">•</span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small text-secondary"
                  style={{ fontSize: "0.72rem" }}
                  onClick={handleDesmarcarTodas}
                  disabled={turmasSelecionadasIds.length === 0}
                  title="Desmarcar todas as turmas"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Lista Empilhada de Cartões Slim com Scroll Confinado */}
            <div
              className="quadro-turmas-lista-scroll d-flex flex-column gap-2"
              tabIndex={0}
              role="region"
              aria-label="Lista de turmas escolares para marcar e filtrar"
            >
              {turmasFiltradas.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-inbox fs-3 d-block mb-1 text-secondary opacity-50"></i>
                  Nenhuma turma encontrada.
                </div>
              ) : (
                turmasFiltradas.map((turma, index) => {
                  const tId = String(turma.id_turma ?? turma.id);
                  const isSelecionada = turmasSelecionadasIds.includes(tId);
                  const totalAlunos =
                    contagemPorTurma[tId] ?? turma.total_alunos ?? 0;
                  const corPonto =
                    CORES_PONTOS_TURMA[index % CORES_PONTOS_TURMA.length];

                  return (
                    <div
                      key={tId}
                      className={`turma-slim-card ${
                        isSelecionada ? "is-active" : ""
                      }`}
                      onClick={() => handleToggleTurma(tId)}
                      role="checkbox"
                      aria-checked={isSelecionada}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleTurma(tId);
                        }
                      }}
                      title={`${
                        isSelecionada ? "Desmarcar" : "Marcar"
                      } turma ${turma.nome_identificador}`}
                    >
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        {/* Checkbox visual integrado */}
                        <div className="turma-slim-checkbox flex-shrink-0">
                          {isSelecionada ? (
                            <i className="bi bi-check-square-fill text-primary fs-6"></i>
                          ) : (
                            <i className="bi bi-square text-secondary fs-6 opacity-60"></i>
                          )}
                        </div>

                        <span
                          className="turma-slim-dot"
                          style={{ backgroundColor: corPonto }}
                        ></span>

                        <div className="text-truncate">
                          <div className="turma-slim-title text-truncate">
                            {turma.nome_identificador}
                          </div>
                          <div className="turma-slim-subtitle text-truncate">
                            {totalAlunos}{" "}
                            {totalAlunos === 1 ? "aluno" : "alunos"} •{" "}
                            {turma.turno || "Integral"}
                          </div>
                        </div>
                      </div>

                      <i
                        className={`bi bi-chevron-right turma-slim-chevron ${
                          isSelecionada
                            ? "text-primary fw-bold"
                            : "text-muted"
                        }`}
                      ></i>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUNA DIREITA: TABELA DE ALUNOS CONFORME AS TURMAS MARCADAS
            ========================================================================= */}
        <div className="col-12 col-lg-8 col-xl-9 quadro-turmas-col-direita">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white quadro-turmas-card-direito">
            {/* Cabeçalho de Identificação com Rótulo Dinâmico no Padrão de 'Notas e Diário' */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom flex-shrink-0">
              <div className="min-w-0">
                {turmasAtivas.length === 0 ? (
                  // Caso 1: Nenhuma turma selecionada
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-secondary-subtle text-secondary shadow-sm flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    >
                      <i className="bi bi-mortarboard fs-5"></i>
                    </div>
                    <div>
                      <h5 className="fw-bolder mb-0 text-dark">
                        Nenhuma Turma Selecionada
                      </h5>
                      <div className="small text-muted fw-medium mt-0.5">
                        Marque uma ou mais turmas à esquerda para visualizar seus estudantes.
                      </div>
                    </div>
                  </div>
                ) : isUmaTurma ? (
                  // Caso 2: Exatamente 1 turma selecionada (rótulo idêntico ao de 'Notas e Diário')
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white shadow-sm flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    >
                      <i className="bi bi-mortarboard-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h5 className="fw-bolder mb-0 text-primary">
                          {turmaUnica.nome_identificador}
                        </h5>
                        <span
                          className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-semibold"
                          style={{ fontSize: "0.72rem" }}
                        >
                          Turma Selecionada
                        </span>
                      </div>
                      <div className="small text-secondary fw-medium mt-0.5">
                        {turmaUnica.ciclo_nome || "Regular"} •{" "}
                        {turmaUnica.turno || "Integral"} •{" "}
                        {contagemPorTurma[turmaUnica.id_turma ?? turmaUnica.id] ??
                          turmaUnica.total_alunos ??
                          0}{" "}
                        {Number(
                          contagemPorTurma[
                            turmaUnica.id_turma ?? turmaUnica.id
                          ] ??
                            turmaUnica.total_alunos ??
                            0
                        ) === 1
                          ? "aluno"
                          : "alunos"}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Caso 3: Múltiplas turmas selecionadas (rótulo concatenado)
                  <div className="d-flex align-items-center gap-2.5 min-w-0">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white shadow-sm flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    >
                      <i className="bi bi-mortarboard-fill fs-5"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <h5
                          className="fw-bolder mb-0 text-primary text-truncate"
                          title={nomesConcatenados}
                        >
                          {nomesConcatenados}
                        </h5>
                        <span
                          className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-semibold"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {turmasAtivas.length} Turmas Selecionadas
                        </span>
                      </div>
                      <div className="small text-secondary fw-medium mt-0.5">
                        {totalAlunosSomados}{" "}
                        {totalAlunosSomados === 1 ? "aluno" : "alunos"} no
                        total consolidado
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação Contextuais */}
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark rounded-3 px-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                  onClick={() =>
                    onImportarNotas && onImportarNotas(turmaUnica || turmasAtivas[0])
                  }
                  disabled={!isUmaTurma}
                  title={
                    isUmaTurma
                      ? `Importar notas CSV para ${turmaUnica.nome_identificador}`
                      : "Selecione exatamente uma turma para importar CSV"
                  }
                >
                  <i className="bi bi-file-earmark-arrow-up text-primary"></i>
                  <span>Notas (CSV)</span>
                </button>

                {podeGerenciar && isUmaTurma && (
                  <div className="turmas-dropdown-wrapper" ref={menuTurmaRef}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-3 px-3 fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                      onClick={() =>
                        setMenuAcoesTurmaAberto(!menuAcoesTurmaAberto)
                      }
                      aria-expanded={menuAcoesTurmaAberto}
                      title="Opções de gerenciamento da turma selecionada"
                    >
                      <span>Ações</span>
                      <i className="bi bi-chevron-down small"></i>
                    </button>

                    {menuAcoesTurmaAberto && (
                      <div className="turmas-dropdown-menu">
                        <button
                          type="button"
                          className="turmas-dropdown-item"
                          onClick={() => {
                            setMenuAcoesTurmaAberto(false);
                            onVincularAluno(turmaUnica);
                          }}
                        >
                          <i className="bi bi-person-check-fill text-primary"></i>
                          <span>Confirmar Alunos</span>
                        </button>
                        <button
                          type="button"
                          className="turmas-dropdown-item"
                          onClick={() => {
                            setMenuAcoesTurmaAberto(false);
                            onEditarTurma(turmaUnica);
                          }}
                        >
                          <i className="bi bi-pencil text-secondary"></i>
                          <span>Editar Turma</span>
                        </button>
                        <hr className="my-1 border-secondary-subtle" />
                        <button
                          type="button"
                          className="turmas-dropdown-item turmas-dropdown-item--danger"
                          onClick={() => {
                            setMenuAcoesTurmaAberto(false);
                            onExcluirTurma(turmaUnica);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                          <span>Excluir Turma</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Busca de Alunos e Filtro de Status */}
            <div className="row g-2 mb-2 align-items-center flex-shrink-0">
              <div className="col-12 col-sm-8 col-md-9">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-1"
                    placeholder="Buscar aluno por nome ou matricula..."
                    value={termoBuscaAluno}
                    onChange={(e) => handleBuscaAlunoChange(e.target.value)}
                    disabled={turmasSelecionadasIds.length === 0}
                    aria-label="Buscar aluno por nome ou matrícula"
                  />
                </div>
              </div>

              <div className="col-12 col-sm-4 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-funnel"></i>
                  </span>
                  <select
                    className="form-select border-start-0 ps-1"
                    value={filtroStatusAluno}
                    onChange={(e) => handleStatusAlunoChange(e.target.value)}
                    disabled={turmasSelecionadasIds.length === 0}
                    aria-label="Filtrar por status da matrícula"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="ativo">Ativo</option>
                    <option value="evadido">Evadido</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela de Alunos com Rolagem Interna e thead Sticky */}
            <div
              className="quadro-alunos-tabela-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabela de alunos matriculados"
            >
              <table
                className="table table-hover align-middle mb-0"
                style={{ fontSize: "0.88rem" }}
              >
                <thead className="table-light text-muted small fw-bold">
                  <tr>
                    <th className="ps-3 py-2" style={{ width: "12%" }}>
                      Nº
                    </th>
                    <th className="py-2" style={{ width: "42%" }}>
                      ESTUDANTE
                    </th>
                    <th className="py-2 text-center" style={{ width: "20%" }}>
                      DATA DE MATRÍCULA
                    </th>
                    <th className="py-2 text-center" style={{ width: "14%" }}>
                      STATUS
                    </th>
                    <th className="pe-3 py-2 text-end" style={{ width: "12%" }}>
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {turmasSelecionadasIds.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        Nenhuma turma selecionada. Clique em uma ou mais turmas
                        na coluna ao lado para exibir seus alunos.
                      </td>
                    </tr>
                  ) : alunosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="bi bi-people fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        {termoBuscaAluno || filtroStatusAluno !== "todos"
                          ? "Nenhum aluno encontrado para os filtros selecionados."
                          : "Nenhum aluno matriculado na(s) turma(s) selecionada(s)."}
                      </td>
                    </tr>
                  ) : (
                    alunosPaginados.map((mat, idx) => {
                      const matId = mat.id_matricula ?? mat.id;
                      const alunoNome = mat.aluno?.name || mat.name || "Estudante";
                      const alunoEmail = mat.aluno?.email || mat.email || "";
                      const turmaDoAlunoId = String(
                        mat.turma_id ?? mat.turma?.id_turma ?? ""
                      );
                      const turmaDoAlunoNome =
                        mat.turma?.nome_identificador ||
                        mat.turma_nome ||
                        mapaNomesTurmas[turmaDoAlunoId] ||
                        "";
                      const dataFormatada = formatarData(
                        mat.data_matricula || mat.created_at
                      );
                      const isAtivo =
                        (mat.status_matricula || "Ativo").toLowerCase() ===
                        "ativo";
                      const menuAberto = menuAcoesAlunoAbertoId === matId;

                      return (
                        <tr key={matId ?? `mat-${idx}`}>
                          {/* Nº de Matrícula */}
                          <td className="ps-3">
                            <span className="matricula-num-badge">
                              #{String(matId).padStart(4, "0")}
                            </span>
                          </td>

                          {/* Estudante (Avatar + Nome + Email + Badge Institucional) */}
                          <td>
                            <div
                              className="d-flex align-items-center gap-2.5 aluno-clickable-row"
                              onClick={() => setMatriculaModal(mat)}
                              title="Clique para ver a ficha completa deste estudante"
                            >
                              <div className="aluno-avatar-circle">
                                {(alunoNome || "A").charAt(0).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <strong className="d-block text-dark small aluno-nome-destaque text-truncate">
                                    {alunoNome}
                                  </strong>
                                  {isMultiplasTurmas && turmaDoAlunoNome && (
                                    <span
                                      className="badge bg-primary-subtle text-primary border border-primary-subtle py-0.5 px-1.5 fw-semibold"
                                      style={{ fontSize: "0.66rem" }}
                                    >
                                      {turmaDoAlunoNome}
                                    </span>
                                  )}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <small
                                    className="text-muted text-truncate"
                                    style={{ fontSize: "0.74rem" }}
                                  >
                                    {alunoEmail}
                                  </small>
                                  <span
                                    className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1 flex-shrink-0"
                                    style={{ fontSize: "0.62rem" }}
                                  >
                                    <i
                                      className="bi bi-google text-primary"
                                      style={{ fontSize: "0.6rem" }}
                                    ></i>
                                    Institucional
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Data de Matrícula */}
                          <td className="text-center text-muted small">
                            {dataFormatada}
                          </td>

                          {/* Status */}
                          <td className="text-center">
                            <span
                              className={`badge rounded-pill px-2.5 py-1 small fw-semibold ${
                                isAtivo
                                  ? "bg-success-subtle text-success border border-success-subtle"
                                  : "bg-secondary-subtle text-secondary border"
                              }`}
                            >
                              {mat.status_matricula || "Ativo"}
                            </span>
                          </td>

                          {/* Ações (Sino + Menu 3 Pontinhos) */}
                          <td className="pe-3 text-end">
                            <div className="d-inline-flex align-items-center gap-1.5">
                              {podeCriarNotificacao && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary border-0 rounded-circle p-1.5"
                                  title={`Criar notificação para ${alunoNome}`}
                                  onClick={() => setMatriculaParaNotificar(mat)}
                                  aria-label={`Criar notificação para ${alunoNome}`}
                                >
                                  <i className="bi bi-bell fs-6"></i>
                                </button>
                              )}

                              <div className="turmas-dropdown-wrapper">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary border-0 rounded-circle p-1.5"
                                  title="Mais opções do estudante"
                                  aria-label="Mais opções do estudante"
                                  onClick={() =>
                                    setMenuAcoesAlunoAbertoId(
                                      menuAberto ? null : matId
                                    )
                                  }
                                >
                                  <i className="bi bi-three-dots-vertical fs-6"></i>
                                </button>

                                {menuAberto && (
                                  <div className="turmas-dropdown-menu">
                                    <button
                                      type="button"
                                      className="turmas-dropdown-item"
                                      onClick={() => {
                                        setMenuAcoesAlunoAbertoId(null);
                                        setMatriculaModal(mat);
                                      }}
                                    >
                                      <i className="bi bi-person-vcard text-primary"></i>
                                      <span>Ver Ficha Cadastral</span>
                                    </button>
                                    {podeGerenciar && (
                                      <>
                                        <hr className="my-1 border-secondary-subtle" />
                                        <button
                                          type="button"
                                          className="turmas-dropdown-item turmas-dropdown-item--danger"
                                          onClick={() => {
                                            setMenuAcoesAlunoAbertoId(null);
                                            onDesvincularAluno(mat);
                                          }}
                                        >
                                          <i className="bi bi-person-dash"></i>
                                          <span>Desvincular Aluno</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Tabela: Contagem, Seletor de Itens por Página e Paginação */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 mt-auto border-top flex-shrink-0">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="small text-muted">
                  Mostrando{" "}
                  <strong>
                    {totalAlunosFiltrados > 0 ? indiceInicio + 1 : 0}
                  </strong>
                  -<strong>{indiceFim}</strong> de{" "}
                  <strong>{totalAlunosFiltrados}</strong> alunos
                </span>

                {/* Seletor configurável de itens por página: 10, 25 (padrão) e 50 */}
                <div className="d-inline-flex align-items-center gap-1.5">
                  <label
                    htmlFor="select-itens-por-pagina"
                    className="small text-muted mb-0"
                    style={{ fontSize: "0.76rem" }}
                  >
                    Exibir:
                  </label>
                  <select
                    id="select-itens-por-pagina"
                    className="form-select form-select-sm py-0 px-2 border-secondary-subtle fw-semibold"
                    style={{ width: "auto", fontSize: "0.78rem", height: "26px" }}
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value));
                      setPaginaAtual(1);
                    }}
                    aria-label="Quantidade de alunos exibidos por página"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                </div>
              </div>

              {totalPaginas > 1 && (
                <div
                  className="btn-group btn-group-sm"
                  role="group"
                  aria-label="Paginação de alunos"
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-2 py-0.5"
                    disabled={paginaValida <= 1}
                    onClick={() =>
                      setPaginaAtual((p) => Math.max(1, p - 1))
                    }
                    title="Página anterior"
                  >
                    <i className="bi bi-chevron-left small"></i>
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                    (num) => (
                      <button
                        key={num}
                        type="button"
                        className={`btn btn-sm px-2.5 py-0.5 fw-semibold ${
                          num === paginaValida
                            ? "btn-primary text-white"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setPaginaAtual(num)}
                      >
                        {num}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary px-2 py-0.5"
                    disabled={paginaValida >= totalPaginas}
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    title="Próxima página"
                  >
                    <i className="bi bi-chevron-right small"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modais de Ficha do Estudante e Notificação */}
      {matriculaModal && (
        <ModalDetalhesAluno
          matricula={matriculaModal}
          turmaInfo={turmaDoAlunoModal}
          onClose={() => setMatriculaModal(null)}
        />
      )}

      {matriculaParaNotificar && (
        <ModalCriarNotificacao
          matricula={matriculaParaNotificar}
          matriculas={matriculasArray}
          turmas={turmas}
          role={role}
          onClose={() => setMatriculaParaNotificar(null)}
          onCreated={() => {
            setMatriculaParaNotificar(null);
            onNotificacaoCriada?.();
          }}
        />
      )}
    </div>
  );
}
