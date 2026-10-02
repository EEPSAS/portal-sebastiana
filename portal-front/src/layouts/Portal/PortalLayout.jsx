import { Outlet } from "react-router";
import Footer from "../../components/Portal/Footer";
import Navbar from "../../components/Portal/Navbar";

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
