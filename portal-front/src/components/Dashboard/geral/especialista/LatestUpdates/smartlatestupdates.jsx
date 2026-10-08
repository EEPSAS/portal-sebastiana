import { useUpdates } from '../../../../../hooks/geral/especialista/useLatestUpdatesEspecialista.js';
import UpdateItem from './dumblatestupdates.jsx';

export default function LatestUpdates() {
  const { updates, loading, error } = useUpdates();

  return (
    <div className="card border-0 shadow-sm rounded-3 p-4 mt-4 w-100">
      <h5 className="fw-bold mb-3 fs-6">Últimas Atualizações</h5>
      
      {loading && <div className="text-muted py-2">Carregando atualizações...</div>}
      
      {error && <div className="text-danger py-2">Erro ao carregar: {error}</div>}
      
      {!loading && !error && updates.length === 0 && (
        <div className="text-muted py-2">Nenhuma atualização recente.</div>
      )}

      {/* Container da lista sem borda no último elemento via CSS puro ou nth-child */}
      <div className="d-flex flex-column">
        {updates.map((update) => (
          <UpdateItem
            key={update.id}
            tipo={update.tipo}
            texto={update.texto}
            tempoAtras={update.tempoAtras}
          />
        ))}
      </div>
    </div>
  );
}