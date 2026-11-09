/**
 * Wiki.jsx - Página de Manuais e Base de Conhecimento do Dashboard
 *
 * Papel Didático:
 * Rota protegida `/dashboard/wiki`. Acessível por todos os perfis do sistema
 * (Aluno, Professor, Bibliotecária, Especialista e Administrador).
 * Apresenta o cabeçalho contextual do módulo e o orquestrador interativo da Wiki.
 */

import { useAuth } from "../../hooks/useAuth";
import BoasVindasCard from "../../components/Dashboard/common/BoasVindasCard";
import WikiContainer from "../../components/Dashboard/wiki/WikiContainer";

export default function WikiDashboardPage() {
  const { user } = useAuth();
  const userRole = user?.role || "aluno";

  return (
    <div className="container-fluid px-0">
      {/* Cabeçalho Padronizado do Módulo */}
      <div className="bg-white rounded-3 shadow-sm p-2 px-md-3 py-md-2 mb-3">
        <BoasVindasCard />
      </div>

      {/* Conteúdo Interativo da Wiki */}
      <WikiContainer roleUsuario={userRole} modoPublico={false} />
    </div>
  );
}
