/**
 * DashboardLayout.jsx - Layout Estrutural da Área Logada (Dashboard)
 *
 * Papel Didático:
 * Em aplicações React SPA, o Layout define a "moldura" fixa (Aside lateral + Header superior)
 * que não é recarregada ao navegar. O componente `<Outlet />` dentro do `<Panel />` renderiza
 * dinamicamente a página filha correspondente à rota ativa (ex: Geral, Boletim, Biblioteca).
 */

import { Outlet } from "react-router";
import Aside from "../../components/Dashboard/Aside";
import Panel from "../../components/Dashboard/Panel";
import Header from "../../components/Dashboard/Header";
import { useAuth } from "../../hooks/useAuth";

const ROLE_DISPLAY_NAMES = {
  aluno: "Aluno",
  padrao: "Aluno",
  professor: "Professor",
  bibliotecaria: "Bibliotecária",
  bibliotecario: "Bibliotecária",
  especialista: "Especialista",
  adm: "Administrador",
};

const DashboardLayout = () => {
  // Obtém o usuário e a função de logout fornecidas pelo AuthProvider
  const { user, logout } = useAuth();
  const role = user?.role || "aluno";
  const roleLabel = ROLE_DISPLAY_NAMES[role] || "Usuário";
  const userName = user?.name || "Usuário";

  return (
    <div className="dashboard-shell d-flex min-vh-100 bg-light">
      {/* Barra de Navegação Lateral Unificada */}
      <Aside />

      {/* Conteúdo Principal com Topbar e Painel Dinâmico */}
      <div className="dashboard-content flex-grow-1 d-flex flex-column">
        <Header userName={userName} role={roleLabel} onLogout={logout} />
        <Panel>
          <Outlet />
        </Panel>
      </div>
    </div>
  );
};

export default DashboardLayout;
