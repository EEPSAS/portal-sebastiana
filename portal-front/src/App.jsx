/**
 * App.jsx - Declaração Central de Rotas do Portal Sebastiana
 *
 * Conceito Didático (React Router v7/v8):
 * 1. SPA (Single Page Application): As rotas trocam os componentes na tela sem que o navegador
 *    recarregue a página do zero, mantendo o estado da aplicação e proporcionando agilidade.
 * 2. Layouts Aninhados: `<Route element={<PortalLayout />}>` e `<Route element={<DashboardLayout />}>`
 *    encapsulam as rotas filhas correspondentes, mantendo cabeçalhos e barras laterais persistentes.
 * 3. Rotas Protegidas e RBAC (Role-Based Access Control): Usamos `<ProtectedRoute allowedRoles={[...]} />`
 *    para assegurar que apenas usuários logados com perfis autorizados acessem páginas específicas.
 */

import { BrowserRouter, Route, Routes } from "react-router";
import PortalLayout from "./layouts/Portal/PortalLayout";
import DashboardLayout from "./layouts/Dashboard/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas Públicas do Portal
import PublicHome from "./pages/Portal/Home";
import NoticiaPage from "./pages/Portal/Noticia";
import Login from "./pages/Portal/Login";
import NotFound from "./pages/NotFound";

// Páginas da Área Logada (Dashboard)
import DashboardIndexRedirect from "./components/Dashboard/DashboardIndexRedirect";
import GeralPage from "./pages/Dashboard/Geral";
import BoletimPage from "./pages/Dashboard/Boletim";
import BibliotecaPage from "./pages/Dashboard/Biblioteca";
import TurmaPage from "./pages/Dashboard/Turma";
import AgendaPage from "./pages/Dashboard/Agenda";
import NoticiasAdminPage from "./pages/Dashboard/Noticias";
import ConfiguracoesPage from "./pages/Dashboard/Configuracoes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================================================== */}
        {/* 1. Área Pública do Portal Escolar                        */}
        {/* ======================================================== */}
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<PublicHome />} />
          {/* Suporta tanto /noticias/:id (convenção plural) quanto /noticia/:id (legado) */}
          <Route path="noticias/:id" element={<NoticiaPage />} />
          <Route path="noticia/:id" element={<NoticiaPage />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* ======================================================== */}
        {/* 2. Área Privada do Painel de Controle (Dashboard)         */}
        {/* ======================================================== */}
        <Route path="dashboard" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Redirecionamento inicial baseado no perfil do usuário */}
            <Route index element={<DashboardIndexRedirect />} />

            {/* Rotas de acesso comum para usuários do painel */}
            <Route path="geral" element={<GeralPage />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />

            {/* Rota restrita: Boletim (alunos e administradores) */}
            <Route element={<ProtectedRoute allowedRoles={["aluno", "adm", "padrao"]} />}>
              <Route path="boletim" element={<BoletimPage />} />
            </Route>

            {/* Rota restrita: Turmas (professores, especialistas e administradores) */}
            <Route element={<ProtectedRoute allowedRoles={["professor", "especialista", "adm"]} />}>
              <Route path="turmas" element={<TurmaPage />} />
            </Route>

            {/* Rota restrita: Gestão de Notícias (especialistas e administradores) */}
            <Route element={<ProtectedRoute allowedRoles={["especialista", "adm"]} />}>
              <Route path="noticias" element={<NoticiasAdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* ======================================================== */}
        {/* 3. Rota de Fallback (Página 404)                          */}
        {/* ======================================================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
