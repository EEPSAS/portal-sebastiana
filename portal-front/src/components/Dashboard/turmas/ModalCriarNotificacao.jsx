import { useState } from "react";
import { criarNotificacao } from "../../../services/notificacoesService";

const obterAlunoId = (matricula) =>
  matricula?.aluno?.id ?? matricula?.usuario_id ?? matricula?.aluno_id ?? "";

const obterTurmaId = (matricula) =>
  matricula?.turma_id ?? matricula?.turma?.id_turma ?? "";

const ModalCriarNotificacao = ({
  matricula,
  matriculas,
  turmas,
  role,
  onClose,
  onCreated,
}) => {
  const [titulo, setTitulo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [destinatarioTipo, setDestinatarioTipo] = useState("aluno");
  const [alunoId, setAlunoId] = useState(String(obterAlunoId(matricula)));
  const [turmaId, setTurmaId] = useState(String(obterTurmaId(matricula)));
  const [superImportante, setSuperImportante] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const alunosDisponiveis = [
    ...new Map(
      matriculas
        .map((item) => ({
          id: obterAlunoId(item),
          nome: item.aluno?.name || item.name || "Estudante",
        }))
        .filter((item) => item.id)
        .map((item) => [String(item.id), item])
    ).values(),
  ];
  const podeEnviarGeral = ["especialista", "adm", "admin"].includes(String(role).toLowerCase());

  const enviar = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    const dados = {
      titulo,
      assunto,
      destinatario_tipo: destinatarioTipo,
      super_importante: superImportante,
    };
    if (destinatarioTipo === "aluno") dados.aluno_id = Number(alunoId);
    if (destinatarioTipo === "turma") dados.turma_id = Number(turmaId);

    try {
      await criarNotificacao(dados);
      onCreated();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-notificacao-titulo"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1070 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <form className="modal-content border-0 shadow-lg rounded-4" onSubmit={enviar}>
          <div className="modal-header border-0">
            <div>
              <h2 className="modal-title h5 fw-bold" id="modal-notificacao-titulo">
                Criar notificação
              </h2>
              <p className="text-muted small mb-0">
                Notificações manuais são importantes; super-importantes abrem um pop-up no login.
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onClose}
              disabled={salvando}
            ></button>
          </div>

          <div className="modal-body pt-0">
            {erro && <div className="alert alert-danger py-2">{erro}</div>}

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="notificacao-titulo">
                Título
              </label>
              <input
                id="notificacao-titulo"
                className="form-control"
                maxLength={255}
                required
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="notificacao-assunto">
                Assunto
              </label>
              <textarea
                id="notificacao-assunto"
                className="form-control"
                rows="4"
                maxLength={5000}
                required
                value={assunto}
                onChange={(event) => setAssunto(event.target.value)}
              ></textarea>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-5">
                <label className="form-label fw-semibold" htmlFor="notificacao-destinatario-tipo">
                  Enviar para
                </label>
                <select
                  id="notificacao-destinatario-tipo"
                  className="form-select"
                  value={destinatarioTipo}
                  onChange={(event) => setDestinatarioTipo(event.target.value)}
                >
                  <option value="aluno">Um aluno</option>
                  <option value="turma">Uma turma</option>
                  {podeEnviarGeral && <option value="geral">Toda a comunidade escolar</option>}
                </select>
              </div>

              {destinatarioTipo === "aluno" && (
                <div className="col-md-7">
                  <label className="form-label fw-semibold" htmlFor="notificacao-aluno">
                    Aluno
                  </label>
                  <select
                    id="notificacao-aluno"
                    className="form-select"
                    required
                    value={alunoId}
                    onChange={(event) => setAlunoId(event.target.value)}
                  >
                    <option value="">Selecione um aluno</option>
                    {alunosDisponiveis.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {destinatarioTipo === "turma" && (
                <div className="col-md-7">
                  <label className="form-label fw-semibold" htmlFor="notificacao-turma">
                    Turma
                  </label>
                  <select
                    id="notificacao-turma"
                    className="form-select"
                    required
                    value={turmaId}
                    onChange={(event) => setTurmaId(event.target.value)}
                  >
                    <option value="">Selecione uma turma</option>
                    {turmas.map((turma) => (
                      <option key={turma.id_turma ?? turma.id} value={turma.id_turma ?? turma.id}>
                        {turma.nome_identificador}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-check">
              <input
                id="notificacao-super-importante"
                className="form-check-input"
                type="checkbox"
                checked={superImportante}
                onChange={(event) => setSuperImportante(event.target.checked)}
              />
              <label className="form-check-label fw-semibold" htmlFor="notificacao-super-importante">
                Marcar como super-importante
              </label>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={salvando}>
              {salvando ? "Enviando..." : "Enviar notificação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCriarNotificacao;
