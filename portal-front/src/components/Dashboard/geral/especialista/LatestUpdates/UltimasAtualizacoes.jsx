import UpdateItem from "./UltimasAtualizacoesLista.jsx";

/**
 * UltimasAtualizacoes.jsx - Feed de Atividades Recentes do Painel Geral
 *
 * Papel Didático:
 * Recebe via props as atualizações já carregadas pelo componente pai (GeralEspecialista),
 * evitando chamadas HTTP redundantes e exibindo os 3 estados assíncronos (Carregando, Erro e Vazio).
 */
export default function LatestUpdates({ updates = [], loading = false, error = null }) {
  return (
    <div className="card border-0 shadow-sm rounded-3 p-4 mt-4 w-100">
      <h5 className="fw-bold mb-3 fs-6">Últimas Atualizações</h5>

      {/* 1. Estado Assíncrono: Carregando */}
      {loading && <div className="text-muted py-2">Carregando atualizações...</div>}

      {/* 2. Estado Assíncrono: Erro Amigável */}
      {error && <div className="text-danger py-2">Erro ao carregar: {error}</div>}

      {/* 3. Estado Assíncrono: Vazio */}
      {!loading && !error && updates.length === 0 && (
        <div className="text-muted py-2">Nenhuma atualização recente.</div>
      )}

      {/* Lista de eventos recentes (notícias publicadas e importações de notas) */}
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