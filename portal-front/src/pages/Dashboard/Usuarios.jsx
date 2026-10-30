/**
 * Usuarios.jsx - Painel Administrativo de Controle de Usuários (Role: Admin)
 *
 * Papel Didático:
 * Implementa integralmente a Diretriz 1 (28/10/2026):
 * 1. Carregamento padrão enxuto: exibe apenas os 15 últimos usuários cadastrados no sistema;
 * 2. Barra superior com filtro por Role e busca por Nome do usuário;
 * 3. Tabela acessível por teclado (tabIndex="0", role="region") com colunas:
 *    - Nome do Usuário
 *    - Qual usuário Autorizou/Vinculou o usuário
 *    - Data de vínculo no Sistema
 *    - Role do usuário
 *    - Ações: Editar e Excluir Usuário
 * 4. Modal Editar Usuário:
 *    - Alterar Role
 *    - Incluir comentário administrativo para o usuário
 *    - Emitir notificação direta ("Mensagem da Notificação" + flag SUPER-IMPORTANTE)
 * 5. Modal Excluir Usuário em 2 etapas (estilo GitHub):
 *    - Etapa 1: "Certeza que deseja excluir o Usuário X?"
 *    - Etapa 2: Digitação exata do nome completo do usuário para desativar o vínculo e forçar logoff,
 *      preservando o histórico acadêmico.
 */

import { useEffect, useState } from "react";
import {
  listarUsuarios,
  atualizarUsuario,
  desvincularUsuario,
} from "../../services/usuarioService";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";

const ROLES_OPCOES = [
  { value: "", label: "Todas as Roles" },
  { value: "aluno", label: "Aluno" },
  { value: "professor", label: "Professor" },
  { value: "bibliotecaria", label: "Bibliotecária" },
  { value: "especialista", label: "Especialista" },
  { value: "adm", label: "Administrador" },
];

const ROLE_LABELS = {
  aluno: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  padrao: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  professor: { label: "Professor", badge: "bg-success-subtle text-success" },
  bibliotecaria: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  bibliotecario: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  especialista: { label: "Especialista", badge: "bg-warning-subtle text-dark" },
  adm: { label: "Administrador", badge: "bg-danger-subtle text-danger" },
};

const formatarDataVinculo = (valorIso) => {
  if (!valorIso) return "Aguardando vínculo";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valorIso));
  } catch {
    return valorIso;
  }
};

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filtroRole, setFiltroRole] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [recargaKey, setRecargaKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  // Estado do Modal de Edição (Item 1.3.8)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [editRole, setEditRole] = useState("aluno");
  const [editComentario, setEditComentario] = useState("");
  const [editMensagemNotificacao, setEditMensagemNotificacao] = useState("");
  const [editSuperImportante, setEditSuperImportante] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  // Estado do Modal de Exclusão em 2 Etapas (Itens 1.3.6 e 1.3.7)
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);
  const [etapaExclusao, setEtapaExclusao] = useState(1); // 1 ou 2
  const [confirmacaoNomeInput, setConfirmacaoNomeInput] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  const exibirFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  };

  // Busca os 15 últimos usuários cadastrados com filtro por Role e Nome
  useEffect(() => {
    let ativo = true;

    const timer = setTimeout(() => {
      setLoading(true);
      setErro("");

      listarUsuarios({
        role: filtroRole || undefined,
        busca: buscaNome.trim() || undefined,
        per_page: 15,
      })
        .then((res) => {
          if (!ativo) return;
          setUsuarios(res?.data || []);
          setMeta(res?.meta || null);
        })
        .catch((err) => {
          if (!ativo) return;
          setErro(err.message || "Não foi possível carregar os usuários do sistema.");
        })
        .finally(() => {
          if (ativo) setLoading(false);
        });
    }, 200);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [filtroRole, buscaNome, recargaKey]);

  // Abre o modal de edição populando os campos atuais do usuário
  const handleAbrirEditar = (u) => {
    setUsuarioEmEdicao(u);
    setEditRole(u.role === "padrao" ? "aluno" : u.role || "aluno");
    setEditComentario(u.comentario_admin || "");
    setEditMensagemNotificacao("");
    setEditSuperImportante(false);
    setErroEdicao("");
  };

  // Submete alterações de Role, Comentário e Notificação Direta
  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (!usuarioEmEdicao) return;

    setSalvandoEdicao(true);
    setErroEdicao("");

    try {
      const payload = {
        role: editRole,
        comentario_admin: editComentario.trim() || null,
        mensagem_notificacao: editMensagemNotificacao.trim() || null,
        super_importante: Boolean(editSuperImportante),
      };

      const res = await atualizarUsuario(usuarioEmEdicao.id, payload);
      exibirFeedback(
        res?.message || `Usuário "${usuarioEmEdicao.name}" atualizado com sucesso!`
      );
      setUsuarioEmEdicao(null);
      setRecargaKey((k) => k + 1);
    } catch (err) {
      setErroEdicao(err.message || "Falha ao atualizar o usuário.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Abre o modal de exclusão na Etapa 1
  const handleAbrirExcluir = (u) => {
    setUsuarioParaExcluir(u);
    setEtapaExclusao(1);
    setConfirmacaoNomeInput("");
    setErroExclusao("");
  };

  // Executa a exclusão lógica / encerramento de vínculo na Etapa 2
  const handleConfirmarExclusao = async (e) => {
    e.preventDefault();
    if (!usuarioParaExcluir) return;

    if (confirmacaoNomeInput.trim() !== usuarioParaExcluir.name.trim()) {
      setErroExclusao(
        "O nome digitado não coincide exatamente com o nome completo do usuário."
      );
      return;
    }

    setExcluindo(true);
    setErroExclusao("");

    try {
      const res = await desvincularUsuario(
        usuarioParaExcluir.id,
        confirmacaoNomeInput.trim()
      );
      exibirFeedback(
        res?.message ||
          `Vínculo de "${usuarioParaExcluir.name}" encerrado e logoff forçado com sucesso.`
      );
      setUsuarioParaExcluir(null);
      setRecargaKey((k) => k + 1);
    } catch (err) {
      setErroExclusao(err.message || "Não foi possível excluir/desvincular o usuário.");
    } finally {
      setExcluindo(false);
    }
  };

  const acoesUsuarios = (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <div style={{ minWidth: "150px" }}>
        <select
          id="filtro-role-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none"
          value={filtroRole}
          onChange={(e) => setFiltroRole(e.target.value)}
          aria-label="Filtrar por papel"
        >
          {ROLES_OPCOES.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group" style={{ minWidth: "180px", maxWidth: "260px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search"></i>
        </span>
        <input
          id="busca-nome-usuarios"
          type="search"
          className="form-control form-control-sm border-start-0 ps-0 shadow-none"
          placeholder="Buscar usuário..."
          value={buscaNome}
          onChange={(e) => setBuscaNome(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="position-relative">
      {/* Toast flutuante de confirmação */}
      {feedback && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {feedback}
        </div>
      )}

      <PainelModulo acoes={acoesUsuarios}>
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {erro}
          </div>
        )}

        {/* Tabela de Usuários (Itens 1.3.1, 1.3.4, 1.3.5) */}
        <div
          className="dashboard-table-scroll border"
          tabIndex={0}
          role="region"
          aria-labelledby="titulo-controle-usuarios"
        >
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Nome do Usuário</th>
                <th scope="col">Autorizado / Vinculado por</th>
                <th scope="col">Data de Vínculo no Sistema</th>
                <th scope="col">Role do Usuário</th>
                <th scope="col" className="text-end">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Carregando os 15 últimos usuários cadastrados...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    Nenhum usuário encontrado para os filtros informados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const roleInfo = ROLE_LABELS[u.role] || {
                    label: u.role,
                    badge: "bg-secondary-subtle text-dark",
                  };
                  const autorizadorNome =
                    u.vinculado_por?.name ||
                    u.vinculo_ativo?.autorizador_nome ||
                    (u.status_confirmacao === "confirmado" ? "Sistema / Automático" : "Pendente de Aprovação");
                  const inativo = u.ativo === false || u.status_confirmacao === "inativo";

                  return (
                    <tr key={u.id} className={inativo ? "table-light opacity-75" : ""}>
                      <th scope="row" className="fw-semibold text-dark">
                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-center gap-2">
                            <span>{u.name}</span>
                            {inativo && (
                              <span className="badge bg-secondary rounded-pill" style={{ fontSize: "0.7rem" }}>
                                Inativo (Vínculo Encerrado)
                              </span>
                            )}
                            {!inativo && u.status_confirmacao === "pendente" && (
                              <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: "0.7rem" }}>
                                Pendente
                              </span>
                            )}
                          </div>
                          <small className="text-muted fw-normal">{u.email}</small>
                          {u.comentario_admin && (
                            <small className="text-primary fst-italic mt-1">
                              <i className="bi bi-chat-left-text me-1"></i>
                              {u.comentario_admin}
                            </small>
                          )}
                        </div>
                      </th>
                      <td>
                        <span className="small fw-semibold text-secondary">
                          <i className="bi bi-person-check me-1"></i>
                          {autorizadorNome}
                        </span>
                      </td>
                      <td className="text-nowrap small">
                        {formatarDataVinculo(u.data_vinculo || u.vinculo_ativo?.vinculado_em || u.created_at)}
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${roleInfo.badge}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                            onClick={() => handleAbrirEditar(u)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                            onClick={() => handleAbrirExcluir(u)}
                            disabled={inativo}
                            title={inativo ? "Usuário já está com vínculo inativo" : "Excluir / Desvincular usuário"}
                          >
                            <i className="bi bi-person-x-fill me-1"></i>
                            Excluir Usuário
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && (
          <div className="d-flex justify-content-between align-items-center mt-3 small text-muted">
            <span>
              Exibindo <strong>{usuarios.length}</strong> de <strong>{meta.total ?? usuarios.length}</strong> registro(s) (limite padrão: 15 últimos cadastros).
            </span>
          </div>
        )}
      </PainelModulo>

      {/* Modal 1: Editar Usuário (Role + Comentário + Notificação Direta) - Item 1.3.8 */}
      {usuarioEmEdicao && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-editar-usuario-titulo"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <div>
                  <h2 id="modal-editar-usuario-titulo" className="modal-title h5 fw-bold text-dark mb-0">
                    Editar Usuário
                  </h2>
                  <p className="text-muted small mb-0">
                    {usuarioEmEdicao.name} ({usuarioEmEdicao.email})
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setUsuarioEmEdicao(null)}
                  disabled={salvandoEdicao}
                ></button>
              </div>

              <form onSubmit={handleSalvarEdicao}>
                <div className="modal-body py-3">
                  {erroEdicao && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                      {erroEdicao}
                    </div>
                  )}

                  {/* 1. Alterar Role */}
                  <div className="mb-3">
                    <label htmlFor="edit-role-usuario" className="form-label small fw-bold text-dark">
                      Role (Papel no Sistema):
                    </label>
                    <select
                      id="edit-role-usuario"
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      disabled={salvandoEdicao}
                    >
                      <option value="aluno">Aluno</option>
                      <option value="professor">Professor</option>
                      <option value="bibliotecaria">Bibliotecária</option>
                      <option value="especialista">Especialista</option>
                      <option value="adm">Administrador</option>
                    </select>
                  </div>

                  {/* 2. Comentário para o usuário */}
                  <div className="mb-3">
                    <label htmlFor="edit-comentario-usuario" className="form-label small fw-bold text-dark">
                      Comentário / Observação para o Usuário:
                    </label>
                    <textarea
                      id="edit-comentario-usuario"
                      rows={2}
                      className="form-control"
                      placeholder="Adicione um comentário administrativo ou observação sobre o vínculo..."
                      value={editComentario}
                      onChange={(e) => setEditComentario(e.target.value)}
                      disabled={salvandoEdicao}
                    />
                  </div>

                  {/* 3. Emitir Notificação Direta para o Usuário */}
                  <div className="p-3 rounded-3 bg-light border">
                    <label
                      htmlFor="edit-notificacao-usuario"
                      className="form-label small fw-bold text-dark mb-1"
                    >
                      <i className="bi bi-bell-fill text-warning me-1"></i>
                      Mensagem da Notificação (Opcional):
                    </label>
                    <textarea
                      id="edit-notificacao-usuario"
                      rows={2}
                      className="form-control mb-2"
                      placeholder="Digite uma mensagem para enviar diretamente ao sininho deste usuário..."
                      value={editMensagemNotificacao}
                      onChange={(e) => setEditMensagemNotificacao(e.target.value)}
                      disabled={salvandoEdicao}
                    />

                    <div className="form-check form-switch">
                      <input
                        id="edit-super-importante"
                        type="checkbox"
                        className="form-check-input"
                        checked={editSuperImportante}
                        onChange={(e) => setEditSuperImportante(e.target.checked)}
                        disabled={salvandoEdicao || !editMensagemNotificacao.trim()}
                      />
                      <label
                        htmlFor="edit-super-importante"
                        className="form-check-label small fw-bold text-danger"
                      >
                        Marcar como SUPER-IMPORTANTE (Alerta prioritário)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-3"
                    onClick={() => setUsuarioEmEdicao(null)}
                    disabled={salvandoEdicao}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                    disabled={salvandoEdicao}
                  >
                    {salvandoEdicao ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Excluir Usuário em 2 Etapas (Estilo GitHub) - Itens 1.3.6 e 1.3.7 */}
      {usuarioParaExcluir && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-excluir-usuario-titulo"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h2 id="modal-excluir-usuario-titulo" className="modal-title h5 fw-bold text-danger mb-0">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  Excluir / Encerrar Vínculo do Usuário
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setUsuarioParaExcluir(null)}
                  disabled={excluindo}
                ></button>
              </div>

              <div className="modal-body py-3">
                {erroExclusao && (
                  <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                    {erroExclusao}
                  </div>
                )}

                {etapaExclusao === 1 ? (
                  <div>
                    <p className="fw-semibold text-dark mb-2">
                      Certeza que deseja excluir o Usuário &ldquo;{usuarioParaExcluir.name}&rdquo;?
                    </p>
                    <div className="alert alert-warning small rounded-3 mb-0">
                      <strong>O que acontecerá (Preservação de Histórico):</strong>
                      <ul className="mb-0 mt-1 ps-3">
                        <li>A sessão do usuário será encerrada imediatamente (logoff forçado);</li>
                        <li>O usuário ficará <strong>inativo</strong> e seu vínculo atual será encerrado;</li>
                        <li>Os dados históricos (boletins, empréstimos e vínculos anteriores) são preservados;</li>
                        <li>Caso volte a fazer login, o mesmo cadastro será reaproveitado e enviado para a tela de aprovação gerando um novo vínculo.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <form id="form-confirmar-exclusao-github" onSubmit={handleConfirmarExclusao}>
                    <p className="small text-muted mb-2">
                      Para confirmar a exclusão e encerrar o vínculo, digite exatamente o nome completo do usuário abaixo:
                    </p>
                    <div className="p-2 bg-light border rounded-3 mb-3 text-center">
                      <code className="fw-bold text-dark fs-6">{usuarioParaExcluir.name}</code>
                    </div>
                    <label htmlFor="input-confirmacao-nome-github" className="form-label small fw-bold text-dark">
                      Nome completo do usuário:
                    </label>
                    <input
                      id="input-confirmacao-nome-github"
                      type="text"
                      className="form-control"
                      placeholder={usuarioParaExcluir.name}
                      value={confirmacaoNomeInput}
                      onChange={(e) => setConfirmacaoNomeInput(e.target.value)}
                      disabled={excluindo}
                      autoFocus
                      required
                    />
                  </form>
                )}
              </div>

              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3"
                  onClick={() => setUsuarioParaExcluir(null)}
                  disabled={excluindo}
                >
                  Cancelar
                </button>

                {etapaExclusao === 1 ? (
                  <button
                    type="button"
                    className="btn btn-warning rounded-pill px-4 fw-semibold"
                    onClick={() => setEtapaExclusao(2)}
                  >
                    Sim, prosseguir para confirmação
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="form-confirmar-exclusao-github"
                    className="btn btn-danger rounded-pill px-4 fw-semibold"
                    disabled={
                      excluindo ||
                      confirmacaoNomeInput.trim() !== usuarioParaExcluir.name.trim()
                    }
                  >
                    {excluindo ? "Encerrando vínculo..." : "Confirmar Exclusão do Usuário"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;

