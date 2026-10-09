import { Outlet } from "react-router";
import UsuarioAside from "../../components/Dashboard/navegacao-padrao/aside-padrao";
import EspecialistaAside from "../../components/Dashboard/navegacao-especialista/aside-especialista";
import Panel from "../../components/Dashboard/panel";
import Header from "../../components/Dashboard/Header";
import { useAuth } from "../../hooks/useAuth";

const DashboardLayout = () => {
	// Usuário logado vem do contexto de autenticação (AuthProvider)
	const { user, logout } = useAuth();
	const role = user?.role || "padrao";
	const isUsuario = role === "padrao";
	const Aside = isUsuario ? UsuarioAside : EspecialistaAside;
	const roleLabel = isUsuario ? "Usuário Padrão" : "Especialista";
	const userName = user?.name || "Usuário";

	return (
		<div className="dashboard-shell d-flex">
			<Aside />
			<div className="dashboard-content flex-grow-1 d-flex flex-column">
				<Header userName={userName} role={roleLabel} onLogout={logout} />
				<Panel>
					<Outlet />
				</Panel>
			</div>
		</div>
	);
};

export default DashboardLayout;
