import { Outlet } from "react-router";
import Footer from "../../components/Portal/Footer";
import Navbar from "../../components/Portal/Navbar";
// Import em minúsculo compatível com sistemas de arquivos case-sensitive (Linux/CI)
import "../../pages/Portal/portal.css";

const PortalLayout = () => (
  <div className="portal-scope">
    <Navbar />
    <main className="portal-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PortalLayout;

