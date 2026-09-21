import PortalLayout from "./layouts/Portal/PortalLayout";
import DashboardLayout from "./layouts/Dashboard/Dashboard";
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./routes/Portal/Login";
import PublicHome from "./routes/Portal/Home";
import NoticiaPage from "./routes/Portal/Noticia";
import Home from "./routes/Dashboard/Home";
import Agenda from "./routes/Dashboard/Agenda";
import Biblioteca from "./routes/Dashboard/Biblioteca";
import Calendario from "./routes/Dashboard/Calendario";
import Configuracoes from "./routes/Dashboard/Configuracoes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="login" element={<Login />} />
          <Route path="noticia/:id" element={<NoticiaPage />} />
        </Route>

        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
