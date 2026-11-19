/**
 * PortalLayout.jsx - Moldura Estrutural das Páginas Públicas do Portal
 *
 * Papel Didático:
 * Mantém a barra de navegação superior (<Navbar />) e o rodapé (<Footer />) fixos
 * enquanto o React Router injeta a página pública ativa dentro do <Outlet />.
 * Na rota "/login", o rodapé é omitido para manter o foco exclusivo na autenticação.
 */
import { Outlet, useLocation } from "react-router";
import Footer from "../../components/Portal/Footer";
import Navbar from "../../components/Portal/Navbar";
import ScrollToTopButton from "../../components/Portal/ScrollToTopButton";
// Import em minúsculo compatível com sistemas de arquivos case-sensitive (Linux/CI)
import "../../pages/Portal/portal.css";

const PortalLayout = () => {
  // Identifica a rota atual para ocultar o rodapé na tela de login
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";

  return (
    <div className="portal-scope">
      <Navbar />
      <main className="portal-main">
        {/* Renderiza a rota pública filha correspondente (Home, Noticia ou Login) */}
        <Outlet />
      </main>
      {/* Oculta o Footer exclusivamente na página de login para evitar distrações visuais */}
      {!isLoginRoute && <Footer />}
      {/* Botão flutuante para retorno ao topo/hero nas páginas públicas longas */}
      {!isLoginRoute && <ScrollToTopButton />}
    </div>
  );
};

export default PortalLayout;
