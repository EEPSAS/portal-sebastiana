import { useMemo, useState } from "react";
import ModalDetalhesAluno from "./ModalDetalhesAluno";

/**
 * Aba Turmas: Apresenta o Quadro de Turmas e Alunos.
 *
 * Papel Didático:
 * - Permite filtrar turmas por Ano Letivo e Turno em tempo real;
 * - Apresenta cards ampliados com destaque temático e contagem proeminente de alunos;
 * - Ao clicar em um card de turma, filtra reativamente a relação nominal de alunos abaixo;
 * - Fornece opção clara para limpar o filtro de turma ou os filtros de ano/período;
 * - Ao clicar na matrícula ou no aluno, abre um modal com sua ficha cadastral completa.
 */
const TurmasAba = ({
  turmas = [],
  matriculas = [],
  podeGerenciar = false,
  onCriarTurma,
  onEditarTurma,
  onVincularAluno,
  onExcluirTurma,
  onDesvincularAluno,
  loading = false,
}) => {
  // 1. Estados locais para filtros superiores de ano letivo e turno
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // 2. Estado para a turma selecionada via clique no card (filtra a tabela de alunos)
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);

  // 3. Estado para controlar qual aluno/matrícula está aberto no modal de detalhes
  const [matriculaModal, setMatriculaModal] = useState(null);

  // Garante que matriculas seja sempre um array iterável mesmo em caso de envelope
  const matriculasArray = useMemo(() => {
    if (Array.isArray(matriculas)) return matriculas;
    if (Array.isArray(matriculas?.data)) return matriculas.data;
    return [];
  }, [matriculas]);

  // Mapa didático com a contagem de matrículas ativas por turma_id
  const contagemPorTurma = useMemo(() => {
    const mapa = {};
    // Inicializa todas as turmas cadastradas com zero para que turmas sem alunos ativos não usem fallback desatualizado
    turmas.forEach((t) => {
      const tid = t.id_turma ?? t.id;
      if (tid) {
        mapa[tid] = 0;
      }
    });

    matriculasArray.forEach((m) => {
      const turmaId = m.turma_id ?? m.turma?.id_turma;
      if (turmaId) {
        mapa[turmaId] = (mapa[turmaId] || 0) + 1;
      }
    });
    return mapa;
  }, [turmas, matriculasArray]);

  // Lista ordenada de anos letivos únicos presentes nas turmas cadastradas
  const anosDisponiveis = useMemo(() => {
    const anos = turmas
      .map((t) => t.ano_letivo)
      .filter((ano) => Boolean(ano));
    return [...new Set(anos)].sort((a, b) => b - a);
  }, [turmas]);

  // Lista de turnos disponíveis no sistema escolar
  const turnosDisponiveis = useMemo(() => {
    const turnosEncontrados = turmas
      .map((t) => t.turno)
      .filter((turno) => Boolean(turno));
    const conjunto = new Set(["Matutino", "Vespertino", "Noturno", ...turnosEncontrados]);
    return Array.from(conjunto);
  }, [turmas]);

  // Filtragem reativa das turmas pelos seletores superiores
  const turmasFiltradas = useMemo(() => {
    return turmas.filter((t) => {
      const atendeAno = filtroAno ? String(t.ano_letivo) === String(filtroAno) : true;
      const atendeTurno = filtroTurno ? String(t.turno).toLowerCase() === String(filtroTurno).toLowerCase() : true;
      return atendeAno && atendeTurno;
    });
  }, [turmas, filtroAno, filtroTurno]);

  // Filtragem reativa dos alunos matriculados:
  // Se uma turma estiver selecionada no card, exibe apenas os alunos dela.
  const matriculasExibidas = useMemo(() => {
    if (!turmaSelecionada) return matriculasArray;
    const alvoId = String(turmaSelecionada.id_turma ?? turmaSelecionada.id);
    return matriculasArray.filter((m) => {
      const turmaId = String(m.turma_id ?? m.turma?.id_turma ?? "");
      return turmaId === alvoId;
    });
  }, [matriculasArray, turmaSelecionada]);

  // Alterna a seleção da turma clicada no card (toggle simples)
  const handleSelecionarTurma = (turma) => {
    if (turmaSelecionada?.id_turma === turma.id_turma) {
      setTurmaSelecionada(null); // Desmarca se já estiver selecionada
    } else {
      setTurmaSelecionada(turma);
    }
  };

  // Limpa o filtro de turma selecionada
  const handleLimparFiltroTurma = () => {
    setTurmaSelecionada(null);
  };

  // Limpa os filtros superiores de ano letivo e turno
  const handleLimparFiltrosSuperiores = () => {
    setFiltroAno("");
    setFiltroTurno("");
  };

  // Encontra os metadados da turma vinculada ao aluno exibido no modal
  const turmaDoAlunoModal = useMemo(() => {
    if (!matriculaModal) return null;
    return turmas.find((t) => t.id_turma === matriculaModal.turma_id) || null;
  }, [matriculaModal, turmas]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span className="text-muted small">Carregando turmas e matrículas...</span>
      </div>
    );
  }

  const temFiltroSuperiorAtivo = Boolean(filtroAno || filtroTurno);

  return (
    <div>
      {/* 1. Cabeçalho da Seção com Ação de Nova Turma */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-5">Quadro de Turmas</h4>
          <p className="text-muted mb-0 small">
            Gerenciamento de turmas, edição cadastral e vinculação de estudantes.
          </p>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-sm turmas-btn-primario px-3 py-2 rounded-pill d-flex align-items-center gap-2"
            onClick={onCriarTurma}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Nova Turma</span>
          </button>
        )}
      </div>

      {/* 2. Barra de Filtros de Ano Letivo e Período/Turno */}
      <div className="turmas-filtro-box p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-auto d-flex align-items-center gap-2 text-muted small fw-semibold">
            <i className="bi bi-funnel text-primary"></i>
            <span>Filtrar turmas por:</span>
          </div>

          {/* Filtro de Ano Letivo */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-calendar3"></i>
              </span>
              <select
                className="form-select turmas-filtro-select border-start-0"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                aria-label="Filtrar por Ano Letivo"
              >
                <option value="">Todos os Anos</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    Ano {ano}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro de Período / Turno */}
          <div className="col-12 col-sm-6 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-sun"></i>
              </span>
              <select
                className="form-select turmas-filtro-select border-start-0"
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
                aria-label="Filtrar por Turno"
              >
                <option value="">Todos os Turnos</option>
                {turnosDisponiveis.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contagem e Botão de Limpar Filtros Superiores */}
          <div className="col-12 col-md d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <span className="badge bg-light text-dark border px-3 py-2 small">
              Exibindo <strong>{turmasFiltradas.length}</strong> de {turmas.length} turmas
            </span>

            {temFiltroSuperiorAtivo && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                onClick={handleLimparFiltrosSuperiores}
                title="Limpar filtros de ano e turno"
              >
                <i className="bi bi-x-circle"></i>
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grid de Cards Ampliados de Cada Turma */}
      {turmasFiltradas.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-light mb-5">
          <i className="bi bi-collection fs-1 text-muted d-block mb-2"></i>
          <h6 className="fw-bold text-dark mb-1">
            {turmas.length === 0 ? "Nenhuma turma cadastrada" : "Nenhuma turma corresponde aos filtros"}
          </h6>
          <p className="text-muted small mb-3">
            {turmas.length === 0
              ? "Comece cadastrando a primeira turma escolar para matricular estudantes e lançar notas."
              : "Tente redefinir os filtros de ano letivo ou turno para visualizar as turmas."}
          </p>

          {temFiltroSuperiorAtivo ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-4 rounded-pill"
              onClick={handleLimparFiltrosSuperiores}
            >
              Limpar Filtros de Pesquisa
            </button>
          ) : (
            podeGerenciar && (
              <button
                type="button"
                className="btn btn-sm turmas-btn-primario px-4 rounded-pill"
                onClick={onCriarTurma}
              >
                Cadastrar Primeira Turma
              </button>
            )
          )}
        </div>
      ) : (
        <div className="row g-4 mb-5">
          {turmasFiltradas.map((turma) => {
            const totalAlunos = contagemPorTurma[turma.id_turma] ?? turma.total_alunos ?? 0;
            const isAtiva = (turma.status || "Ativa").toLowerCase() === "ativa";
            const isSelecionada = turmaSelecionada?.id_turma === turma.id_turma;

            return (
              <div key={turma.id_turma} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`turma-card h-100 d-flex flex-column justify-content-between ${
                    isSelecionada ? "is-selected" : ""
                  }`}
                  onClick={() => handleSelecionarTurma(turma)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelecionarTurma(turma);
                    }
                  }}
                  aria-pressed={isSelecionada}
                  title="Clique para filtrar os alunos desta turma na tabela abaixo"
                >
                  {/* Faixa decorativa superior com degradê temático */}
                  <div className="turma-card-top-stripe"></div>

                  <div className="p-4 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      {/* Topo do Card: Nome da Turma e Badge de Status */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h5 className="fw-bold text-dark mb-0 fs-5 text-truncate" title={turma.nome_identificador}>
                          {turma.nome_identificador}
                        </h5>
                        <span
                          className={`badge rounded-pill small flex-shrink-0 ${
                            isAtiva
                              ? "bg-success-subtle text-success border border-success-subtle"
                              : "bg-secondary-subtle text-secondary border"
                          }`}
                        >
                          {turma.status || "Ativa"}
                        </span>
                      </div>

                      {/* Subtítulo limpo e agradável: Ano Letivo e Turno */}
                      <p className="text-muted small mb-3">
                        <i className="bi bi-calendar3 me-1 text-primary"></i>
                        Ano Letivo {turma.ano_letivo} • <i className="bi bi-sun me-1 text-warning"></i>Turno {turma.turno}
                      </p>

                      {/* Bloco Métrico de Alunos Ampliado e com Destaque Visual */}
                      <div className="turma-card-metric p-3 mb-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "44px",
                              height: "44px",
                              backgroundColor: isSelecionada ? "#fce7f3" : "#e0f2fe",
                              color: isSelecionada ? "#e6007e" : "#0284c7",
                            }}
                          >
                            <i className="bi bi-people-fill fs-5"></i>
                          </span>
                          <div>
                            <span className="d-block fw-bold fs-4 text-dark lh-1">
                              {totalAlunos}
                            </span>
                            <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                              {totalAlunos === 1 ? "Aluno Matriculado" : "Alunos Matriculados"}
                            </small>
                          </div>
                        </div>

                        {/* Indicação visual de seleção para filtragem da tabela */}
                        <div>
                          {isSelecionada ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small">
                              <i className="bi bi-funnel-fill me-1"></i>
                              Ativo
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border px-2 py-1 small">
                              <i className="bi bi-filter me-1"></i>
                              Filtrar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações Administrativas do Card */}
                    <div
                      className="d-flex align-items-center justify-content-between pt-3 border-top mt-2"
                      onClick={(e) => e.stopPropagation()} // Impede que o clique nos botões ative ou desative o filtro do card
                    >
                      {podeGerenciar ? (
                        <>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark rounded-pill fw-semibold px-3 py-1 d-flex align-items-center gap-1"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => onVincularAluno(turma)}
                              title="Confirmar matrículas de alunos integrados via Google Workspace"
                            >
                              <i className="bi bi-person-check-fill text-primary"></i>
                              <span>Confirmar Alunos</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-secondary"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => onEditarTurma(turma)}
                              title="Editar informações da turma"
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Editar
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                            onClick={() => onExcluirTurma(turma)}
                            title="Excluir turma"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      ) : (
                        <div className="w-100 text-center">
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {isSelecionada ? "Clique novamente para exibir todos os alunos" : "Clique no card para filtrar alunos"}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Lista Nominal de Alunos Matriculados (Reativa ao Card Selecionado) */}
      <div className="turma-stat-card p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="fw-bold mb-0 text-dark fs-5">
                {turmaSelecionada
                  ? `Alunos da Turma: ${turmaSelecionada.nome_identificador}`
                  : "Todos os Alunos Matriculados"}
              </h4>

              {turmaSelecionada && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small">
                  <i className="bi bi-funnel-fill me-1"></i>
                  Filtrado por turma
                </span>
              )}
            </div>

            <p className="text-muted mb-0 small mt-1">
              {turmaSelecionada
                ? `Exibindo ${matriculasExibidas.length} estudante(s) matriculado(s) nesta turma.`
                : `Relação completa de estudantes com matrícula confirmada na escola (${matriculasArray.length} matriculados). Clique em um card acima para filtrar.`}
            </p>
          </div>

          {/* Botão de Limpar Filtro de Turma */}
          {turmaSelecionada && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-2"
              onClick={handleLimparFiltroTurma}
              title="Remover filtro de turma e ver todos os alunos"
            >
              <i className="bi bi-x-circle"></i>
              <span>Exibir todos os alunos</span>
            </button>
          )}
        </div>

        {matriculasExibidas.length === 0 ? (
          <div className="text-center py-5 border rounded-3 bg-light">
            <i className="bi bi-people fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark mb-1">
              {turmaSelecionada
                ? "Nenhum aluno matriculado nesta turma"
                : "Nenhum aluno matriculado na escola"}
            </h6>
            <p className="text-muted small mb-3">
              {turmaSelecionada
                ? "Utilize a ação 'Confirmar Alunos' no card acima para homologar estudantes nesta turma."
                : "Nenhum vínculo de matrícula foi encontrado no diário escolar."}
            </p>

            {turmaSelecionada && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3 py-1 rounded-pill"
                onClick={handleLimparFiltroTurma}
              >
                Voltar e ver todos os alunos
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-muted text-uppercase" style={{ fontSize: "0.75rem" }}>
                  <th scope="col" style={{ width: "16%" }}>Nº Matrícula</th>
                  <th scope="col" style={{ width: "36%" }}>Estudante</th>
                  <th scope="col">Turma Vinculada</th>
                  <th scope="col" className="text-center">Data de Matrícula</th>
                  <th scope="col" className="text-center">Status</th>
                  {podeGerenciar && <th scope="col" className="text-end">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {matriculasExibidas.map((mat, index) => {
                  const matId = mat.id_matricula ?? mat.id;
                  const alunoNome = mat.aluno?.name || mat.name || "Estudante";
                  const alunoEmail = mat.aluno?.email || mat.email || "";
                  const turmaNome = mat.turma?.nome_identificador || mat.turma_nome || (mat.turma_id ? `Turma #${mat.turma_id}` : "Turma");

                  const dataRaw = mat.data_matricula || mat.created_at;
                  let dataFormatada = "—";
                  if (dataRaw) {
                    try {
                      const str = String(dataRaw);
                      const dataIso = str.includes("T") ? str : `${str.slice(0, 10)}T00:00:00`;
                      const d = new Date(dataIso);
                      dataFormatada = !isNaN(d.getTime()) ? d.toLocaleDateString("pt-BR") : str.slice(0, 10);
                    } catch {
                      dataFormatada = String(dataRaw).slice(0, 10);
                    }
                  }

                  return (
                    <tr key={matId ?? `mat-${index}`}>
                      {/* 1. Código da Matrícula Clicável */}
                      <td>
                        <button
                          type="button"
                          className="matricula-badge-btn"
                          onClick={() => setMatriculaModal(mat)}
                          title="Clique para ver a ficha completa deste estudante"
                        >
                          <i className="bi bi-person-badge text-primary"></i>
                          <span>#{String(matId).padStart(4, "0")}</span>
                        </button>
                      </td>

                      {/* 2. Informações do Estudante (Nome e Avatar Clicáveis) */}
                      <td>
                        <div
                          className="d-flex align-items-center gap-3 aluno-clickable-row"
                          onClick={() => setMatriculaModal(mat)}
                          title="Clique para visualizar os detalhes deste estudante"
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{
                              width: "36px",
                              height: "36px",
                              backgroundColor: "var(--dashboard-pink-soft)",
                              color: "var(--dashboard-pink)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {(alunoNome || "A").charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <strong className="d-block text-dark small aluno-nome-destaque text-truncate">
                              {alunoNome}
                            </strong>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
                                {alunoEmail}
                              </small>
                              <span
                                className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1 flex-shrink-0"
                                style={{ fontSize: "0.62rem" }}
                              >
                                <i className="bi bi-google text-primary" style={{ fontSize: "0.6rem" }}></i>
                                Institucional
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Turma Vinculada */}
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {turmaNome}
                        </span>
                      </td>

                      {/* 4. Data de Matrícula */}
                      <td className="text-center">
                        <small className="text-secondary fw-semibold">{dataFormatada}</small>
                      </td>

                      {/* 5. Status da Matrícula */}
                      <td className="text-center">
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                          {mat.status_matricula || "Ativo"}
                        </span>
                      </td>

                      {/* 6. Ações de Gestão */}
                      {podeGerenciar && (
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-3 rounded-pill small"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => onDesvincularAluno(mat)}
                            title="Desvincular aluno da turma"
                          >
                            <i className="bi bi-person-dash me-1"></i>
                            Desvincular
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal de Ficha Cadastral do Aluno */}
      {matriculaModal && (
        <ModalDetalhesAluno
          matricula={matriculaModal}
          turmaInfo={turmaDoAlunoModal}
          onClose={() => setMatriculaModal(null)}
        />
      )}
    </div>
  );
};

export default TurmasAba;
