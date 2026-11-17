/**
 * GeralAdm (index.jsx) - Painel Geral de Governança do Administrador
 *
 * Papel Didático:
 * Focado na gestão técnica do sistema, integridade dos cadastros e infraestrutura escolar:
 * 1. KPIs Superiores: Total de Usuários, Aprovações Pendentes, Contas Inativas e Sessões Ativas;
 * 2. Linha Intermediária: Distribuição de Contas por Perfil, Saúde do Sistema e Acessos Rápidos;
 * 3. Seção Inferior: Últimos Cadastros Realizados (com rolagem interna pura, travado na viewport).
 */

import "../especialista/GeralEspecialista.css";
import { useDashboardAdmin } from "../../../../hooks/geral/adm/useDashboardAdmin";
import UsuariosKpisCard from "./Cards/UsuariosKpisCard";
import DistribuicaoPerfisCard from "./Cards/DistribuicaoPerfisCard";
import SaudeSistemaCard from "./Cards/SaudeSistemaCard";
import AtalhosGestaoCard from "./Cards/AtalhosGestaoCard";
import CadastrosRecentesCard from "./Cards/CadastrosRecentesCard";

const GeralAdm = () => {
  const { dados, loading, error, recarregar } = useDashboardAdmin();

  if (loading && !dados) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" aria-hidden="true"></div>
        <p className="text-muted mt-2 small mb-0">
          Carregando indicadores de governança do sistema...
        </p>
      </div>
    );
  }

  if (error && !dados) {
    return (
      <div className="alert alert-danger rounded-4 shadow-sm p-4 text-center" role="alert">
        <i className="bi bi-exclamation-triangle-fill fs-3 text-danger d-block mb-2" aria-hidden="true"></i>
        <h5 className="fw-bold mb-1">Não foi possível carregar os dados administrativos</h5>
        <p className="text-secondary small mb-3">{error}</p>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm rounded-pill px-4"
          onClick={recarregar}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const usuarios = dados?.usuarios || {};
  const pendencias = dados?.pendencias || {};
  const sessoesAtivas = dados?.sessoes_ativas ?? 0;
  const cadastrosRecentes = dados?.cadastros_recentes || [];
  const saudeSistema = dados?.saude_sistema || [];

  return (
    <div className="geral-adm-page geral-page-viewport-lock">
      {error && (
        <div className="alert alert-danger rounded-3 py-2 flex-shrink-0" role="alert">
          Houve um erro ao atualizar os dados: {error}
        </div>
      )}

      {/* 1. Linha Superior: 4 Small Cards de KPIs de Governança */}
      <UsuariosKpisCard
        usuarios={usuarios}
        pendencias={pendencias}
        sessoesAtivas={sessoesAtivas}
      />

      {/* 2. Linha Intermediária: Distribuição por Perfil, Saúde e Atalhos */}
      <div className="row g-3 mb-2 flex-shrink-0">
        <div className="col-12 col-lg-4 d-flex flex-column">
          <DistribuicaoPerfisCard
            porPerfil={usuarios.por_perfil || {}}
            total={usuarios.total || 0}
          />
        </div>
        <div className="col-12 col-lg-4 d-flex flex-column">
          <SaudeSistemaCard saude={saudeSistema} />
        </div>
        <div className="col-12 col-lg-4 d-flex flex-column">
          <AtalhosGestaoCard />
        </div>
      </div>

      {/* 3. Linha Inferior: Últimos Cadastros preenchendo a altura com scroll interno */}
      <div className="geral-fill-row d-flex flex-column min-h-0">
        <CadastrosRecentesCard cadastros={cadastrosRecentes} />
      </div>
    </div>
  );
};

export default GeralAdm;
