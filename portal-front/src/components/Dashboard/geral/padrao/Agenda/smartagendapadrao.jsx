import { useAgenda } from '../../../../../hooks/geral/padrao/useAgendaPadrao.js';
import AgendaList from './dumbagendapadrao.jsx';

export default function AgendaNotificacoes() {
  const { agendaItens, loading, error } = useAgenda();

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 w-100 text-center text-muted">
        A carregar agenda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-4">
        Erro ao carregar notificações: {error}
      </div>
    );
  }

  if (!agendaItens || agendaItens.length === 0) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 w-100 text-center text-muted">
        Sem notificações recentes.
      </div>
    );
  }

  return <AgendaList itens={agendaItens} />;
}