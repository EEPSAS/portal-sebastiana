/**
 * GeralPadrao (index.jsx) - Visão Geral do Aluno
 *
 * Papel Didático:
 * Monta o ecossistema analítico completo do Estudante com:
 * 1. Linha de KPIs Superiores:
 *    - Frequência Geral (FrequenciaGeralCard com Donut Recharts).
 *    - Melhor Nota (MelhorNotaCard).
 *    - Nota de Atenção (NotaAtencaoCard).
 *    - Leitura Atual (LeituraAtualCard com edição modal).
 * 3. Seção Principal (8 colunas + 4 colunas):
 *    - Desempenho por Disciplina / Frequência (DesempenhoDisciplinasCard com Mini Barras Recharts).
 *    - Cardápio Mensal da Merenda Escolar (CardapioSemanalCard com seletor de mês e modal completo).
 */

import FrequenciaGeralCard from "./Cards/FrequenciaGeralCard";
import { MelhorNotaCard, NotaAtencaoCard } from "./Cards/NotasDestaqueCard";
import LeituraAtualCard from "./Cards/LeituraAtualCard";
import DesempenhoDisciplinasCard from "./Cards/DesempenhoDisciplinasCard";
import CardapioSemanalCard from "./Cards/CardapioSemanalCard";

import { useStudentStats } from "../../../../hooks/geral/padrao/useSmallCardsPadrao";
import { useAlunoDesempenho } from "../../../../hooks/geral/padrao/useAlunoDesempenho";

const GeralPadrao = () => {
  const { stats, loading: loadingStats, error: errorStats, handleUpdateReading } = useStudentStats();
  const { desempenho, loading: loadingDesempenho, error: errorDesempenho } = useAlunoDesempenho();

  // 1. Estado Assíncrono: Carregando
  if (loadingStats || loadingDesempenho) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando painel do estudante...</span>
        </div>
        <p className="text-muted mt-2 small">Carregando suas informações escolares...</p>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  const erroGeral = errorStats || errorDesempenho;
  if (erroGeral) {
    return (
      <div className="alert alert-danger rounded-4 p-3 shadow-sm" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Não foi possível carregar os indicadores do estudante: {erroGeral}
      </div>
    );
  }

  // 3. Estado Assíncrono: Vazio
  if (!stats && !desempenho) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted">
        Nenhuma informação acadêmica disponível para exibição no momento.
      </div>
    );
  }

  return (
    <div className="student-overview">
      {/* 1. Grid de 4 Cards Superiores */}
      <div className="student-overview__metrics row g-3 mb-3">
        {/* Card 1: Frequência Geral (Magenta com Recharts) */}
        <FrequenciaGeralCard
          porcentagem={stats?.frequenciaGeral?.porcentagem || 94}
          classificacao={stats?.frequenciaGeral?.classificacao || "Ótima"}
        />

        {/* Card 2: Melhor Nota */}
        <MelhorNotaCard
          nota="9,8"
          disciplina="Língua Portuguesa"
          mensagem="Parabéns! Você está indo muito bem nesta disciplina!"
        />

        {/* Card 3: Nota que precisa de mais atenção */}
        <NotaAtencaoCard
          nota="5,6"
          disciplina="Matemática"
          mensagem="Fique atento! Matemática precisa de mais dedicação."
        />

        {/* Card 4: Leitura Atual (Laranja com Edição) */}
        <LeituraAtualCard
          leitura={stats?.leituraAtual}
          onSave={handleUpdateReading}
        />
      </div>

      {/* 2. Seção Principal: Desempenho (8 colunas) e Cardápio (4 colunas) */}
      <div className="student-overview__details row g-3 align-items-stretch">
        <div className="col-12 col-lg-8 d-flex">
          <DesempenhoDisciplinasCard
            dadosDisciplinas={desempenho?.disciplinas}
            dadosFrequencias={desempenho?.frequencias}
          />
        </div>
        <div className="col-12 col-lg-4 d-flex">
          <CardapioSemanalCard />
        </div>
      </div>
    </div>
  );
};

export default GeralPadrao;
