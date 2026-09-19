import { Outlet } from "react-router";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

const PortalLayout = () => (
  <div className="portal-layout">
    <header className="portal-header">
      <Navbar />
    </header>
    <main className="portal-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PortalLayout;
