import { useState } from "react";
import { cadastrarUsuario } from "../../../services/usuarioService";

const ROLES_CADASTRO = [
  { value: "aluno", label: "Aluno (Estudante)" },
  { value: "professor", label: "Professor (Docente)" },
  { value: "bibliotecaria", label: "Bibliotecária" },
  { value: "especialista", label: "Especialista Pedagógico" },
  { value: "adm", label: "Administrador Geral" },
];

export default function ModalCadastrarUsuario({ show, onClose, onSuccess, turmas = [] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [role, setRole] = useState("aluno");
  const [turmaId, setTurmaId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [statusConfirmacao, setStatusConfirmacao] = useState("confirmado");
  const [ativo, setAtivo] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [errosCampos, setErrosCampos] = useState({});

  if (!show) return null;

  const handleGerarSenha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let gerada = "Sebastiana@";
    for (let i = 0; i < 4; i++) {
      gerada += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gerada);
    setMostrarSenha(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setErrosCampos({});

    if (!name.trim()) {
      setErro("Informe o nome completo do usuário.");
      return;
    }

    if (!email.trim()) {
      setErro("Informe o e-mail do usuário.");
      return;
    }

    if (!password || password.length < 8) {
      setErro("A senha inicial deve conter pelo menos 8 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ativo: Boolean(ativo),
        status_confirmacao: statusConfirmacao,
        telefone: telefone.trim() || null,
        data_nascimento: dataNascimento || null,
        turma_id: role === "aluno" && turmaId ? Number(turmaId) : null,
      };

      const res = await cadastrarUsuario(payload);
      onSuccess(res?.data || res);
      onClose();
    } catch (err) {
      setErro(err.message || "Falha ao cadastrar o novo usuário.");
      if (err.errors && typeof err.errors === "object") {
        setErrosCampos(err.errors);
      }
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
      aria-labelledby="modal-cadastrar-usuario-titulo"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h2
                id="modal-cadastrar-usuario-titulo"
                className="modal-title h5 fw-bold text-dark d-flex align-items-center gap-2 mb-0"
              >
                <i className="bi bi-person-plus-fill text-primary"></i>
                Cadastrar Novo Usuário
              </h2>
              <p className="text-muted small mb-0">
                Preencha os dados cadastrais para criar um usuário diretamente no sistema.
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

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              {erro && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {erro}
                </div>
              )}

              <div className="row g-3">
                {/* Nome Completo */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-name" className="form-label small fw-bold text-dark mb-1">
                    Nome Completo <span className="text-danger">*</span>
                  </label>
                  <input
                    id="novo-user-name"
                    type="text"
                    className={`form-control form-control-sm ${errosCampos.name ? "is-invalid" : ""}`}
                    placeholder="Ex: Carlos Drummond de Andrade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={salvando}
                    required
                  />
                  {errosCampos.name && (
                    <div className="invalid-feedback small">{errosCampos.name[0]}</div>
                  )}
                </div>

                {/* E-mail */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-email" className="form-label small fw-bold text-dark mb-1">
                    E-mail Institucional <span className="text-danger">*</span>
                  </label>
                  <input
                    id="novo-user-email"
                    type="email"
                    className={`form-control form-control-sm ${errosCampos.email ? "is-invalid" : ""}`}
                    placeholder="Ex: carlos@aluno.mg.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={salvando}
                    required
                  />
                  {errosCampos.email && (
                    <div className="invalid-feedback small">{errosCampos.email[0]}</div>
                  )}
                </div>

                {/* Papel no Sistema (Role) */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-role" className="form-label small fw-bold text-dark mb-1">
                    Papel no Sistema (Role) <span className="text-danger">*</span>
                  </label>
                  <select
                    id="novo-user-role"
                    className={`form-select form-select-sm ${errosCampos.role ? "is-invalid" : ""}`}
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value !== "aluno") setTurmaId("");
                    }}
                    disabled={salvando}
                  >
                    {ROLES_CADASTRO.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {errosCampos.role && (
                    <div className="invalid-feedback small">{errosCampos.role[0]}</div>
                  )}
                </div>

                {/* Status Inicial */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-status" className="form-label small fw-bold text-dark mb-1">
                    Status de Confirmação <span className="text-danger">*</span>
                  </label>
                  <select
                    id="novo-user-status"
                    className="form-select form-select-sm"
                    value={statusConfirmacao}
                    onChange={(e) => setStatusConfirmacao(e.target.value)}
                    disabled={salvando}
                  >
                    <option value="confirmado">Confirmado / Aprovado (Recomendado)</option>
                    <option value="pendente">Pendente (Aguardando Aprovação)</option>
                    <option value="inativo">Inativo (Sem Vínculo)</option>
                  </select>
                </div>

                {/* Turma (Condicional para Aluno) */}
                {role === "aluno" && (
                  <div className="col-12 col-md-6">
                    <label htmlFor="novo-user-turma" className="form-label small fw-bold text-dark mb-1">
                      Turma de Vínculo (Matrícula)
                    </label>
                    <select
                      id="novo-user-turma"
                      className="form-select form-select-sm"
                      value={turmaId}
                      onChange={(e) => setTurmaId(e.target.value)}
                      disabled={salvando}
                    >
                      <option value="">Nenhuma turma no momento (vincular depois)</option>
                      {turmas.map((t) => (
                        <option key={t.id_turma} value={t.id_turma}>
                          {t.nome_identificador} {t.ano_letivo ? `(${t.ano_letivo})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">
                      Selecione uma turma para efetivar a matrícula do estudante imediatamente.
                    </div>
                  </div>
                )}

                {/* Senha Inicial */}
                <div className={role === "aluno" ? "col-12 col-md-6" : "col-12 col-md-6"}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="novo-user-password" className="form-label small fw-bold text-dark mb-0">
                      Senha Inicial <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none small text-primary fw-semibold"
                      onClick={handleGerarSenha}
                      disabled={salvando}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Gerar Senha
                    </button>
                  </div>
                  <div className="input-group input-group-sm">
                    <input
                      id="novo-user-password"
                      type={mostrarSenha ? "text" : "password"}
                      className={`form-control ${errosCampos.password ? "is-invalid" : ""}`}
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={salvando}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMostrarSenha((v) => !v)}
                      title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                    >
                      <i className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                  {errosCampos.password && (
                    <div className="text-danger small mt-1">{errosCampos.password[0]}</div>
                  )}
                </div>

                {/* Telefone */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-telefone" className="form-label small fw-bold text-dark mb-1">
                    Telefone / WhatsApp (Opcional)
                  </label>
                  <input
                    id="novo-user-telefone"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: (31) 98888-7777"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={salvando}
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="col-12 col-md-6">
                  <label htmlFor="novo-user-nascimento" className="form-label small fw-bold text-dark mb-1">
                    Data de Nascimento (Opcional)
                  </label>
                  <input
                    id="novo-user-nascimento"
                    type="date"
                    className="form-control form-control-sm"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    disabled={salvando}
                  />
                </div>

                {/* Checkbox Ativo */}
                <div className="col-12">
                  <div className="form-check form-switch mt-1">
                    <input
                      id="novo-user-ativo"
                      type="checkbox"
                      className="form-check-input"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      disabled={salvando}
                    />
                    <label htmlFor="novo-user-ativo" className="form-check-label small fw-semibold text-dark">
                      Conta ativa (permite login imediato no sistema)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top-0 pt-0">
              <button
                type="button"
                className="btn btn-light rounded-pill px-3"
                onClick={onClose}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2"
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check-fill"></i>
                    <span>Cadastrar Usuário</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
