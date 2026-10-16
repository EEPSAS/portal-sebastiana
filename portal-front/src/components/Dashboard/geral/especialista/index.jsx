import { useDashboardStats } from "../../../../hooks/geral/especialista/useSmallCardsEspecialista.js";
import GeralSmallCards from "./Cards/EstatisticaDocenteCard.jsx";
import { useResumoTurmas } from "../../../../hooks/geral/especialista/useMediumCardsEspecialista.js";
import GeralMediumCards from "./Cards/ResumoTurmasCard.jsx";
import LatestUpdates from "./LatestUpdates/UltimasAtualizacoes.jsx";
import { useAuth } from "../../../../hooks/useAuth.js";

export function ResumoTurmas() {
  const { medias, frequencias, loading } = useResumoTurmas();

  return (
    <GeralMediumCards
      medias={medias}
      frequencias={frequencias}
      loading={loading}
    />
  );
}

const GeralEspecialista = () => {
  const { user } = useAuth();
  const { cards, loading, error } = useDashboardStats();

  // Define o cabeçalho dinamicamente conforme o papel (Professor vs Especialista/Adm)
  const tituloPainel =
    user?.role === "professor"
      ? "Painel Geral do Professor"
      : "Painel Geral do Especialista";

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando indicadores...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando estatísticas acadêmicas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-3 shadow-sm">
        Não foi possível carregar os dados no momento: {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="h3 fw-bold mb-4">{tituloPainel}</h1>
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
      <ResumoTurmas />
      <LatestUpdates />
    </div>
  );
};

export default GeralEspecialista;

