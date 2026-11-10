/**
 * DashboardLayout.jsx - Layout Estrutural da Área Logada (Dashboard)
 *
 * Papel Didático:
 * Em aplicações React SPA, o Layout define a "moldura" fixa (Aside lateral + Header superior)
 * que não é recarregada ao navegar. O componente `<Outlet />` dentro do `<Panel />` renderiza
 * dinamicamente a página filha correspondente à rota ativa (ex: Geral, Boletim, Biblioteca).
 *
 * Integração:
 * O `<DonaNanaFloatingWidget />` é montado aqui de forma global para a área logada,
 * importado do módulo unificado `dona-nana`, ficando fixado no canto inferior direito.
 */

import { Outlet } from "react-router";
// Importações de componentes estruturais comuns do painel
import Aside from "../../components/Dashboard/common/Aside";
import Header from "../../components/Dashboard/common/Header";
import { DonaNanaFloatingWidget } from "../../components/Dashboard/dona-nana";
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
  const displayName = user?.nickname || user?.name || "Usuário";
  const userPhoto = user?.avatar || null;

  return (
    <div className="dashboard-shell d-flex vh-100 overflow-hidden bg-light">
      {/* Barra de Navegação Lateral Unificada */}
      <Aside />

      {/* Conteúdo Principal com Topbar e Painel Dinâmico */}
      <div className="dashboard-content flex-grow-1 d-flex flex-column">
        <Header
          userName={displayName}
          role={roleLabel}
          turma={user?.turma}
          userPhoto={userPhoto}
          onLogout={logout}
        />
        {/* Envelope semântico para a área de conteúdo dinâmico das páginas */}
        <section className="dashboard-panel flex-grow-1">
          <Outlet />
        </section>
      </div>

      {/* Balão Flutuante da Dona Nana no Canto Inferior Direito */}
      <DonaNanaFloatingWidget />
    </div>
  );
};

export default DashboardLayout;
