import { BrowserRouter, Route, Routes } from "react-router";
import PortalLayout from "./layouts/Portal/PortalLayout";
import DashboardLayout from "./layouts/Dashboard/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import PublicHome from "./pages/Portal/Home";
import NoticiaPage from "./pages/Portal/Noticia";
import Login from "./pages/Portal/Login";

import GeralPage from "./pages/Dashboard/Geral";
import BoletimPage from "./pages/Dashboard/Boletim";
import BibliotecaPage from "./pages/Dashboard/Biblioteca";
import TurmaPage from "./pages/Dashboard/Turma";
import AgendaPage from "./pages/Dashboard/Agenda";
import ConfiguracoesPage from "./pages/Dashboard/Configuracoes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Área Pública do Portal */}
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="noticia/:id" element={<NoticiaPage />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* Área Logada do Dashboard */}
        <Route path="dashboard" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<GeralPage />} />
            <Route path="geral" element={<GeralPage />} />
            <Route path="boletim" element={<BoletimPage />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="turmas" element={<TurmaPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

