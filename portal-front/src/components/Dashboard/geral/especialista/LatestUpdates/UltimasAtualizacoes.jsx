import UpdateItem from "./UltimasAtualizacoesLista.jsx";

/**
 * UltimasAtualizacoes.jsx - Feed de Atividades Recentes do Painel Geral
 *
 * Papel Didático:
 * Recebe via props as atualizações já carregadas pelo componente pai (GeralEspecialista),
 * evitando chamadas HTTP redundantes e exibindo os 3 estados assíncronos (Carregando, Erro e Vazio).
 */
export default function LatestUpdates({ updates = [], loading = false, error = null }) {
  // Obtém o horário mais recente para exibição no cabeçalho ou fallback
  const horarioRecente = updates[0]?.tempoAtras || "tempo real";

  return (
    <div className="geral-updates-card mt-4 w-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bell text-primary"></i>
          <span>Últimas Atualizações</span>
        </h5>
        <span className="small text-muted">{horarioRecente}</span>
      </div>

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