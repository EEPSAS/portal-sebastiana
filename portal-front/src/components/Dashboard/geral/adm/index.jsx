import "../especialista/GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "../especialista/Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "../especialista/LatestUpdates/UltimasAtualizacoes.jsx";

/**
 * GeralAdm (index.jsx) - Painel Analítico Geral do Administrador
 *
 * Papel Didático:
 * Renderiza a visão executiva e abrangente de toda a infraestrutura acadêmica escolar.
 * Trata os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio)
 * permitindo ao Administrador acompanhar indicadores globais em tempo real.
 */
const GeralAdm = () => {
  const { cards, medias, frequencias, updates, loading, error } = useDashboardEspecialista();

  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando indicadores...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando indicadores da escola...</p>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error) {
    return (
      <div className="alert alert-danger rounded-3 shadow-sm" role="alert">
        Não foi possível carregar os dados no momento: {error}
      </div>
    );
  }

  // 3. Estado Assíncrono: Vazio
  const semDadosGlobais =
    cards.length === 0 && medias.length === 0 && frequencias.length === 0 && updates.length === 0;

  if (semDadosGlobais) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        Nenhum indicador acadêmico consolidado disponível no momento.
      </div>
    );
  }

  return (
    <div className="geral-adm-page">
      {/* Linha superior: Small Cards de KPIs globais da instituição */}
      <div className="row g-3">
        {cards.map((card) => (
          <GeralSmallCards
            key={card.id}
            titulo={card.titulo}
            valor={card.valor}
            bgIcone={card.bgIcone}
            textIcone={card.textIcone}
            tipoIcone={card.tipoIcone}
          />
        ))}
      </div>

      {/* Linha intermediária: Gráficos de Médias e Frequências por Turma */}
      <GeralMediumCards
        medias={medias}
        frequencias={frequencias}
        loading={loading}
        error={error}
      />

      {/* Linha inferior: Feed de últimas atualizações escolares */}
      <LatestUpdates
        updates={updates}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default GeralAdm;
