import { useStudentStats } from '../../../../../hooks/geral/padrao/useSmallCardsPadrao';
import StudentStatCard from './dumbsmallcardspadrao.jsx';

// Ícone do Alarme para o 4º Card
const AlarmIcon = () => (
  <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86zM7.88 3.39L6.59 1.86 2 5.72l1.29 1.53zM12 4a8 8 0 0 0-8 8v7h16v-7a8 8 0 0 0-8-8zm0 18a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2z"/>
  </svg>
);

export default function StudentStatCards() {
  const { stats, loading, error, handleUpdateReading } = useStudentStats();

  if (loading) {
    return <div className="text-muted py-3">A carregar dados do estudante...</div>;
  }

  if (error) {
    return <div className="alert alert-danger py-2">Erro ao carregar os dados: {error}</div>;
  }

  return (
    <div className="row g-3">
      {/* 1. Frequência Geral (com Progresso Circular Dinâmico) */}
      <StudentStatCard
        titulo="Frequência Geral"
        valor={`${stats?.frequenciaGeral?.porcentagem}%`}
        subtitulo={stats?.frequenciaGeral?.classificacao}
        porcentagemProgress={stats?.frequenciaGeral?.porcentagem}
        bgColor="#d6006e" // Rosa/Magenta
      />

      {/* 2. Média de Notas (Este Ano) */}
      <StudentStatCard
        titulo="Média de Notas (Este Ano)"
        valor={stats?.mediaNotas?.valor}
        subtitulo={stats?.mediaNotas?.comparacao}
        bgColor="#007bff" // Azul
      />

      {/* 3. Leitura Atual (Editável pelo Aluno) */}
      <StudentStatCard
        titulo="Leitura Atual"
        valor={stats?.leituraAtual?.livro}
        subtitulo={stats?.leituraAtual?.pagina}
        bgColor="#ff9800" // Laranja
        isEditable={true}
        onSave={handleUpdateReading}
      />

      {/* 4. Próxima Notificação */}
      <StudentStatCard
        titulo="Próxima Notificação"
        valor={stats?.proximaNotificacao?.titulo}
        subtitulo={stats?.proximaNotificacao?.tempoRestante}
        bgColor="#00bcd4" // Ciano/Verde Água
        icone={<AlarmIcon />}
      />
    </div>
  );
}