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
 * Itens por página na relação de alunos matriculados para manter a tabela
 * perfeitamente enxuta e sem necessidade de barra de rolagem na página.
 */
const ALUNOS_POR_PAGINA = 8;

/**
 * TurmasAba.jsx - Quadro de Turmas e Alunos Matriculados
 *
 * Papel Didático:
 * Apresenta a gestão de turmas dividida em duas colunas funcionais:
 * 1. Painel Esquerdo ("Turmas"):
 *    - Cabeçalho com botão "+ Nova" para criação ágil de turmas;
 *    - Campo de busca em tempo real com filtro por nome e turno;
 *    - Lista empilhada de cartões slim com indicador colorido e contagem de alunos;
 *    - Scroll vertical interno confinado que nunca transborda a viewport.
 *
 * 2. Painel Direito ("Todos os Alunos Matriculados"):
 *    - Cabeçalho com identificação da turma selecionada e ações rápidas ("Notas CSV" e "Ações");
 *    - Barra de filtros com busca por nome/matrícula e filtro por status;
 *    - Tabela de alunos com avatar, email institucional, status e ações rápidas;
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

  // 2. Estado para a turma selecionada na lista esquerda
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");

  // 3. Estado de paginação da tabela de alunos
  const [paginaAtual, setPaginaAtual] = useState(1);

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

  // Objeto da turma atualmente selecionada (derivação pura sem setState em effect)
  const turmaAtiva = useMemo(() => {
    if (turmaSelecionadaId) {
      const encontrada = turmas.find(
        (t) => String(t.id_turma ?? t.id) === String(turmaSelecionadaId)
      );
      if (encontrada) return encontrada;
    }
    return turmas[0] || null;
  }, [turmas, turmaSelecionadaId]);

  // Handlers que combinam alteração de filtros com reset de paginação (padrão React 19)
  const handleSelecionarTurma = (tId) => {
    setTurmaSelecionadaId(tId);
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

  // Alunos filtrados pela turma ativa, termo de busca e status
  const alunosFiltrados = useMemo(() => {
    let lista = matriculasArray;

    // Filtra pela turma selecionada
    if (turmaAtiva) {
      const idAlvo = String(turmaAtiva.id_turma ?? turmaAtiva.id);
      lista = lista.filter((m) => {
        const tId = String(m.turma_id ?? m.turma?.id_turma ?? "");
        return tId === idAlvo;
      });
    }

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
  }, [matriculasArray, turmaAtiva, termoBuscaAluno, filtroStatusAluno]);

  // Paginação dos alunos
  const totalAlunosFiltrados = alunosFiltrados.length;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalAlunosFiltrados / ALUNOS_POR_PAGINA)
  );
  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const indiceInicio = (paginaValida - 1) * ALUNOS_POR_PAGINA;
  const indiceFim = Math.min(
    indiceInicio + ALUNOS_POR_PAGINA,
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

  return (
    <div className="quadro-turmas-viewport-lock">
      <div className="row gx-3 gy-3 gy-lg-0 quadro-turmas-row">
        {/* =========================================================================
            COLUNA ESQUERDA: LISTA SLIM DE TURMAS (com scroll interno na viewport)
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

            {/* Lista Empilhada de Cartões Slim com Scroll Confinado */}
            <div
              className="quadro-turmas-lista-scroll d-flex flex-column gap-2"
              tabIndex={0}
              role="region"
              aria-label="Lista de turmas escolares"
            >
              {turmasFiltradas.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-inbox fs-3 d-block mb-1 text-secondary opacity-50"></i>
                  Nenhuma turma encontrada.
                </div>
              ) : (
                turmasFiltradas.map((turma, index) => {
                  const tId = String(turma.id_turma ?? turma.id);
                  const isSelecionada = String(turmaAtiva?.id_turma ?? turmaAtiva?.id) === tId;
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
                      onClick={() => handleSelecionarTurma(tId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelecionarTurma(tId);
                        }
                      }}
                      aria-pressed={isSelecionada}
                      title={`Selecionar turma ${turma.nome_identificador}`}
                    >
                      <div className="d-flex align-items-center gap-2.5 min-w-0">
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
            COLUNA DIREITA: TABELA DE ALUNOS MATRICULADOS NA TURMA SELECIONADA
            ========================================================================= */}
        <div className="col-12 col-lg-8 col-xl-9 quadro-turmas-col-direita">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white quadro-turmas-card-direito">
            {/* Cabeçalho da Tabela com Nome da Turma e Ações no Topo Direito */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom flex-shrink-0">
              <div>
                <h5 className="fw-bolder mb-0 text-dark">
                  {turmaAtiva
                    ? "Todos os Alunos Matriculados"
                    : "Estudantes Matriculados"}
                </h5>
                <p className="text-muted small mb-0 mt-0.5">
                  {turmaAtiva
                    ? `Relação completa de estudantes da turma selecionada (${turmaAtiva.nome_identificador}).`
                    : "Selecione uma turma à esquerda para visualizar seus estudantes."}
                </p>
              </div>

              {/* Botões de Ação da Turma (Notas CSV e Dropdown Ações) */}
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark rounded-3 px-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                  onClick={() =>
                    onImportarNotas && onImportarNotas(turmaAtiva || turmas[0])
                  }
                  disabled={!turmaAtiva}
                  title="Importar diário de notas via CSV para a turma selecionada"
                >
                  <i className="bi bi-file-earmark-arrow-up text-primary"></i>
                  <span>Notas (CSV)</span>
                </button>

                {podeGerenciar && turmaAtiva && (
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
                            onVincularAluno(turmaAtiva);
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
                            onEditarTurma(turmaAtiva);
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
                            onExcluirTurma(turmaAtiva);
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
                  {alunosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="bi bi-people fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        {termoBuscaAluno || filtroStatusAluno !== "todos"
                          ? "Nenhum aluno encontrado para os filtros selecionados."
                          : "Nenhum aluno matriculado nesta turma."}
                      </td>
                    </tr>
                  ) : (
                    alunosPaginados.map((mat, idx) => {
                      const matId = mat.id_matricula ?? mat.id;
                      const alunoNome = mat.aluno?.name || mat.name || "Estudante";
                      const alunoEmail = mat.aluno?.email || mat.email || "";
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
                                <strong className="d-block text-dark small aluno-nome-destaque text-truncate">
                                  {alunoNome}
                                </strong>
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

            {/* Rodapé da Tabela: Contagem e Paginação */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 mt-auto border-top flex-shrink-0">
              <span className="small text-muted">
                Mostrando{" "}
                <strong>
                  {totalAlunosFiltrados > 0 ? indiceInicio + 1 : 0}
                </strong>
                -<strong>{indiceFim}</strong> de{" "}
                <strong>{totalAlunosFiltrados}</strong> alunos
              </span>

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
