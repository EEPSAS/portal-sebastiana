import { Outlet } from "react-router";
import EspecialistaAside from "../../components/Especialista/aside";
import EspecialistaHeader from "../../components/Especialista/header";

const EspecialistaLayout = () => (
  <div className="dashboard-shell">
    <EspecialistaAside />
    <div className="dashboard-content">
      <EspecialistaHeader />
      <main className="dashboard-main px-4 pb-4">
        <Outlet />
      </main>
    </div>
  </div>
);

export default EspecialistaLayout;