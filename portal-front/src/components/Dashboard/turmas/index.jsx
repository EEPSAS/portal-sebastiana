// Importação exclusiva dos hooks necessários (dispensa 'import React' no Vite)
import { useEffect, useMemo, useState } from "react";
import { fetchTurmas, fetchTurmaNotas, fetchTurmaResumo } from "../../../services/turmasService";
import ModalImportarNotas from "./ModalImportarNotas";

/**
 * Componente principal da área Turmas do Especialista Pedagógico e Professor.
 * Consome dados 100% reais do backend (turmas, KPIs e notas registradas)
 * e oferece a funcionalidade de upload e sincronização via arquivo CSV.
 */
const TurmaEspecialista = () => {
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  const [resumo, setResumo] = useState(null);
  const [notas, setNotas] = useState([]);

  // Estado inicial já é carregando (loading = true) para a primeira renderização
  const [loading, setLoading] = useState(true);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [erro, setErro] = useState("");
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  // Chave numérica para re-disparar a busca quando um CSV for importado
  const [recargaKey, setRecargaKey] = useState(0);

  /**
   * 1. Efeito de Montagem: Busca a lista de turmas da escola.
   * Didática: O array de dependências vazio `[]` garante que execute apenas uma vez.
   * Evita chamadas síncronas de setState antes das Promises para não causar cascading render.
   */
  useEffect(() => {
    let cancelado = false;

    fetchTurmas()
      .then((lista) => {
        if (!cancelado) {
          setTurmas(lista);
          if (lista.length > 0) {
            setLoadingDetalhes(true);
            setTurmaSelecionadaId(String(lista[0].id_turma));
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err.message || "Não foi possível carregar a lista de turmas.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Turma atualmente selecionada no seletor
  const turmaAtiva = useMemo(
    () => turmas.find((t) => String(t.id_turma) === String(turmaSelecionadaId)) || null,
    [turmas, turmaSelecionadaId]
  );

  /**
   * 2. Efeito de Sincronização: Busca resumo e notas da turma selecionada.
   * Executa sempre que `turmaSelecionadaId`, `periodoFiltro` ou `recargaKey` mudarem.
   */
  useEffect(() => {
    if (!turmaSelecionadaId) return;

    let cancelado = false;

    Promise.all([
      fetchTurmaResumo(turmaSelecionadaId, { periodo: periodoFiltro }).catch(() => null),
      fetchTurmaNotas(turmaSelecionadaId, { periodo: periodoFiltro }),
    ])
      .then(([dadosResumo, dadosNotas]) => {
        if (!cancelado) {
          setResumo(dadosResumo);
          setNotas(dadosNotas);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err.message || "Erro ao carregar notas da turma.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingDetalhes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [turmaSelecionadaId, periodoFiltro, recargaKey]);

  // Callback chamado quando a importação de CSV é concluída com sucesso
  const handleImportacaoSucesso = (resultado) => {
    setMensagemSucesso(resultado?.message || "Notas importadas e sincronizadas com sucesso!");
    setLoadingDetalhes(true);
    setRecargaKey((prev) => prev + 1);
    setTimeout(() => setMensagemSucesso(""), 6000);
  };

  // Atualização manual disparada pelo botão de refresh
  const handleRecarregar = () => {
    setLoadingDetalhes(true);
    setRecargaKey((prev) => prev + 1);
  };

  // Filtra as notas por busca de texto (aluno ou disciplina)
  const notasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return notas;

    return notas.filter((n) => {
      const alunoNome = (n.aluno?.name || "").toLowerCase();
      const discNome = (n.disciplina?.nome || "").toLowerCase();
      const periodo = (n.periodo_letivo || "").toLowerCase();
      return alunoNome.includes(termo) || discNome.includes(termo) || periodo.includes(termo);
    });
  }, [notas, termoBusca]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary me-3" role="status"></div>
        <span className="text-muted fw-semibold">Carregando turmas...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Cabeçalho da Seção com Seletor e Ação */}
      <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h2 className="fw-bold mb-1 text-dark" style={{ fontSize: "1.45rem" }}>
              Gestão de Turmas e Notas
            </h2>
            <p className="text-muted mb-0 small">
              Acompanhamento de aproveitamento acadêmico e importação de diários escolares via CSV.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Seletor de Turma */}
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="turma-seletor" className="small fw-bold text-muted text-nowrap">
                Turma:
              </label>
              <select
                id="turma-seletor"
                className="form-select form-select-sm fw-semibold"
                style={{ minWidth: "220px" }}
                value={turmaSelecionadaId}
                onChange={(e) => setTurmaSelecionadaId(e.target.value)}
              >
                {turmas.map((t) => (
                  <option key={t.id_turma} value={t.id_turma}>
                    {t.nome_identificador} ({t.turno})
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Atualização Manual */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleRecarregar}
              title="Recarregar dados da turma"
              disabled={loadingDetalhes}
            >
              <i className={`bi bi-arrow-clockwise ${loadingDetalhes ? "spinner-border spinner-border-sm" : ""}`}></i>
            </button>

            {/* Botão de Destaque: Cadastrar Notas (CSV) */}
            <button
              type="button"
              className="btn btn-sm btn-primary fw-bold px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
              onClick={() => setModalImportarAberto(true)}
              disabled={!turmaAtiva}
            >
              <i className="bi bi-file-earmark-arrow-up-fill"></i>
              Cadastrar Notas (CSV)
            </button>
          </div>
        </div>

        {/* Notificação de Sucesso */}
        {mensagemSucesso && (
          <div className="alert alert-success alert-dismissible fade show mt-3 mb-0 py-2 px-3 small" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            <strong>{mensagemSucesso}</strong>
            <button type="button" className="btn-close py-2" onClick={() => setMensagemSucesso("")}></button>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {erro && (
          <div className="alert alert-danger mt-3 mb-0 py-2 px-3 small" role="alert">
            <i className="bi bi-exclamation-octagon-fill me-2"></i>
            {erro}
          </div>
        )}
      </div>

      {/* Cards com Indicadores Reais (KPIs da Turma) */}
      {resumo && (
        <div className="row g-3 mb-4">
          {/* Média Geral da Turma */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <small className="text-muted fw-semibold">Média Geral da Turma</small>
                  <h3 className="fw-bold mb-0 text-dark mt-1">
                    {resumo.kpis?.total_alunos_avaliados > 0 && resumo.kpis?.media_geral_turma !== undefined
                      ? Number(resumo.kpis.media_geral_turma).toFixed(1)
                      : "—"}
                  </h3>
                </div>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}
                >
                  <i className="bi bi-bar-chart-fill fs-5"></i>
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                {resumo.kpis?.total_alunos_avaliados || 0} alunos com notas registradas
              </small>
            </div>
          </div>

          {/* Taxa de Presença */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <small className="text-muted fw-semibold">Taxa de Presença</small>
                  <h3 className="fw-bold mb-0 text-dark mt-1">
                    {resumo.kpis?.total_alunos_avaliados > 0 && resumo.kpis?.taxa_presenca !== undefined
                      ? `${resumo.kpis.taxa_presenca}%`
                      : "—"}
                  </h3>
                </div>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                >
                  <i className="bi bi-person-check-fill fs-5"></i>
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                {resumo.kpis?.total_alunos_avaliados > 0
                  ? `Absenteísmo: ${resumo.kpis?.taxa_absenteismo ?? 0}%`
                  : "Nenhuma chamada registrada"}
              </small>
            </div>
          </div>

          {/* Alunos com Desempenho Excelente */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <small className="text-muted fw-semibold">Aproveitamento ≥ 80%</small>
                  <h3 className="fw-bold mb-0 text-dark mt-1">
                    {resumo.distribuicao_desempenho?.excelentes?.quantidade ?? 0}
                  </h3>
                </div>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#fef9c3", color: "#ca8a04" }}
                >
                  <i className="bi bi-award-fill fs-5"></i>
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                {resumo.distribuicao_desempenho?.excelentes?.percentual ?? 0}% da turma
              </small>
            </div>
          </div>

          {/* Alunos em Situação Crítica */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <small className="text-muted fw-semibold">Alunos em Risco Crítico</small>
                  <h3 className="fw-bold mb-0 text-danger mt-1">
                    {resumo.distribuicao_desempenho?.criticos?.quantidade ?? 0}
                  </h3>
                </div>
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  <i className="bi bi-exclamation-diamond-fill fs-5"></i>
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                Aproveitamento &lt; 60% ou excesso de faltas
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Notas e Registros Reais */}
      <div className="bg-white rounded-4 shadow-sm p-4">
        {/* Barra de Filtros e Busca de Notas */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "1.15rem" }}>
              Notas Registradas no Sistema
            </h4>
            <small className="text-muted">
              Mostrando {notasFiltradas.length} de {notas.length} lançamentos da turma.
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Filtro de Período */}
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
            >
              <option value="">Todos os Períodos</option>
              <option value="1º Trimestre">1º Trimestre</option>
              <option value="2º Trimestre">2º Trimestre</option>
              <option value="3º Trimestre">3º Trimestre</option>
              <option value="1º Bimestre">1º Bimestre</option>
              <option value="2º Bimestre">2º Bimestre</option>
              <option value="3º Bimestre">3º Bimestre</option>
              <option value="4º Bimestre">4º Bimestre</option>
            </select>

            {/* Campo de Pesquisa */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder="Buscar por aluno ou disciplina..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                style={{ width: "240px" }}
              />
              <i
                className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                style={{ fontSize: "0.8rem" }}
              ></i>
            </div>
          </div>
        </div>

        {/* Tabela Responsiva */}
        {loadingDetalhes ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            <span className="text-muted small">Carregando notas da turma...</span>
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="text-center py-5 border rounded-3 bg-light">
            <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark mb-1">Nenhuma nota encontrada</h6>
            <p className="text-muted small mb-3">
              {termoBusca || periodoFiltro
                ? "Nenhum resultado corresponde aos filtros aplicados."
                : "Esta turma ainda não possui notas lançadas no banco de dados."}
            </p>
            {!termoBusca && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold"
                onClick={() => setModalImportarAberto(true)}
              >
                <i className="bi bi-file-earmark-plus me-1"></i> Cadastrar Notas via CSV
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-muted text-uppercase">
                  <th scope="col">Aluno</th>
                  <th scope="col">Disciplina</th>
                  <th scope="col">Período Letivo</th>
                  <th scope="col" className="text-center">Nota</th>
                  <th scope="col" className="text-center">Situação</th>
                  <th scope="col" className="text-end">Data Registro</th>
                </tr>
              </thead>
              <tbody>
                {notasFiltradas.map((nota) => {
                  const valor = Number(nota.valor_nota || 0);
                  const valorMax = Number(nota.valor_maximo || 10);
                  const isAprovado = valor >= valorMax * 0.6;

                  return (
                    <tr key={nota.id_nota}>
                      <td>
                        <strong className="d-block text-dark small">{nota.aluno?.name || "Estudante"}</strong>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {nota.aluno?.email}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {nota.disciplina?.nome || "Geral"}
                        </span>
                      </td>
                      <td>
                        <small className="text-secondary fw-semibold">{nota.periodo_letivo}</small>
                      </td>
                      <td className="text-center">
                        <span className={`fw-bold ${isAprovado ? "text-dark" : "text-danger"}`}>
                          {valor.toFixed(1)}
                        </span>
                        <small className="text-muted"> / {valorMax.toFixed(0)}</small>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill small ${
                            isAprovado ? "bg-success-subtle text-success border border-success-subtle" : "bg-danger-subtle text-danger border border-danger-subtle"
                          }`}
                        >
                          {isAprovado ? "Aproveitamento Adequado" : "Abaixo da Média"}
                        </span>
                      </td>
                      <td className="text-end">
                        <small className="text-muted">
                          {nota.data_registro
                            ? new Date(nota.data_registro + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Importação de Notas CSV */}
      <ModalImportarNotas
        turma={turmaAtiva}
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        onSuccess={handleImportacaoSucesso}
      />
    </div>
  );
};

export default TurmaEspecialista;
