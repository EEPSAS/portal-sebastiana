import { useGeral } from "../../hooks/useGeral";
import GeralSmallCards from "../geralsmallcards";

const GeralEspecialista = () => {
  const { cards, loading, error } = useGeral();

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
    </div>
  );
};

export default GeralEspecialista;
