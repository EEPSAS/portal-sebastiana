import { Outlet } from "react-router";
import AdminAside from "../../components/Administrador/aside";
import AdminHeader from "../../components/Administrador/header";

const AdminLayout = () => (
  <div className="dashboard-shell">
    <AdminAside />
    <div className="dashboard-content">
      <AdminHeader />
      <main className="dashboard-main px-4 pb-4">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
