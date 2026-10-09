import { Navigate } from "react-router";
import Boletim from "../../components/Dashboard/boletim";
import { useAuth } from "../../hooks/useAuth";

const BoletimPage = () => {
  const { user } = useAuth();
  const role = user?.role || "padrao";
  const isEspecialista = role === "especialista" || role === "adm";

  if (isEspecialista) {
    return <Navigate to="/dashboard/geral" replace />;
  }

  return <Boletim />;
};

export default BoletimPage;
