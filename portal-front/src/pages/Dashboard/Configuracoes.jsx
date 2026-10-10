/**
 * Configuracoes.jsx - Página de Perfil e Preferências
 *
 * Papel Didático:
 * Permite ao usuário editar suas informações de contato e preferências.
 * Direciona para o formulário de configurações adequado com base no perfil.
 */

import ConfigPadrao from "../../components/Dashboard/configuracoes/ConfigPadrao";
import ConfigEspecialista from "../../components/Dashboard/configuracoes/ConfigEspecialista";
import { useAuth } from "../../hooks/useAuth";

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";

  const isServidorEscolar =
    role === "professor" ||
    role === "especialista" ||
    role === "adm" ||
    role === "bibliotecario" ||
    role === "bibliotecaria";

  return isServidorEscolar ? <ConfigEspecialista /> : <ConfigPadrao />;
};

export default ConfiguracoesPage;
