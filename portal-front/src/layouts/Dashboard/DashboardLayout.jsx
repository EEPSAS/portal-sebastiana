import { Outlet } from "react-router";
import UsuarioAside from "../../components/Dashboard/navegacao-padrao/aside-padrao";
import EspecialistaAside from "../../components/Dashboard/navegacao-especialista/aside-especialista";
import Panel from "../../components/Dashboard/panel";
import Header from "../../components/Dashboard/Header";

const DashboardLayout = ({ role = "padrao", userName = "Maria Silva", userPhoto }) => {
	const isUsuario = role === "padrao";
	const Aside = isUsuario ? UsuarioAside : EspecialistaAside;
	const roleLabel = isUsuario ? "Usuário Padrão" : "Especialista";

	return (
		<div className="dashboard-shell d-flex">
			<Aside />
			<div className="dashboard-content flex-grow-1 d-flex flex-column">
				<Header userName={userName} role={roleLabel} userPhoto={userPhoto} />
				<Panel>
					<Outlet />
				</Panel>
			</div>
		</div>
	);
};

export default DashboardLayout;
