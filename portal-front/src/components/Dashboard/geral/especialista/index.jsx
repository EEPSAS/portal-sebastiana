import "./GeralEspecialista.css";
import { useDashboardEspecialista } from "../../../../hooks/geral/especialista/useDashboardEspecialista.js";
import GeralSmallCards from "./Cards/EstatisticaDocenteCard.jsx";
import GeralMediumCards from "./Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "./LatestUpdates/UltimasAtualizacoes.jsx";

/**
 * GeralEspecialista (index.jsx) - Painel Analítico do Especialista Pedagógico
 *
 * Papel Didático:
 * Consome o hook unificado useDashboardEspecialista() para buscar os dados pedagógicos
 * reais entregues pelo backend e distribuí-los para os componentes filhos:
 * 1. GeralSmallCards (4 KPIs principais da gestão pedagógica);
 * 2. GeralMediumCards (Gráficos Recharts de Média de Notas e Taxa de Presença por Turma);
 * 3. LatestUpdates (Feed de últimas atualizações de notícias e notas).
 */
const GeralEspecialista = () => {
  const { cards, medias, frequencias, updates, loading, error } = useDashboardEspecialista();

  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando indicadores...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando estatísticas pedagógicas...</p>
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

  // 3. Estado Assíncrono: Vazio (sem indicadores nem turmas cadastradas)
  const semDadosGlobais =
    cards.length === 0 && medias.length === 0 && frequencias.length === 0 && updates.length === 0;

  if (semDadosGlobais) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        Nenhum indicador pedagógico disponível no momento.
      </div>
    );
  }

  return (
    <div className="geral-especialista-page">
      {/* Cabeçalho estilizado com tipografia imponente e traço decorativo como na referência */}
      <div className="mb-4">
        <h1 className="geral-header-title mb-1">{tituloPainel}</h1>
        <p className="geral-header-subtitle mb-2">
          Acompanhe os principais indicadores e o andamento da escola em tempo real.
        </p>
        <span className="geral-header-line" aria-hidden="true"></span>
      </div>

      {/* Linha superior: 4 Small Cards de KPIs pedagógicos */}
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

      {/* Linha intermediária: Gráficos Recharts de Médias e Frequências por Turma */}
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

export default GeralEspecialista;
