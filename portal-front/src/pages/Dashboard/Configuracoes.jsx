/**
 * Configuracoes.jsx - Página Global de Configurações e Perfil do Usuário
 *
 * Papel Didático:
 * Rota `/dashboard/configuracoes`. Acesso universal para todos os perfis do sistema
 * (Aluno, Professor, Bibliotecária, Especialista e Administrador).
 * Permite a edição de dados pessoais, foto de perfil, preferências e segurança.
 */

import { useAuth } from "../../hooks/useAuth";
import BoasVindasCard from "../../components/Dashboard/common/BoasVindasCard";
import AvatarCard from "../../components/Dashboard/configuracoes/AvatarCard";
import DadosPessoaisCard from "../../components/Dashboard/configuracoes/DadosPessoaisCard";
import SegurancaCard from "../../components/Dashboard/configuracoes/SegurancaCard";
import "../../components/Dashboard/configuracoes/Configuracoes.css";

const ConfiguracoesPage = () => {
  const { user, updateUser } = useAuth();

  // Atualiza o estado global de autenticação e re-renderiza cabeçalho e layout
  const handleUserUpdated = (usuarioAtualizado) => {
    if (updateUser) {
      updateUser(usuarioAtualizado);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracoes-page container-fluid px-0">
      {/* Cabeçalho Institucional Padronizado */}
      <div className="bg-white rounded-3 shadow-sm p-2 px-md-3 py-md-2 mb-2">
        <BoasVindasCard />
      </div>

      {/* Grid de Cartões Modulares */}
      <div className="row g-3">
        {/* Coluna Lateral: Cartão de Foto de Perfil */}
        <div className="col-12 col-lg-4 col-xl-3">
          <AvatarCard user={user} onUserUpdated={handleUserUpdated} />
        </div>

        {/* Coluna Principal: Dados Pessoais e Segurança */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="d-flex flex-column gap-3">
            <DadosPessoaisCard user={user} onUserUpdated={handleUserUpdated} />
            <SegurancaCard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
