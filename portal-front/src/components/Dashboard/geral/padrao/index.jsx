import { useStudentStats } from '../../../../hooks/geral/padrao/useSmallCardsPadrao';
import { useAgenda } from '../../../../hooks/geral/padrao/useAgendaPadrao.js';
import StudentStatCard from './Cards/EstudanteEstatisticaCard.jsx';
import BoletimDetalhado from './Cards/BoletimDetalhadoCard.jsx';
import AgendaList from './Agenda/AgendaNotificacoesLista.jsx';

export function AgendaNotificacoes() {
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



const AlarmIcon = () => (
  <svg width="33.6" height="33.6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86zM7.88 3.39L6.59 1.86 2 5.72l1.29 1.53zM12 4a8 8 0 0 0-8 8v7h16v-7a8 8 0 0 0-8-8zm0 18a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2z"/>
  </svg>
);

export function StudentStatCards() {
  const { stats, loading, error, handleUpdateReading } = useStudentStats();

  if (loading) {
    return <div className="text-muted py-3">A carregar dados do estudante...</div>;
  }

  if (error) {
    return <div className="alert alert-danger py-2">Erro ao carregar os dados: {error}</div>;
  }

  return (
    <div className="row g-3">
      <StudentStatCard
        titulo="Frequência Geral"
        valor={`${stats?.frequenciaGeral?.porcentagem}%`}
        subtitulo={stats?.frequenciaGeral?.classificacao}
        porcentagemProgress={stats?.frequenciaGeral?.porcentagem}
        bgColor="#d6006e"
      />

      <StudentStatCard
        titulo="Média de Notas (Este Ano)"
        valor={stats?.mediaNotas?.valor}
        subtitulo={stats?.mediaNotas?.comparacao}
        bgColor="#007bff"
      />

      <StudentStatCard
        titulo="Leitura Atual"
        valor={stats?.leituraAtual?.livro}
        subtitulo={stats?.leituraAtual?.pagina}
        bgColor="#ff9800"
        isEditable={true}
        bookDetails={stats?.leituraAtual}
        onSave={handleUpdateReading}
      />

      <StudentStatCard
        titulo="Próxima Notificação"
        valor={stats?.proximaNotificacao?.titulo}
        subtitulo={stats?.proximaNotificacao?.tempoRestante}
        bgColor="#00bcd4"
        icone={<AlarmIcon />}
      />
    </div>
  );
}

const GeralPadrao = () => {
  return (
    <div className="pb-3">
      <h1 className="mb-3">Painel do Estudante</h1>
      <StudentStatCards />
      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-md-6 d-flex">
          <BoletimDetalhado />
        </div>
        <div className="col-12 col-md-6 d-flex">
          <AgendaNotificacoes />
        </div>
      </div>
    </div>
  );
};

export default GeralPadrao;
