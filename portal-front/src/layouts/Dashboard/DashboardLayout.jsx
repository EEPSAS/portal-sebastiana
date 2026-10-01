import { Outlet } from "react-router";
import UsuarioAside from "../../components/dashboard/navegacao-padrao/Aside";
import EspecialistaAside from "../../components/dashboard/navegacao-especialista/aside";
import Panel from "../../components/dashboard/panel";

const DashboardLayout = ({ role }) => {
	const isUsuario = role === "padrao";
	const Aside = isUsuario ? UsuarioAside : EspecialistaAside;

	return (
		<div className="dashboard-shell">
			<Aside />
			<div className="dashboard-content">
				<Panel>
					<Outlet />
				</Panel>
			</div>
		</div>
	);
};

export default DashboardLayout;
