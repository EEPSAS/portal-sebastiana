import { Outlet } from "react-router";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

const PortalLayout = () => (
  <>
    <header>
      <Navbar />
    </header>
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

export default PortalLayout;
