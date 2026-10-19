/**
 * PortalLayout.jsx - Moldura Estrutural das Páginas Públicas do Portal
 *
 * Papel Didático:
 * Mantém a barra de navegação superior (<Navbar />) e o rodapé (<Footer />) fixos
 * enquanto o React Router injeta a página pública ativa dentro do <Outlet />.
 */
import { Outlet } from "react-router";
import Footer from "../../components/Portal/Footer";
import Navbar from "../../components/Portal/Navbar";
// Import em minúsculo compatível com sistemas de arquivos case-sensitive (Linux/CI)
import "../../pages/Portal/portal.css";

const PortalLayout = () => (
  <div className="portal-scope">
    <Navbar />
    <main className="portal-main">
      {/* Renderiza a rota pública filha correspondente (Home, Noticia ou Login) */}
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PortalLayout;
