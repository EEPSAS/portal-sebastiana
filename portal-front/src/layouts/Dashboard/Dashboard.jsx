import { Outlet } from "react-router";
import Aside from "../../components/Dashboard/Aside";
import Header from "../../components/Dashboard/Header";

const DashboardLayout = () => (
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

export default DashboardLayout;
