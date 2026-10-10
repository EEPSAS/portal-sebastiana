/**
 * Aside.jsx - Barra Lateral de Navegação do Painel (Dashboard)
 *
 * Papel Didático:
 * Centraliza a navegação de todas as roles de usuário em um único componente declarativo.
 * Em vez de criar múltiplos arquivos com código repetido (ex: AsideAluno, AsideProfessor),
 * definimos uma matriz de rotas (NAV_ITEMS) onde cada item lista quais perfis têm acesso.
 * O componente filtra os links com base no perfil ativo do usuário (`user?.role`).
 *
 * Diretrizes Visuais:
 * - O badge colorido do perfil no topo do Aside é visível exclusivamente para o Administrador.
 *   As demais roles acompanham sua identificação diretamente pelo cabeçalho superior (Navbar).
 * - Suporta identicamente as denominações 'bibliotecaria' e 'bibliotecario'.
 */

import { NavLink, Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";

/**
 * Matriz declarativa de navegação do Dashboard.
 * Permissões:
 * - Geral: aluno, professor, especialista, adm
 * - Boletim: aluno, adm
 * - Biblioteca: aluno, professor, bibliotecaria, bibliotecario, especialista, adm
 * - Turmas: professor, especialista, adm
 * - Agenda: aluno, professor, bibliotecaria, bibliotecario, especialista, adm
 * - Notícias: especialista, adm
 */
const NAV_ITEMS = [
  {
    label: "Geral",
    path: "/dashboard/geral",
    icon: "bi-house-door-fill",
    roles: ["aluno", "professor", "especialista", "adm", "padrao"],
  },
  {
    label: "Boletim",
    path: "/dashboard/boletim",
    icon: "bi-journal-check",
    roles: ["aluno", "adm", "padrao"],
  },
  {
    label: "Biblioteca",
    path: "/dashboard/biblioteca",
    icon: "bi-book",
    roles: [
      "aluno",
      "professor",
      "bibliotecaria",
      "bibliotecario",
      "especialista",
      "adm",
      "padrao",
    ],
  },
  {
    label: "Turmas",
    path: "/dashboard/turmas",
    icon: "bi-people-fill",
    roles: ["professor", "especialista", "adm"],
  },
  {
    label: "Agenda",
    path: "/dashboard/agenda",
    icon: "bi-calendar-event",
    roles: [
      "aluno",
      "professor",
      "bibliotecaria",
      "bibliotecario",
      "especialista",
      "adm",
      "padrao",
    ],
  },
  {
    label: "Notícias",
    path: "/dashboard/noticias",
    icon: "bi-newspaper",
    roles: ["especialista", "adm"],
  },
];

// Mapeamento amigável do identificador de role para exibição na interface
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
 * Função de estilo do NavLink.
 * O NavLink do React Router fornece a propriedade booleana `isActive`,
 * permitindo destacar visualmente qual página o usuário está navegando.
 */
const getLinkClass = ({ isActive }) =>
  `nav-link d-flex align-items-center fw-semibold ${
    isActive ? "active text-white" : "link-dark"
  }`;

const Aside = () => {
  const { user } = useAuth();
  const userRole = user?.role || "aluno";
  const badgeInfo = ROLE_BADGES[userRole] || { label: "Usuário", cor: "bg-secondary" };

  // O badge colorido é exibido no topo do Aside apenas se o usuário for Administrador
  const isAdmin = userRole === "adm" || user?.realRole === "adm";

  // Filtra apenas os itens de menu permitidos para o perfil ativo
  const itensPermitidos = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm"
      style={{ width: "260px", minHeight: "100vh" }}
    >
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

      {/* Lista Principal de Navegação */}
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {itensPermitidos.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink to={item.path} className={getLinkClass}>
              <i className={`bi ${item.icon} me-3 fs-5`}></i>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <hr className="my-2" />

      {/* Seção Inferior Fixa: Configurações */}
      <ul className="nav nav-pills flex-column gap-2 mb-2">
        <li className="nav-item">
          <NavLink to="/dashboard/configuracoes" className={getLinkClass}>
            <i className="bi bi-gear me-3 fs-5"></i>
            <span>Configurações</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Aside;
