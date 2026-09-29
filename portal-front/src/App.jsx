import PortalLayout from "./Layouts/Portal/PortalLayout";
import UsuarioLayout from "./Layouts/Usuario/UsuarioLayout";
import EspecialistaLayout from "./Layouts/Especialista/EspecialistaLayout";
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./routes/Portal/Login";
import PublicHome from "./routes/Portal/Home";
import NoticiaPage from "./routes/Portal/Noticia";
import Home from "./routes/Usuario/Home";
import Agenda from "./routes/Usuario/Agenda";
import Biblioteca from "./routes/Usuario/Biblioteca";
import Calendario from "./routes/Usuario/Calendario";
import Configuracoes from "./routes/Usuario/Configuracoes";

const PageInDevelopment = ({ title }) => (
  <section>
    <h1>{title}</h1>
    <p>Conteúdo em desenvolvimento.</p>
  </section>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="login" element={<Login />} />
          <Route path="noticia/:id" element={<NoticiaPage />} />
        </Route>

        <Route path="usuario" element={<UsuarioLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="especialista" element={<EspecialistaLayout />}>
          <Route index element={<PageInDevelopment title="Início do especialista" />} />
          <Route path="home" element={<PageInDevelopment title="Início do especialista" />} />
          <Route path="noticias" element={<PageInDevelopment title="Notícias" />} />
          <Route path="biblioteca" element={<PageInDevelopment title="Biblioteca" />} />
          <Route path="turmas" element={<PageInDevelopment title="Turmas" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

