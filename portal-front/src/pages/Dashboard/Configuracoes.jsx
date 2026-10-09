import ConfigPadrao from "../../components/Dashboard/configuracoes/configpadrao";
import ConfigEspecialista from "../../components/Dashboard/configuracoes/configespecialista";
import { useAuth } from "../../hooks/useAuth";

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const role = user?.role || "padrao";
  const isEspecialista = role === "especialista" || role === "adm";

  return isEspecialista ? <ConfigEspecialista /> : <ConfigPadrao />;
};

export default ConfiguracoesPage;
