import GeralPadrao from "../../components/Dashboard/geral/padrao";
import GeralEspecialista from "../../components/Dashboard/geral/especialista";
import { useAuth } from "../../hooks/useAuth";

const GeralPage = () => {
  const { user } = useAuth();
  const role = user?.role || "padrao";
  const isEspecialista = role === "especialista" || role === "adm";

  return isEspecialista ? <GeralEspecialista /> : <GeralPadrao />;
};

export default GeralPage;
