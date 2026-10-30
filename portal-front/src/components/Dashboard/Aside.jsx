/**
 * Aside.jsx - Barra Lateral de Navegação Retrátil por Módulos do Painel (Dashboard)
 *
 * Papel Didático:
 * Centraliza a navegação de todas as roles de usuário em uma estrutura hierárquica retrátil
 * (acordeão), agrupando os módulos conforme as diretrizes arquiteturais:
 * - Geral (/dashboard/geral)
 * - Acadêmico: Turmas, Boletim, Professores e Disciplinas
 * - Agenda: Calendário, Sábados Letivos, Feriados e Recessos e Horário Escolar
 * - Conteúdo: Biblioteca, Vídeo Aula, Busca Web e Plano de Estudos
 * - Notícias (/dashboard/noticias)
 * - Usuários (/dashboard/usuarios - exclusivo para Admin)
 * - Rodapé fixo: Dona Nana e Configurações
 *
 * Diretrizes Visuais e Semânticas:
 * - Cada grupo retrátil usa <button type="button" aria-expanded={...}> acessível por teclado.
 * - O item ou subitem ativo recebe destaque de cor (.dashboard-aside-link-active) e uma seta
 *   indicadora (bi-caret-left-fill).
 * - Exibe contadores numéricos (badges) de aprovações pendentes de Alunos e Professores.
 */

import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { listarProfessores } from "../../services/professoresService";
import { obterPendentesResumo } from "../../services/usuarioService";
import { NAV_STRUCTURE, isChildActive } from "../../utils/dashboardNav";

const ROLE_BADGES = {
  aluno: { label: "Aluno", cor: "bg-primary" },
  padrao: { label: "Aluno", cor: "bg-primary" },
  professor: { label: "Professor", cor: "bg-success" },
  bibliotecaria: { label: "Bibliotecária", cor: "bg-info text-dark" },
  bibliotecario: { label: "Bibliotecária", cor: "bg-info text-dark" },
  especialista: { label: "Especialista", cor: "bg-warning text-dark" },
  adm: { label: "Administrador", cor: "bg-danger" },
};

/**
 * Avalia se um item ou subitem de menu está ativo considerando pathname e query string (?tab=...).
 */
const Aside = () => {
  const { user } = useAuth();
  const location = useLocation();
  const userRole = user?.role || "aluno";
  const badgeInfo = ROLE_BADGES[userRole] || { label: "Usuário", cor: "bg-secondary" };
  const isAdmin = userRole === "adm" || user?.realRole === "adm";
  const podeGerenciarAprovacoes = userRole === "especialista" || userRole === "adm";

  const [pendentesResumo, setPendentesResumo] = useState({
    alunosPendentes: 0,
    professoresPendentes: 0,
    totalPendentes: 0,
  });

  // Estado explícito de grupos abertos/fechados manualmente pelo usuário no acordeão
  const [openGroups, setOpenGroups] = useState({});

  // Busca contagens de aprovações pendentes (alunos e professores) para Especialista e Adm
  useEffect(() => {
    if (!podeGerenciarAprovacoes) return;

    let ativo = true;

    obterPendentesResumo()
      .then((res) => {
        if (!ativo) return;
        const dados = res?.data || res || {};
        setPendentesResumo({
          alunosPendentes: Number(dados.alunos_pendentes ?? 0),
          professoresPendentes: Number(dados.professores_pendentes ?? 0),
          totalPendentes: Number(dados.total_pendentes ?? 0),
        });
      })
      .catch(() => {
        // Fallback para contagem de professores caso o endpoint resumido falhe
        listarProfessores()
          .then((res) => {
            if (ativo && res?.meta?.pendentes_count !== undefined) {
              const profs = Number(res.meta.pendentes_count);
              setPendentesResumo((atual) => ({
                ...atual,
                professoresPendentes: profs,
                totalPendentes: atual.alunosPendentes + profs,
              }));
            }
          })
          .catch(() => {});
      });

    return () => {
      ativo = false;
    };
  }, [podeGerenciarAprovacoes, location.pathname]);

  const toggleGroup = (groupId, currentOpen) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !currentOpen,
    }));
  };

  const obterBadgeCount = (badgeKey) => {
    if (!badgeKey) return 0;
    // Aprovação de alunos pendentes é de responsabilidade única do Especialista/Adm
    if (badgeKey === "alunosPendentes" && userRole === "professor") return 0;
    return pendentesResumo[badgeKey] || 0;
  };

  // Filtra a árvore de navegação mantendo apenas itens e grupos acessíveis ao perfil ativo
  const estruturaFiltrada = NAV_STRUCTURE.reduce((acc, entry) => {
    if (entry.type === "item") {
      if (entry.roles.includes(userRole)) {
        acc.push(entry);
      }
      return acc;
    }

    if (entry.type === "group") {
      const filhosPermitidos = entry.children.filter((child) =>
        child.roles.includes(userRole)
      );
      if (filhosPermitidos.length > 0) {
        acc.push({ ...entry, children: filhosPermitidos });
      }
    }

    return acc;
  }, []);

  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm">
      {/* Cabeçalho do Aside: Logotipo e Badge exclusivo do Admin */}
      <Link
        to="/dashboard"
        className="d-flex flex-column align-items-center mb-3 text-decoration-none text-center"
      >
        <span className="fs-4 fw-bold text-primary">EEPSAS</span>
        <span className="fs-6 text-muted fw-semibold">Portal Escolar</span>
        {isAdmin && (
          <span className={`badge ${badgeInfo.cor} mt-2 px-3 py-1 rounded-pill`}>
            {badgeInfo.label}
          </span>
        )}
      </Link>

      <hr className="my-2" />

      {/* Lista Principal de Navegação Retrátil por Módulos */}
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {estruturaFiltrada.map((entry) => {
          if (entry.type === "item") {
            const ativo = isChildActive(entry, location);
            const badgeCount = obterBadgeCount(entry.badgeKey);

            return (
              <li className="nav-item" key={entry.id}>
                <Link
                  to={entry.path}
                  className={`nav-link d-flex align-items-center justify-content-between fw-semibold ${
                    ativo ? "active dashboard-aside-link-active text-white" : "link-dark"
                  }`}
                >
                  <div className="d-flex align-items-center">
                    <i className={`bi ${entry.icon} me-3 fs-5`}></i>
                    <span>{entry.label}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {badgeCount > 0 && (
                      <span className="badge rounded-pill bg-danger">
                        {badgeCount}
                      </span>
                    )}
                    {ativo && (
                      <i
                        className="bi bi-caret-left-fill dashboard-aside-active-arrow"
                        aria-hidden="true"
                      ></i>
                    )}
                  </div>
                </Link>
              </li>
            );
          }

          // Renderização de grupo retrátil (Acadêmico, Agenda, Conteúdo)
          const groupHasActiveChild = entry.children.some((child) =>
            isChildActive(child, location)
          );
          const isOpen =
            openGroups[entry.id] !== undefined
              ? Boolean(openGroups[entry.id])
              : groupHasActiveChild || entry.id === "academico";
          const groupBadgeTotal = entry.children.reduce(
            (soma, child) => soma + obterBadgeCount(child.badgeKey),
            0
          );

          return (
            <li className="nav-item" key={entry.id}>
              <button
                type="button"
                onClick={() => toggleGroup(entry.id, isOpen)}
                aria-expanded={isOpen}
                className={`dashboard-aside-group-btn d-flex align-items-center justify-content-between fw-semibold ${
                  groupHasActiveChild ? "is-group-active" : ""
                }`}
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${entry.icon} me-3 fs-5`}></i>
                  <span>{entry.label}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {groupBadgeTotal > 0 && (
                    <span className="badge rounded-pill bg-danger">
                      {groupBadgeTotal}
                    </span>
                  )}
                  <i
                    className={`bi ${
                      isOpen ? "bi-chevron-down" : "bi-chevron-right"
                    } small`}
                    aria-hidden="true"
                  ></i>
                </div>
              </button>

              {isOpen && (
                <ul className="dashboard-aside-subnav">
                  {entry.children.map((child) => {
                    const subAtivo = isChildActive(child, location);
                    const subBadge = obterBadgeCount(child.badgeKey);
                    // Rótulo específico para o professor: 'Minhas Turmas'
                    const rotuloExibido =
                      child.id === "turmas" && userRole === "professor"
                        ? "Minhas Turmas"
                        : child.label;

                    return (
                      <li key={child.id} className="my-1">
                        <Link
                          to={child.path}
                          className={`dashboard-aside-sublink ${
                            subAtivo ? "dashboard-aside-link-active" : ""
                          }`}
                        >
                          <div className="d-flex align-items-center text-truncate me-1" style={{ minWidth: 0 }}>
                            <i className={`bi ${child.icon} me-2 flex-shrink-0`}></i>
                            <span className="text-truncate">{rotuloExibido}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            {subBadge > 0 && (
                              <span className="badge rounded-pill bg-danger">
                                {subBadge}
                              </span>
                            )}
                            {subAtivo && (
                              <i
                                className="bi bi-caret-left-fill dashboard-aside-active-arrow"
                                aria-hidden="true"
                              ></i>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <hr className="my-2" />

      {/* Seção Inferior Fixa: Dona Nana (acima de Configurações) e Configurações */}
      <ul className="nav nav-pills flex-column gap-2 mb-2">
        <li className="nav-item">
          <NavLink
            to="/dashboard/dona-nana"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center justify-content-between fw-semibold ${
                isActive ? "active dashboard-aside-link-active text-white" : "link-dark"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="d-flex align-items-center">
                  <i className="bi bi-chat-heart-fill me-3 fs-5 text-warning"></i>
                  <span>Dona Nana</span>
                </div>
                {isActive && (
                  <i
                    className="bi bi-caret-left-fill dashboard-aside-active-arrow"
                    aria-hidden="true"
                  ></i>
                )}
              </>
            )}
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/dashboard/configuracoes"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center justify-content-between fw-semibold ${
                isActive ? "active dashboard-aside-link-active text-white" : "link-dark"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="d-flex align-items-center">
                  <i className="bi bi-gear me-3 fs-5"></i>
                  <span>Configurações</span>
                </div>
                {isActive && (
                  <i
                    className="bi bi-caret-left-fill dashboard-aside-active-arrow"
                    aria-hidden="true"
                  ></i>
                )}
              </>
            )}
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Aside;
