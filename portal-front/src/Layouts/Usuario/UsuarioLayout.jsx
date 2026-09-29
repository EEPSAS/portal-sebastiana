import { Outlet } from "react-router";
import Aside from "../../components/Usuario/Aside";
import Header from "../../components/Usuario/Header";

const UsuarioLayout = () => (
  <div className="dashboard-shell">
    <Aside />
    <div className="dashboard-content">
      <Header />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  </div>
);

export default UsuarioLayout;