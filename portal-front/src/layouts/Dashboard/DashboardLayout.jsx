import { Navigate, Outlet, useNavigate } from 'react-router';
import { useState } from 'react';
import UsuarioAside from "../../components/Dashboard/navegacao-padrao/aside-padrao";
import EspecialistaAside from "../../components/Dashboard/navegacao-especialista/aside-especialista";
import Panel from "../../components/Dashboard/panel";
import Header from "../../components/Dashboard/Header";
import { getAuthSession, logout } from '../../services/authService';

const roleLabels = {
	padrao: 'Usuário Padrão',
	especialista: 'Especialista',
	adm: 'Administrador',
};

const DashboardLayout = () => {
	const [session, setSession] = useState(getAuthSession);
	const navigate = useNavigate();
	const isUsuario = session?.user?.role === "padrao";
	const Aside = isUsuario ? UsuarioAside : EspecialistaAside;
	const userRole = session?.user?.role;

	const handleLogout = async () => {
		try {
			await logout();
		} catch {
			return;
		} finally {
			setSession(null);
			navigate('/login', { replace: true });
		}
	};

	if (!session) {
		return <Navigate to="/login" replace />;
	}

	return (
		<div className="dashboard-shell d-flex">
			<Aside onLogout={handleLogout} />
			<div className="dashboard-content flex-grow-1 d-flex flex-column">
				<Header userName={session.user.name} role={roleLabels[userRole] || userRole} />
				<Panel>
					<Outlet />
				</Panel>
			</div>
		</div>
	);
};

export default DashboardLayout;
