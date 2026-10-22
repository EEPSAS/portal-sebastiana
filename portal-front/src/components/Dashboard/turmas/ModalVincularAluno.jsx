import { useEffect, useState } from "react";
import { fetchAlunosDisponiveis, vincularAlunoTurma } from "../../../services/turmasService";

/**
 * Normaliza e tenta encontrar a turma cadastrada no sistema correspondente
 * ao texto retornado pela API do Google (ex: "Turma: 3º Ano A - Ensino Médio").
 */
function encontrarTurmaCorrespondente(turmaStr, listaTurmas = [], turmaPadraoId = "") {
  if (!turmaStr) return turmaPadraoId;

  // Remove o prefixo "Turma:" e limpa espaçamentos extras
  const nomeLimpo = turmaStr.replace(/^Turma:\s*/i, "").trim().toLowerCase();

  // 1. Tenta correspondência exata de nome
  const matchExato = listaTurmas.find(
    (t) => (t.nome_identificador || "").trim().toLowerCase() === nomeLimpo
  );
  if (matchExato) return String(matchExato.id_turma);

  // 2. Tenta correspondência parcial (ex: "3º Ano A" contido no identificador)
  const matchParcial = listaTurmas.find((t) => {
    const nomeTurma = (t.nome_identificador || "").toLowerCase();
    return nomeTurma.includes(nomeLimpo) || nomeLimpo.includes(nomeTurma);
  });
  if (matchParcial) return String(matchParcial.id_turma);

  return turmaPadraoId ? String(turmaPadraoId) : "";
}

/**
 * Modal de Confirmação de Alunos Integrados via Google Workspace.
 * Substitui o cadastro manual de estudantes, permitindo ao Especialista
 * homologar as informações capturadas da API institucional (Nome, E-mail,
 * Perfil Aluno e Turma de Origem).
 */
const ModalVincularAluno = ({
  turma,
  turmasDisponiveis = [],
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [alunos, setAlunos] = useState([]);
  const [usuarioIdSelecionado, setUsuarioIdSelecionado] = useState("");
  const [turmaManualId, setTurmaManualId] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [dataMatricula, setDataMatricula] = useState(() => new Date().toISOString().slice(0, 10));

  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Busca os estudantes elegíveis sempre que o modal for aberto ou a busca for alterada
  useEffect(() => {
    if (!isOpen || !turma?.id_turma) return;

    let cancelado = false;

    const delayDebounce = setTimeout(() => {
      setLoadingAlunos(true);
      setErro("");
      fetchAlunosDisponiveis(turma.id_turma, { busca: termoBusca })
        .then((dados) => {
          if (!cancelado) {
            const lista = dados || [];
            setAlunos(lista);
            // Pré-seleciona o primeiro estudante da fila se nenhum estiver ativo
            if (lista.length > 0) {
              setUsuarioIdSelecionado((prev) => {
                const aindaExiste = lista.some((a) => String(a.id) === String(prev));
                return aindaExiste ? prev : String(lista[0].id);
              });
            } else {
              setUsuarioIdSelecionado("");
            }
          }
        })
        .catch((err) => {
          if (!cancelado) {
            setErro(err.message || "Erro ao carregar a lista de alunos da API.");
          }
        })
        .finally(() => {
          if (!cancelado) setLoadingAlunos(false);
        });
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(delayDebounce);
    };
  }, [isOpen, turma?.id_turma, termoBusca]);

  // Aluno atualmente em foco para conferência
  const alunoAtual =
    alunos.find((a) => String(a.id) === String(usuarioIdSelecionado)) || null;

  // Texto formatado da turma detectada pela API do Google
  const turmaDetectadaGoogle = !alunoAtual
    ? ""
    : alunoAtual.turma ||
      alunoAtual.turma_origem ||
      alunoAtual.google_turma ||
      `Turma: ${turma?.nome_identificador || "3º Ano A - Ensino Médio"}`;

  // Sugestão automática de turma baseada na extração da API do Google
  const turmaSugeridaId = !alunoAtual
    ? turma?.id_turma
      ? String(turma.id_turma)
      : ""
    : String(
        encontrarTurmaCorrespondente(
          turmaDetectadaGoogle,
          turmasDisponiveis.length > 0 ? turmasDisponiveis : [turma],
          turma?.id_turma
        ) ||
          turma?.id_turma ||
          ""
      );

  // Turma final a ser confirmada (prioriza ajuste manual do especialista se houver)
  const turmaDestinoId = turmaManualId !== null ? turmaManualId : turmaSugeridaId;

  if (!isOpen) return null;

  // Processa a homologação da matrícula confirmada pelo Especialista
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");

    if (!usuarioIdSelecionado) {
      setErro("Por favor, selecione um estudante para confirmar a matrícula.");
      return;
    }

    if (!turmaDestinoId) {
      setErro("Por favor, selecione a turma oficial para homologar a matrícula.");
      return;
    }

    setSalvando(true);
    try {
      const resposta = await vincularAlunoTurma({
        turmaId: Number(turmaDestinoId),
        usuarioId: Number(usuarioIdSelecionado),
        dataMatricula,
      });

      // Remove imediatamente o estudante homologado da fila local de pendências
      const novosAlunos = alunos.filter(
        (a) => String(a.id) !== String(usuarioIdSelecionado)
      );
      setAlunos(novosAlunos);

      if (onSuccess) {
        onSuccess(resposta);
      }

      if (novosAlunos.length > 0) {
        // Avança automaticamente para o próximo estudante pendente na lista
        setUsuarioIdSelecionado(String(novosAlunos[0].id));
        setTurmaManualId(null);
      } else {
        // Encerra o modal caso não haja mais estudantes na fila
        setUsuarioIdSelecionado("");
        onClose();
      }
    } catch (err) {
      setErro(err.message || "Falha ao homologar a matrícula do aluno.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="turmas-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="turmas-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmar-titulo"
        style={{ width: "min(620px, 100%)" }}
      >
        {/* Cabeçalho do Modal */}
        <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: "46px",
                height: "46px",
                backgroundColor: "var(--dashboard-gray-soft)",
                border: "1px solid var(--dashboard-gray-border)",
              }}
            >
              <i className="bi bi-google text-primary fs-4"></i>
            </div>
            <div>
              <h5 id="modal-confirmar-titulo" className="fw-bold mb-1 text-dark">
                Confirmar Matrícula de Aluno
              </h5>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span
                  className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1"
                  style={{ fontSize: "0.72rem" }}
                >
                  <i className="bi bi-shield-check"></i>
                  Google Workspace
                </span>
                <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                  Turma Selecionada: <strong>{turma?.nome_identificador}</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={onClose}
            disabled={salvando}
          ></button>
        </div>

        {/* Formulário de Homologação */}
        <form onSubmit={handleSubmit}>
          {/* Mensagem de Erro */}
          {erro && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {erro}
            </div>
          )}

          {loadingAlunos ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              <span className="text-muted small">Consultando dados de login da API do Google...</span>
            </div>
          ) : alunos.length === 0 ? (
            <div className="text-center py-4 px-3 border rounded-3 bg-light mb-3">
              <i className="bi bi-person-check fs-1 text-muted d-block mb-2"></i>
              <h6 className="fw-bold text-dark mb-1">Nenhum aluno pendente de confirmação</h6>
              <p className="text-muted small mb-0">
                Todos os estudantes desta turma já foram homologados ou não há novos logins institucionais aguardando validação no momento.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Seleção / Alternância entre alunos da fila (se houver mais de um) */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="busca-aluno" className="form-label small fw-bold text-dark mb-0">
                    Estudante Pendente de Homologação:
                  </label>
                  <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
                    {alunos.length} {alunos.length === 1 ? "aluno aguardando" : "alunos aguardando"}
                  </span>
                </div>

                {alunos.length > 3 && (
                  <div className="position-relative mb-2">
                    <input
                      id="busca-aluno"
                      type="text"
                      className="form-control form-control-sm ps-4"
                      placeholder="Pesquisar por nome ou e-mail institucional..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      disabled={salvando}
                    />
                    <i
                      className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                      style={{ fontSize: "0.8rem" }}
                    ></i>
                  </div>
                )}

                <select
                  id="aluno-select"
                  className="form-select form-select-sm"
                  value={usuarioIdSelecionado}
                  onChange={(e) => {
                    setUsuarioIdSelecionado(e.target.value);
                    setTurmaManualId(null);
                  }}
                  disabled={salvando}
                  required
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Cartão de Informações Coletadas da API do Google */}
              {alunoAtual && (
                <div
                  className="card border rounded-3 mb-3 shadow-none"
                  style={{ backgroundColor: "var(--dashboard-gray-soft)", borderColor: "var(--dashboard-gray-border)" }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                      <span className="fw-bold text-uppercase text-muted" style={{ fontSize: "0.68rem" }}>
                        <i className="bi bi-google text-primary me-1"></i> Informações Fornecidas pela API
                      </span>
                      <span
                        className="badge bg-success-subtle text-success border border-success-subtle"
                        style={{ fontSize: "0.68rem" }}
                      >
                        Autenticado via Google
                      </span>
                    </div>

                    <div className="row g-2">
                      {/* Nome do Estudante */}
                      <div className="col-12 col-sm-6">
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          Nome Completo:
                        </small>
                        <strong className="text-dark small text-truncate d-block">
                          {alunoAtual.name}
                        </strong>
                      </div>

                      {/* E-mail Institucional */}
                      <div className="col-12 col-sm-6">
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          E-mail Institucional:
                        </small>
                        <span className="text-dark small text-truncate d-block font-monospace">
                          {alunoAtual.email}
                        </span>
                      </div>

                      {/* Tipo de Perfil */}
                      <div className="col-12 col-sm-6 mt-2">
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          Tipo de Perfil:
                        </small>
                        <span className="badge bg-info-subtle text-info border border-info-subtle fw-semibold">
                          <i className="bi bi-mortarboard me-1"></i> Aluno
                        </span>
                      </div>

                      {/* Turma Vinda da API */}
                      <div className="col-12 col-sm-6 mt-2">
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          Turma Identificada pela API:
                        </small>
                        <span
                          className="badge bg-secondary-subtle text-dark border fw-medium text-truncate d-inline-block"
                          style={{ maxWidth: "100%", fontSize: "0.75rem" }}
                          title={turmaDetectadaGoogle}
                        >
                          <i className="bi bi-tag-fill me-1 text-secondary"></i>
                          {turmaDetectadaGoogle}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Confirmação / Ajuste da Turma Oficial no Sistema */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="turma-destino" className="form-label small fw-bold text-dark mb-0">
                    Turma a Ser Homologada no Sistema:
                  </label>
                  <span className="text-success small fw-semibold" style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-magic me-1"></i> Match sugerido da API
                  </span>
                </div>

                <select
                  id="turma-destino"
                  className="form-select form-select-sm"
                  value={turmaDestinoId}
                  onChange={(e) => setTurmaManualId(e.target.value)}
                  disabled={salvando}
                  required
                >
                  {(turmasDisponiveis.length > 0 ? turmasDisponiveis : [turma]).map((t) => (
                    <option key={t.id_turma} value={t.id_turma}>
                      {t.nome_identificador} — Turno {t.turno} ({t.ano_letivo})
                    </option>
                  ))}
                </select>
                <small className="text-muted d-block mt-1" style={{ fontSize: "0.73rem" }}>
                  O sistema identificou a turma da API e a pré-selecionou. O especialista pode confirmar ou alterar a alocação antes de homologar.
                </small>
              </div>

              {/* 4. Data de Matrícula */}
              <div className="mb-3">
                <label htmlFor="data-matricula" className="form-label small fw-bold text-dark">
                  Data de Matrícula / Homologação:
                </label>
                <input
                  id="data-matricula"
                  type="date"
                  className="form-control form-control-sm"
                  value={dataMatricula}
                  onChange={(e) => setDataMatricula(e.target.value)}
                  disabled={salvando}
                  required
                />
              </div>

              {/* 5. Caixa Explicativa Didática */}
              <div className="p-3 bg-light rounded-3 border small text-muted">
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-info-circle-fill text-primary mt-1"></i>
                  <div>
                    <strong>Confirmação de dados sem digitação manual:</strong> As informações foram recuperadas diretamente da conta institucional do estudante. Ao confirmar, a matrícula é ativada no sistema, concedendo acesso ao boletim, frequências e turmas.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Rodapé de Ações */}
          <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-3">
            <button
              type="button"
              className="btn btn-sm btn-light border px-3 rounded-pill"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>

            {alunos.length > 0 && (
              <button
                type="submit"
                className="btn btn-sm turmas-btn-primario px-4 rounded-pill d-flex align-items-center gap-2"
                disabled={salvando || loadingAlunos || !alunoAtual || !turmaDestinoId}
              >
                {salvando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Homologando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Confirmar Informações e Matricular</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalVincularAluno;
