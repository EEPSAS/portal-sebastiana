/**
 * Header.jsx - Barra Superior do Painel Administrativo (Navbar)
 *
 * Funcionalidades Didáticas:
 * 1. Identificação do Usuário: Exibe o nome e cargo do usuário logado.
 * 2. Alternador de Visão para Administrador (Admin View Switcher):
 *    Se o usuário real for Administrador (`adm`), ele pode alternar sua visão
 *    para qualquer papel (Aluno, Professor, Bibliotecária, Especialista).
 *    Ao escolher uma opção, abre um modal de confirmação e recarrega a página.
 * 3. Botão 'Sair': Encerra a sessão e redireciona expressamente para o portal público (`/`).
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const ROLES_SIMULACAO = [
  { value: "adm", label: "Administrador (Padrão)", icon: "bi-shield-lock" },
  { value: "especialista", label: "Especialista Pedagógico", icon: "bi-person-badge" },
  { value: "professor", label: "Professor", icon: "bi-mortarboard" },
  { value: "bibliotecaria", label: "Bibliotecária", icon: "bi-book" },
  { value: "aluno", label: "Aluno", icon: "bi-backpack" },
];

const ROLE_DISPLAY_NAMES = {
  aluno: "Aluno",
  padrao: "Aluno",
  professor: "Professor",
  bibliotecaria: "Bibliotecária",
  bibliotecario: "Bibliotecária",
  especialista: "Especialista",
  adm: "Administrador",
};


const Header = ({
  userName = "Maria Silva",
  role = "Usuário",
  userPhoto,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { user, isRealAdmin, switchSimulatedRole } = useAuth();
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

  // Redireciona obrigatoriamente para a página inicial pública do portal (/)
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
    window.location.href = "/";
  };

  // Abre o modal de confirmação ao clicar em um papel no menu
  const handleSelecionarPapel = (opcao) => {
    setDropdownAberto(false);
    if (opcao.value === user?.role) return; // Já está no mesmo perfil
    setPerfilSelecionado(opcao);
    setModalConfirmacaoAberto(true);
  };

  // Confirma a troca, persiste a escolha e navega dinamicamente para o destino adequado
  const handleConfirmarTroca = () => {
    if (perfilSelecionado) {
      const novaRole = perfilSelecionado.value;
      switchSimulatedRole(novaRole);
      setModalConfirmacaoAberto(false);

      // Destino padrão do papel selecionado
      const destino =
        novaRole === "bibliotecaria" || novaRole === "bibliotecario"
          ? "/dashboard/biblioteca"
          : "/dashboard/geral";

      navigate(destino);
    }
  };

  // Identificação do papel real da conta logada vs papel simulado
  const realRole = user?.realRole || user?.role || "aluno";
  const realRoleLabel = ROLE_DISPLAY_NAMES[realRole] || "Usuário";
  const activeRoleLabel = ROLE_DISPLAY_NAMES[user?.role] || role;

  return (
    <>
      <header className="dashboard-header bg-white shadow-sm d-flex align-items-center justify-content-between px-4 py-2 mb-3">
        <div className="d-flex align-items-center gap-3">
          <span className="fs-5 fw-bold text-dark">Painel de Controle</span>

          {/* Menu Suspenso de Alternância de Visão exclusivo para o Administrador */}
          {isRealAdmin && (
            <div className="position-relative">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-2 fw-semibold rounded-pill px-3"
                onClick={() => setDropdownAberto((prev) => !prev)}
                title="Alternar modo de visualização entre perfis"
              >
                <i className="bi bi-eye"></i>
                <span>Ver como: {activeRoleLabel}</span>
              </button>

              {dropdownAberto && (
                <ul
                  className="dropdown-menu show position-absolute shadow-sm border-0 rounded-3 mt-1 py-1"
                  style={{ minWidth: "220px", zIndex: 1050 }}
                >
                  <li className="dropdown-header small text-muted text-uppercase fw-bold">
                    Alternar Visualização
                  </li>
                  {ROLES_SIMULACAO.map((opcao) => (
                    <li key={opcao.value}>
                      <button
                        type="button"
                        className={`dropdown-item d-flex align-items-center gap-2 py-2 ${
                          (user?.role === opcao.value ||
                            (opcao.value === "bibliotecaria" &&
                              user?.role === "bibliotecario"))
                            ? "active fw-bold text-white bg-primary"
                            : ""
                        }`}
                        onClick={() => handleSelecionarPapel(opcao)}
                      >
                        <i className={`bi ${opcao.icon}`}></i>
                        <span>{opcao.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Identificação do Usuário Logado (Lado Direito Fixo) */}
        <div className="d-flex align-items-center ms-auto gap-3">
          <div className="text-end">
            <span className="fw-bold d-block text-dark lh-sm">{userName}</span>
            <small className="text-muted d-block text-capitalize">
              {realRoleLabel}
            </small>
          </div>

          <div className="user-avatar-container">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="rounded-circle border border-2 border-primary"
                style={{ width: "42px", height: "42px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold border border-2 border-primary-subtle"
                style={{ width: "42px", height: "42px", fontSize: "1.2rem" }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill px-3"
            onClick={handleLogout}
            title="Sair do sistema e voltar ao portal público"
          >
            <i className="bi bi-box-arrow-right me-1"></i> Sair
          </button>
        </div>
      </header>

      {/* Modal de Confirmação da Troca de Visualização */}
      {modalConfirmacaoAberto && perfilSelecionado && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1060 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-person-gear text-primary"></i>
                  Confirmar Troca de Visualização
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalConfirmacaoAberto(false)}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-secondary mb-2">
                  Você está prestes a alternar a visualização do painel para:
                </p>
                <div className="alert alert-primary-subtle border-primary-subtle py-2 px-3 fw-semibold text-primary rounded-3 d-flex align-items-center gap-2 mb-3">
                  <i className={`bi ${perfilSelecionado.icon} fs-5`}></i>
                  <span>{perfilSelecionado.label}</span>
                </div>
                <p className="small text-muted mb-0">
                  A página será recarregada para aplicar a barra lateral e as permissões de acesso deste perfil. Você poderá retornar à visão de Administrador a qualquer momento pelo mesmo menu.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => setModalConfirmacaoAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-semibold"
                  onClick={handleConfirmarTroca}
                >
                  <i className="bi bi-arrow-repeat me-1"></i> Confirmar e Recarregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
