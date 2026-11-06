/**
 * Usuarios.jsx - Painel Administrativo de Controle de Usuários (Role: Admin)
 *
 * Papel Didático:
 * Implementa o controle administrativo unificado de usuários:
 * 1. Carregamento padrão enxuto (paginação com 15 a 100 itens por página);
 * 2. Barra de filtros por Role, Status e Busca por Nome;
 * 3. Tabela acessível por teclado com colunas:
 *    - Nome do Usuário
 *    - Status
 *    - Autorizado / Vinculado por
 *    - Data de Vínculo no Sistema
 *    - Role do Usuário
 *    - Ações (Editar e Excluir Usuário)
 * 4. Modal Unificado de Usuário (Item 6):
 *    - Serve tanto para "Novo Usuário" quanto para "Editar Usuário";
 *    - Permite manipular integralmente os dados do usuário (nome, e-mail, senha/redefinição, role,
 *      turma quando aluno, telefone, data de nascimento, ativo, status de confirmação, comentário
 *      administrativo e notificação direta com flag super-importante);
 *    - Permite desabilitar/inativar o acesso (preservando o histórico acadêmico) e também
 *      excluir totalmente o usuário do banco de dados (exclusão física definitiva com confirmação).
 */

import { useEffect, useState } from "react";
import { listarUsuarios } from "../../services/usuarioService";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import ModalUsuario from "../../components/Dashboard/usuarios/ModalUsuario";
import { listarTurmas } from "../../services/turmasService";

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
  const [pagina, setPagina] = useState(1);
  const [filtroRole, setFiltroRole] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [porPagina, setPorPagina] = useState(25);
  const [turmas, setTurmas] = useState([]);
  const [recargaKey, setRecargaKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  // Estado do Modal Unificado de Usuário (Item 6)
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const exibirFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  };

  // Carrega catálogo de turmas para o formulário de cadastro/edição de alunos
  useEffect(() => {
    let ativo = true;
    listarTurmas()
      .then((res) => {
        if (!ativo) return;
        setTurmas(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  // Mantém a paginação no servidor
  useEffect(() => {
    let ativo = true;

    const timer = setTimeout(() => {
      setLoading(true);
      setErro("");

      listarUsuarios({
        role: filtroRole || undefined,
        busca: buscaNome.trim() || undefined,
        status: filtroStatus || undefined,
        page: pagina,
        per_page: porPagina,
      })
        .then((res) => {
          if (!ativo) return;
          setUsuarios(res?.data || []);
          setMeta(res?.meta || null);
          const ultimaPagina = Math.max(1, Number(res?.meta?.last_page || 1));
          if (pagina > ultimaPagina) setPagina(ultimaPagina);
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
  }, [filtroRole, filtroStatus, buscaNome, pagina, porPagina, recargaKey]);

  // Abre modal no modo de criação
  const handleAbrirNovo = () => {
    setUsuarioSelecionado(null);
    setModalUsuarioAberto(true);
  };

  // Abre modal no modo de edição/manipulação
  const handleAbrirEditar = (u) => {
    setUsuarioSelecionado(u);
    setModalUsuarioAberto(true);
  };

  // Abre modal no modo de edição/exclusão
  const handleAbrirExcluir = (u) => {
    setUsuarioSelecionado(u);
    setModalUsuarioAberto(true);
  };

  const acoesUsuarios = (
    <div className="usuarios-nav-filtros d-flex flex-wrap align-items-center gap-2">
      <button
        type="button"
        id="btn-novo-usuario"
        className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
        onClick={handleAbrirNovo}
      >
        <i className="bi bi-person-plus-fill"></i>
        <span>Novo Usuário</span>
      </button>

      <div style={{ minWidth: "150px" }}>
        <select
          id="filtro-status-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none"
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPagina(1);
          }}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os Status</option>
          <option value="confirmado">Confirmados / Ativos</option>
          <option value="pendente">Aguardando Aprovação</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      <div style={{ minWidth: "140px" }}>
        <select
          id="filtro-role-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none"
          value={filtroRole}
          onChange={(e) => {
            setFiltroRole(e.target.value);
            setPagina(1);
          }}
          aria-label="Filtrar por papel"
        >
          {ROLES_OPCOES.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group" style={{ minWidth: "180px", maxWidth: "240px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search"></i>
        </span>
        <input
          id="busca-nome-usuarios"
          type="search"
          className="form-control form-control-sm border-start-0 ps-0 shadow-none"
          placeholder="Buscar usuário..."
          value={buscaNome}
          onChange={(e) => {
            setBuscaNome(e.target.value);
            setPagina(1);
          }}
        />
      </div>

      <div style={{ minWidth: "115px" }}>
        <select
          id="seletor-per-page-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none text-muted"
          value={porPagina}
          onChange={(e) => {
            setPorPagina(Number(e.target.value));
            setPagina(1);
          }}
          aria-label="Itens por página"
        >
          <option value={15}>15 por pág.</option>
          <option value={25}>25 por pág.</option>
          <option value={50}>50 por pág.</option>
          <option value={100}>100 por pág.</option>
        </select>
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

        {/* Tabela de Usuários */}
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
                <th scope="col">Status</th>
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
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Carregando usuários...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
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
                    u.autorizado_por_nome ||
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
                          </div>
                          <small className="text-muted fw-normal">{u.email}</small>
                          {u.turma && (
                            <small className="text-primary mt-0">
                              <i className="bi bi-mortarboard me-1"></i>
                              {u.turma}
                            </small>
                          )}
                          {u.comentario_admin && (
                            <small className="text-muted fst-italic mt-1">
                              <i className="bi bi-chat-left-text me-1"></i>
                              {u.comentario_admin}
                            </small>
                          )}
                        </div>
                      </th>
                      <td>
                        {inativo ? (
                          <span className="badge bg-secondary text-white rounded-pill px-2 py-1 small fw-semibold">
                            <i className="bi bi-slash-circle me-1"></i>
                            Inativo
                          </span>
                        ) : u.status_confirmacao === "pendente" ? (
                          <span className="badge bg-warning text-dark rounded-pill px-2 py-1 small fw-semibold">
                            <i className="bi bi-hourglass-split me-1"></i>
                            Aguardando Aprovação
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small fw-semibold">
                            <i className="bi bi-check-circle me-1"></i>
                            Confirmado
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="small fw-semibold text-secondary">
                          <i className="bi bi-person-check me-1"></i>
                          {autorizadorNome}
                        </span>
                      </td>
                      <td className="text-nowrap small">
                        {formatarDataVinculo(u.data_vinculo || u.confirmado_em || u.vinculo_ativo?.vinculado_em || u.created_at)}
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
                            title="Editar cadastro e permissões do usuário"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                            onClick={() => handleAbrirExcluir(u)}
                            title="Desabilitar acesso ou excluir definitivamente do banco de dados"
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
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 small text-muted">
            <span>
              Exibindo <strong>{usuarios.length}</strong> de{" "}
              <strong>{meta.total ?? usuarios.length}</strong> usuário(s) · Página{" "}
              <strong>{meta.current_page ?? pagina}</strong> de{" "}
              <strong>{meta.last_page ?? 1}</strong>
            </span>
            <nav className="d-flex align-items-center gap-2" aria-label="Paginação de usuários">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                disabled={loading || pagina <= 1}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                onClick={() =>
                  setPagina((atual) => Math.min(Number(meta.last_page || 1), atual + 1))
                }
                disabled={loading || pagina >= Number(meta.last_page || 1)}
              >
                Próxima
              </button>
            </nav>
          </div>
        )}
      </PainelModulo>

      {/* Modal Unificado de Usuário: Cadastrar, Editar e Excluir Definitivamente */}
      <ModalUsuario
        show={modalUsuarioAberto}
        usuario={usuarioSelecionado}
        turmas={turmas}
        onClose={() => {
          setModalUsuarioAberto(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={(_u, msg) => {
          exibirFeedback(msg || "Operação realizada com sucesso!");
          setRecargaKey((k) => k + 1);
        }}
        onDelete={(_u, msg) => {
          exibirFeedback(msg || "Usuário excluído com sucesso!");
          setRecargaKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default UsuariosPage;
