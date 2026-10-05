import { useDashboardStats } from "../../../../hooks/Geral/useGeralSmallCards.js";
import GeralSmallCards from "./geralsmallcards.jsx";
import { useResumoTurmas } from '../../../../hooks/Geral/useGeralMediumCards.js';
import GeralMediumCards from './geralmediumcards.jsx';
import LatestUpdates from './LatestUpdates/latestupdatessmart.jsx';


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
  const { cards, loading, error } = useDashboardStats();

  if (loading) {
    return <div className="text-center py-4">A carregar estatísticas...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Ocorreu um erro: {error}</div>;
  }

  return (
    <div>
      <h1>Geral Especialista</h1>
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
