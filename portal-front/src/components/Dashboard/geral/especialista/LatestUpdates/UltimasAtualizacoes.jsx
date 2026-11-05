import UpdateItem from "./UltimasAtualizacoesLista.jsx";

/**
 * UltimasAtualizacoes.jsx - Feed de Atividades Recentes do Painel Geral
 *
 * Papel Didático:
 * Apresenta as cinco notificações mais recentes com ícones e cronologia relativa.
 */
export default function LatestUpdates({ updates = [], loading = false, error = null }) {
  return (
    <div className="geral-updates-card mt-2 w-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="geral-updates-title mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bell-fill text-primary fs-5"></i>
          <span>Últimas Notificações</span>
        </h5>
        <span className="text-muted small">5 mais recentes</span>
      </div>

      {/* 1. Estado Assíncrono: Carregando */}
      {loading && <div className="text-muted py-3 text-center">Carregando atualizações...</div>}

      {/* 2. Estado Assíncrono: Erro Amigável */}
      {error && <div className="text-danger py-2">Erro ao carregar: {error}</div>}

      {/* 3. Estado Assíncrono: Vazio */}
      {!loading && !error && updates.length === 0 && (
        <div className="text-muted py-3 text-center">Nenhuma atualização recente no momento.</div>
      )}

      {/* Cada linha representa um evento único, ainda que tenha vários destinatários. */}
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