/**
 * Geral.jsx - Visão Geral do Painel de Controle (/dashboard/geral)
 *
 * Papel Didático:
 * Atua como roteador declarativo da tela principal de indicadores analíticos.
 * Em vez de encadear condicionais (if/else), despacha o componente específico
 * de cada role através do mapa GERAL_POR_ROLE:
 * - 'aluno': GeralPadrao (notas, frequência, cardápio, leitura atual)
 * - 'professor': GeralProfessor (turmas regidas e rendimento docente)
 * - 'bibliotecaria': GeralBibliotecario (circulação do acervo, destaques e devoluções)
 * - 'especialista': GeralEspecialista (gestão pedagógica, KPIs e atualizações)
 * - 'adm': GeralAdm (visão consolidada de toda a escola)
 */

import GeralPadrao from "../../components/Dashboard/geral/padrao";
import GeralProfessor from "../../components/Dashboard/geral/professor";
import GeralBibliotecario from "../../components/Dashboard/geral/bibliotecario";
import GeralEspecialista from "../../components/Dashboard/geral/especialista";
import GeralAdm from "../../components/Dashboard/geral/adm";
import BoasVindasCard from "../../components/Dashboard/geral/common/BoasVindasCard";
import { useAuth } from "../../hooks/useAuth";
import { normalizarRole } from "../../utils/rolesRoutes";

// Mapa declarativo ligando cada role ao seu componente de painel analítico
const GERAL_POR_ROLE = {
  aluno: GeralPadrao,
  professor: GeralProfessor,
  bibliotecaria: GeralBibliotecario,
  especialista: GeralEspecialista,
  adm: GeralAdm,
};

const GeralPage = () => {
  const { user } = useAuth();
  const role = normalizarRole(user?.role);

  // Seleciona o componente da role; fallback seguro para o perfil aluno
  const GeralDaRole = GERAL_POR_ROLE[role] ?? GeralPadrao;

  return (
    <>
      <BoasVindasCard />
      <GeralDaRole />
    </>
  );
};

export default GeralPage;
