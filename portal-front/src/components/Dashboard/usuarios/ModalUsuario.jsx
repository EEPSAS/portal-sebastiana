import { useEffect, useRef, useState } from "react";
import {
  cadastrarUsuario,
  atualizarUsuario,
  desvincularUsuario,
  excluirUsuarioTotalmente,
} from "../../../services/usuarioService";
import HistoricoAcoesResumo from "../common/HistoricoAcoesResumo";

const ROLES = [
  { value: "aluno", label: "Aluno (Estudante)" },
  { value: "professor", label: "Professor (Docente)" },
  { value: "bibliotecaria", label: "Bibliotecária" },
  { value: "especialista", label: "Especialista Pedagógico" },
  { value: "adm", label: "Administrador Geral" },
];

// Normaliza papéis legados ou sinônimos para o valor exato aceito pelo select e pelo backend.
const normalizarRoleInicial = (roleUsuario) => {
  if (!roleUsuario) return "aluno";
  const valor = String(roleUsuario).trim().toLowerCase();
  if (valor === "padrao") return "aluno";
  if (valor === "admin" || valor === "administrador") return "adm";
  if (valor === "bibliotecario") return "bibliotecaria";
  return valor;
};

function ModalUsuarioForm({ usuario, onClose, onSuccess, onDelete, turmas = [] }) {
  const isEdicao = Boolean(usuario && usuario.id);

  // Estados dos campos do formulário
  const [name, setName] = useState(usuario?.name || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [role, setRole] = useState(() => normalizarRoleInicial(usuario?.role));
  const [turmaId, setTurmaId] = useState(
    usuario?.turma_id || usuario?.turma_ativa?.id_turma || ""
  );
  const [telefone, setTelefone] = useState(usuario?.telefone || "");
  const [dataNascimento, setDataNascimento] = useState(
    usuario?.data_nascimento ? usuario.data_nascimento.substring(0, 10) : ""
  );
  const [statusConfirmacao, setStatusConfirmacao] = useState(
    usuario?.status_confirmacao || "confirmado"
  );
  const [ativo, setAtivo] = useState(usuario ? Boolean(usuario.ativo) : true);

  // Campos administrativos extras (edição)
  const [comentarioAdmin, setComentarioAdmin] = useState(usuario?.comentario_admin || "");
  const [mensagemNotificacao, setMensagemNotificacao] = useState("");
  const [superImportante, setSuperImportante] = useState(false);

  // Estados de controle da Zona de Perigo / Exclusão
  const [modoExclusao, setModoExclusao] = useState("nenhum"); // 'nenhum' | 'desabilitar' | 'permanente'
  const [confirmacaoNomeInput, setConfirmacaoNomeInput] = useState("");
  const [executandoAcaoPerigo, setExecutandoAcaoPerigo] = useState(false);

  // Estados de feedback e erros
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [errosCampos, setErrosCampos] = useState({});

  // Estados e referências para movimentar o modal com o mouse (clique e arraste)
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const modalContentRef = useRef(null);
  const arrasteRef = useRef(null);

  // Registra listeners globais apenas enquanto o modal está sendo arrastado para acompanhar o ponteiro fora do card
  useEffect(() => {
    if (!arrastando) return undefined;

    const handleMover = (event) => {
      const dados = arrasteRef.current;
      if (!dados) return;

      const novoX = dados.inicioPosX + (event.clientX - dados.inicioMouseX);
      const novoY = dados.inicioPosY + (event.clientY - dados.inicioMouseY);

      // Mantém parte da barra superior visível dentro da janela para evitar que o modal fique inacessível
      const minX = -(dados.baseLeft + dados.largura - 120);
      const maxX = Math.max(minX, window.innerWidth - dados.baseLeft - 120);
      const minY = 8 - dados.baseTop;
      const maxY = Math.max(minY, window.innerHeight - dados.baseTop - 64);

      setPosicao({
        x: Math.max(minX, Math.min(novoX, maxX)),
        y: Math.max(minY, Math.min(novoY, maxY)),
      });
    };

    const handleEncerrar = () => {
      arrasteRef.current = null;
      setArrastando(false);
    };

    window.addEventListener("mousemove", handleMover);
    window.addEventListener("mouseup", handleEncerrar);
    window.addEventListener("blur", handleEncerrar);

    return () => {
      window.removeEventListener("mousemove", handleMover);
      window.removeEventListener("mouseup", handleEncerrar);
      window.removeEventListener("blur", handleEncerrar);
    };
  }, [arrastando]);

  // Inicia o arraste ao clicar com o botão esquerdo fora de campos e botões interativos
  const handleIniciarArraste = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("input, select, textarea, button, a, label, code, [data-no-drag]")) {
      return;
    }

    // Evita seleção acidental de texto durante a movimentação da janela
    e.preventDefault();
    const rect = modalContentRef.current?.getBoundingClientRect();
    arrasteRef.current = {
      inicioMouseX: e.clientX,
      inicioMouseY: e.clientY,
      inicioPosX: posicao.x,
      inicioPosY: posicao.y,
      baseLeft: rect ? rect.left - posicao.x : 0,
      baseTop: rect ? rect.top - posicao.y : 0,
      largura: rect?.width || 600,
    };
    setArrastando(true);
  };

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
      setErro("Informe o nome ou usuário.");
      return;
    }

    // Se o campo E-mail ficar em branco, utiliza o Nome/Usuário informado como identificador de login
    const emailOuUsuarioFinal = email.trim()
      ? email.trim().toLowerCase()
      : name.trim().toLowerCase();

    if (!isEdicao && (!password || password.length < 8)) {
      setErro("A senha inicial deve conter pelo menos 8 caracteres.");
      return;
    }

    if (isEdicao && password && password.length < 8) {
      setErro("A nova senha deve conter pelo menos 8 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      if (isEdicao) {
        const payload = {
          name: name.trim(),
          email: emailOuUsuarioFinal,
          role,
          ativo: Boolean(ativo),
          status_confirmacao: statusConfirmacao,
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento || null,
          turma_id: role === "aluno" ? (turmaId ? Number(turmaId) : null) : null,
          comentario_admin: comentarioAdmin.trim() || null,
          mensagem_notificacao: mensagemNotificacao.trim() || null,
          super_importante: Boolean(superImportante),
        };

        if (password) {
          payload.password = password;
        }

        const res = await atualizarUsuario(usuario.id, payload);
        const atualizado = res?.data || res;
        onSuccess(
          atualizado,
          `Usuário "${atualizado.name || name}" atualizado com sucesso!`
        );
        onClose();
      } else {
        const payload = {
          name: name.trim(),
          email: emailOuUsuarioFinal,
          password,
          role,
          ativo: Boolean(ativo),
          status_confirmacao: statusConfirmacao,
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento || null,
          turma_id: role === "aluno" && turmaId ? Number(turmaId) : null,
        };

        const res = await cadastrarUsuario(payload);
        const novo = res?.data || res;
        onSuccess(novo, `Usuário "${novo.name || name}" cadastrado com sucesso!`);
        onClose();
      }
    } catch (err) {
      setErro(err.message || "Falha ao processar operação do usuário.");
      if (err.errors && typeof err.errors === "object") {
        setErrosCampos(err.errors);
      }
    } finally {
      setSalvando(false);
    }
  };

  // Desabilitar / Inativar usuário ou Reativar
  const handleAlternarDesabilitar = async () => {
    if (!usuario) return;
    setErro("");
    setExecutandoAcaoPerigo(true);

    try {
      if (usuario.ativo) {
        // Inativa logicamente e encerra vínculo preservando histórico
        const res = await desvincularUsuario(usuario.id, usuario.name, { permanente: false });
        onSuccess(
          { ...usuario, ativo: false, status_confirmacao: "inativo" },
          res?.message || `Acesso de "${usuario.name}" desabilitado com sucesso.`
        );
      } else {
        // Reativa
        const res = await atualizarUsuario(usuario.id, {
          ativo: true,
          status_confirmacao: "confirmado",
        });
        onSuccess(
          res?.data || { ...usuario, ativo: true, status_confirmacao: "confirmado" },
          `Acesso de "${usuario.name}" reativado com sucesso!`
        );
      }
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao alterar ativação do usuário.");
      setModoExclusao("nenhum");
    } finally {
      setExecutandoAcaoPerigo(false);
    }
  };

  // Exclusão definitiva permanente do banco de dados (Item 6)
  const handleExcluirPermanente = async (e) => {
    e.preventDefault();
    if (!usuario) return;

    if (confirmacaoNomeInput.trim() !== usuario.name.trim()) {
      setErro("O nome digitado não corresponde exatamente ao nome completo do usuário.");
      return;
    }

    setErro("");
    setExecutandoAcaoPerigo(true);

    try {
      const res = await excluirUsuarioTotalmente(usuario.id, confirmacaoNomeInput.trim());
      if (onDelete) {
        onDelete(
          usuario,
          res?.message || `Usuário "${usuario.name}" foi excluído definitivamente do banco de dados.`
        );
      } else {
        onSuccess(
          null,
          res?.message || `Usuário "${usuario.name}" foi excluído definitivamente do banco de dados.`
        );
      }
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao excluir o usuário definitivamente do banco.");
    } finally {
      setExecutandoAcaoPerigo(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-usuario-titulo"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
        style={{
          transform: `translate3d(${posicao.x}px, ${posicao.y}px, 0)`,
          transition: arrastando ? "none" : undefined,
        }}
      >
        <div
          ref={modalContentRef}
          className="modal-content border-0 shadow-lg rounded-4"
          onMouseDown={handleIniciarArraste}
          style={{
            cursor: arrastando ? "grabbing" : undefined,
            userSelect: arrastando ? "none" : undefined,
          }}
        >
          <div
            className="modal-header border-bottom pb-3"
            style={{
              cursor: arrastando ? "grabbing" : "grab",
              userSelect: "none",
            }}
            title="Clique e arraste para mover esta janela"
          >
            <div>
              <h2
                id="modal-usuario-titulo"
                className="modal-title h5 fw-bold text-dark d-flex align-items-center gap-2 mb-0"
              >
                <i
                  className={`bi ${isEdicao ? "bi-person-gear text-primary" : "bi-person-plus-fill text-primary"}`}
                ></i>
                {isEdicao ? `Editar Usuário: ${usuario.name}` : "Cadastrar Novo Usuário"}
              </h2>
              <p className="text-muted small mb-0">
                {isEdicao
                  ? `Gerenciamento completo do cadastro, papel institucional e permissões (${usuario.email}).`
                  : "Preencha os dados cadastrais para criar um usuário diretamente no sistema."}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onClose}
              disabled={salvando || executandoAcaoPerigo}
            ></button>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ minHeight: 0 }}>
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
                  <label htmlFor="user-name" className="form-label small fw-bold text-dark mb-1">
                    Nome Completo <span className="text-danger">*</span>
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    className={`form-control form-control-sm ${errosCampos.name ? "is-invalid" : ""}`}
                    placeholder="Ex: Carlos Drummond de Andrade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={salvando || executandoAcaoPerigo}
                    required
                  />
                  {errosCampos.name && (
                    <div className="invalid-feedback small">{errosCampos.name[0]}</div>
                  )}
                </div>

                {/* E-mail Institucional (Opcional no cadastro administrativo) */}
                <div className="col-12 col-md-6">
                  <label htmlFor="user-email" className="form-label small fw-bold text-dark mb-1">
                    E-mail Institucional (Opcional)
                  </label>
                  <input
                    id="user-email"
                    type="text"
                    className={`form-control form-control-sm ${errosCampos.email ? "is-invalid" : ""}`}
                    placeholder="Opcional (ex: carlos@aluno.mg.gov.br)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={salvando || executandoAcaoPerigo}
                  />
                  {errosCampos.email && (
                    <div className="invalid-feedback small">{errosCampos.email[0]}</div>
                  )}
                </div>

                {/* Papel no Sistema (Role) */}
                <div className="col-12 col-md-6">
                  <label htmlFor="user-role" className="form-label small fw-bold text-dark mb-1">
                    Papel no Sistema (Role) <span className="text-danger">*</span>
                  </label>
                  <select
                    id="user-role"
                    className={`form-select form-select-sm ${errosCampos.role ? "is-invalid" : ""}`}
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value !== "aluno") setTurmaId("");
                    }}
                    disabled={salvando || executandoAcaoPerigo}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {errosCampos.role && (
                    <div className="invalid-feedback small">{errosCampos.role[0]}</div>
                  )}
                </div>

                {/* Status de Confirmação */}
                <div className="col-12 col-md-6">
                  <label htmlFor="user-status" className="form-label small fw-bold text-dark mb-1">
                    Status de Confirmação <span className="text-danger">*</span>
                  </label>
                  <select
                    id="user-status"
                    className="form-select form-select-sm"
                    value={statusConfirmacao}
                    onChange={(e) => setStatusConfirmacao(e.target.value)}
                    disabled={salvando || executandoAcaoPerigo}
                  >
                    <option value="confirmado">Confirmado / Aprovado (Ativo)</option>
                    <option value="pendente">Pendente (Aguardando Aprovação)</option>
                    <option value="inativo">Inativo (Sem Vínculo)</option>
                  </select>
                </div>

                {/* Turma (Condicional para Aluno) */}
                {role === "aluno" && (
                  <div className="col-12 col-md-6">
                    <label htmlFor="user-turma" className="form-label small fw-bold text-dark mb-1">
                      Turma de Vínculo (Matrícula)
                    </label>
                    <select
                      id="user-turma"
                      className="form-select form-select-sm"
                      value={turmaId}
                      onChange={(e) => setTurmaId(e.target.value)}
                      disabled={salvando || executandoAcaoPerigo}
                    >
                      <option value="">Nenhuma turma no momento (vincular depois)</option>
                      {turmas.map((t) => (
                        <option key={t.id_turma} value={t.id_turma}>
                          {t.nome_identificador} {t.ano_letivo ? `(${t.ano_letivo})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">
                      {isEdicao
                        ? "Alterar a turma remaneja a matrícula ativa do estudante."
                        : "Selecione uma turma para efetivar a matrícula do estudante imediatamente."}
                    </div>
                  </div>
                )}

                {/* Senha (Obrigatória na criação, opcional na edição) */}
                <div className="col-12 col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="user-password" className="form-label small fw-bold text-dark mb-0">
                      {isEdicao ? "Redefinir Senha (Opcional)" : "Senha Inicial *"}
                    </label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none small text-primary fw-semibold"
                      onClick={handleGerarSenha}
                      disabled={salvando || executandoAcaoPerigo}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Gerar Senha
                    </button>
                  </div>
                  <div className="input-group input-group-sm">
                    <input
                      id="user-password"
                      type={mostrarSenha ? "text" : "password"}
                      className={`form-control ${errosCampos.password ? "is-invalid" : ""}`}
                      placeholder={
                        isEdicao
                          ? "Deixe em branco para manter a senha atual"
                          : "Mínimo de 8 caracteres"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={salvando || executandoAcaoPerigo}
                      required={!isEdicao}
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
                  <label htmlFor="user-telefone" className="form-label small fw-bold text-dark mb-1">
                    Telefone / WhatsApp (Opcional)
                  </label>
                  <input
                    id="user-telefone"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: (31) 98888-7777"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={salvando || executandoAcaoPerigo}
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="col-12 col-md-6">
                  <label htmlFor="user-nascimento" className="form-label small fw-bold text-dark mb-1">
                    Data de Nascimento (Opcional)
                  </label>
                  <input
                    id="user-nascimento"
                    type="date"
                    className="form-control form-control-sm"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    disabled={salvando || executandoAcaoPerigo}
                  />
                </div>

                {/* Checkbox Ativo */}
                <div className="col-12">
                  <div className="form-check form-switch mt-1">
                    <input
                      id="user-ativo"
                      type="checkbox"
                      className="form-check-input"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      disabled={salvando || executandoAcaoPerigo}
                    />
                    <label htmlFor="user-ativo" className="form-check-label small fw-semibold text-dark">
                      Conta ativa (permite autenticação e acesso aos recursos escolares)
                    </label>
                  </div>
                </div>

                {/* Campos Administrativos Extras apenas na Edição */}
                {isEdicao && (
                  <>
                    {/* Comentário Administrativo */}
                    <div className="col-12">
                      <label htmlFor="user-comentario" className="form-label small fw-bold text-dark mb-1">
                        Comentário / Observação Administrativa:
                      </label>
                      <textarea
                        id="user-comentario"
                        rows={2}
                        className="form-control form-control-sm"
                        placeholder="Adicione um comentário administrativo ou observação sobre o vínculo..."
                        value={comentarioAdmin}
                        onChange={(e) => setComentarioAdmin(e.target.value)}
                        disabled={salvando || executandoAcaoPerigo}
                      />
                    </div>

                    {/* Notificação Direta ao Usuário */}
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light border">
                        <label
                          htmlFor="user-notificacao"
                          className="form-label small fw-bold text-dark mb-1"
                        >
                          <i className="bi bi-bell-fill text-warning me-1"></i>
                          Emitir Notificação Direta no Painel do Usuário (Opcional):
                        </label>
                        <textarea
                          id="user-notificacao"
                          rows={2}
                          className="form-control form-control-sm mb-2"
                          placeholder="Digite uma mensagem para ser enviada diretamente ao sininho de notificações deste usuário..."
                          value={mensagemNotificacao}
                          onChange={(e) => setMensagemNotificacao(e.target.value)}
                          disabled={salvando || executandoAcaoPerigo}
                        />

                        <div className="form-check form-switch">
                          <input
                            id="user-super-importante"
                            type="checkbox"
                            className="form-check-input"
                            checked={superImportante}
                            onChange={(e) => setSuperImportante(e.target.checked)}
                            disabled={salvando || executandoAcaoPerigo || !mensagemNotificacao.trim()}
                          />
                          <label
                            htmlFor="user-super-importante"
                            className="form-check-label small fw-bold text-danger"
                          >
                            Marcar como Notificação SUPER-IMPORTANTE (Alerta prioritário)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Histórico recente de ações administrativas sobre este usuário */}
                    <div className="col-12 mt-2">
                      <HistoricoAcoesResumo
                        ultimaAcao={usuario?.ultima_acao}
                        ultimasAcoes={usuario?.ultimas_acoes}
                        rotuloEntidade="usuário"
                      />
                    </div>

                    {/* Zona de Perigo / Ações Críticas */}
                    <div className="col-12 mt-4">
                      <div className="border border-danger-subtle rounded-3 p-3 bg-danger-subtle bg-opacity-10">
                        <h3 className="h6 fw-bold text-danger d-flex align-items-center gap-2 mb-2">
                          <i className="bi bi-exclamation-triangle-fill"></i>
                          Zona de Perigo & Ações Críticas
                        </h3>
                        <p className="small text-muted mb-3">
                          Você pode <strong>desabilitar o acesso</strong> (preservando notas e histórico) ou{" "}
                          <strong>excluir totalmente o usuário do banco de dados</strong>.
                        </p>

                        {modoExclusao === "nenhum" && (
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={`btn btn-sm ${usuario.ativo ? "btn-outline-warning" : "btn-outline-success"} rounded-pill fw-semibold`}
                              onClick={() => setModoExclusao("desabilitar")}
                              disabled={salvando || executandoAcaoPerigo}
                            >
                              <i
                                className={`bi ${usuario.ativo ? "bi-slash-circle" : "bi-check-circle"} me-1`}
                              ></i>
                              {usuario.ativo ? "Desabilitar / Inativar Acesso" : "Reativar Acesso"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-pill fw-semibold"
                              onClick={() => {
                                setModoExclusao("permanente");
                                setConfirmacaoNomeInput("");
                              }}
                              disabled={salvando || executandoAcaoPerigo}
                            >
                              <i className="bi bi-trash3-fill me-1"></i>
                              Excluir Totalmente do Banco de Dados
                            </button>
                          </div>
                        )}

                        {/* Confirmação 1: Desabilitar Lógico */}
                        {modoExclusao === "desabilitar" && (
                          <div className="p-3 bg-white rounded-3 border border-warning shadow-sm">
                            <h4 className="h6 fw-bold text-dark mb-1">
                              {usuario.ativo
                                ? `Confirmar desativação de "${usuario.name}"?`
                                : `Confirmar reativação de "${usuario.name}"?`}
                            </h4>
                            <p className="small text-muted mb-3">
                              {usuario.ativo
                                ? "O usuário terá seu login suspenso e o vínculo atual encerrado, mas seus boletins, histórico acadêmico e empréstimos serão preservados no banco de dados."
                                : "O usuário voltará a ter acesso ativo ao portal escolar."}
                            </p>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-light rounded-pill px-3"
                                onClick={() => setModoExclusao("nenhum")}
                                disabled={executandoAcaoPerigo}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${usuario.ativo ? "btn-warning" : "btn-success"} rounded-pill px-3 fw-semibold`}
                                onClick={handleAlternarDesabilitar}
                                disabled={executandoAcaoPerigo}
                              >
                                {executandoAcaoPerigo
                                  ? "Processando..."
                                  : usuario.ativo
                                    ? "Sim, Desabilitar Acesso"
                                    : "Sim, Reativar Acesso"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Confirmação 2: Exclusão Total Definitiva no Banco (GitHub Style) */}
                        {modoExclusao === "permanente" && (
                          <div className="p-3 bg-white rounded-3 border border-danger shadow-sm">
                            <h4 className="h6 fw-bold text-danger d-flex align-items-center gap-1 mb-1">
                              <i className="bi bi-radioactive"></i>
                              Exclusão Definitiva no Banco de Dados
                            </h4>
                            <div className="alert alert-danger py-2 px-3 small rounded-2 mb-3">
                              <strong>ATENÇÃO: AÇÃO IRREVERSÍVEL!</strong> O usuário será removido
                              fisicamente da tabela <code>users</code>. Esta operação não pode ser
                              desfeita.
                            </div>
                            <p className="small text-dark mb-2">
                              Para autorizar a remoção definitiva, digite exatamente o nome completo do
                              usuário abaixo:
                            </p>
                            <div className="p-2 bg-light border rounded-2 text-center mb-2" data-no-drag="true">
                              <strong className="text-dark fs-6">{usuario.name}</strong>
                            </div>
                            <input
                              type="text"
                              className="form-control form-control-sm mb-3"
                              placeholder={usuario.name}
                              value={confirmacaoNomeInput}
                              onChange={(e) => setConfirmacaoNomeInput(e.target.value)}
                              disabled={executandoAcaoPerigo}
                              autoFocus
                            />
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-light rounded-pill px-3"
                                onClick={() => {
                                  setModoExclusao("nenhum");
                                  setConfirmacaoNomeInput("");
                                }}
                                disabled={executandoAcaoPerigo}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger rounded-pill px-3 fw-semibold"
                                onClick={handleExcluirPermanente}
                                disabled={
                                  executandoAcaoPerigo ||
                                  confirmacaoNomeInput.trim() !== usuario.name.trim()
                                }
                              >
                                {executandoAcaoPerigo
                                  ? "Excluindo..."
                                  : "Excluir Definitivamente do Banco"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer border-top pt-2">
              <button
                type="button"
                className="btn btn-light rounded-pill px-3"
                onClick={onClose}
                disabled={salvando || executandoAcaoPerigo}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2"
                disabled={salvando || executandoAcaoPerigo}
              >
                {salvando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${isEdicao ? "bi-check2-circle" : "bi-person-check-fill"}`}></i>
                    <span>{isEdicao ? "Salvar Alterações" : "Cadastrar Usuário"}</span>
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

export default function ModalUsuario({
  show,
  usuario = null,
  onClose,
  onSuccess,
  onDelete,
  turmas = [],
}) {
  if (!show) return null;

  return (
    <ModalUsuarioForm
      key={usuario?.id || "novo"}
      usuario={usuario}
      onClose={onClose}
      onSuccess={onSuccess}
      onDelete={onDelete}
      turmas={turmas}
    />
  );
}