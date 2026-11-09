/**
 * GeralPadrao (index.jsx) - Visão Geral do Aluno Conectada às Fontes Reais
 *
 * Papel Didático:
 * Monta o ecossistema analítico do Estudante consumindo exclusivamente dados reais da API:
 * 1. Contexto de Turma, Ciclo Escolar e filtro de Etapa Avaliativa (Consolidado ou Trimestres);
 * 2. Linha de KPIs Superiores (Frequência Geral, Melhor Nota, Nota de Atenção e Empréstimo Vigente);
 * 3. Seção Principal (Rankings Top 3 de Notas e Frequências + Cardápio Escolar preservado).
 */

import FrequenciaGeralCard from "./Cards/FrequenciaGeralCard";
import { MelhorNotaCard, NotaAtencaoCard } from "./Cards/NotasDestaqueCard";
import LeituraAtualCard from "./Cards/LeituraAtualCard";
import DesempenhoDisciplinasCard from "./Cards/DesempenhoDisciplinasCard";
import CardapioSemanalCard from "./Cards/CardapioSemanalCard";
import { useStudentStats } from "../../../../hooks/geral/padrao/useSmallCardsPadrao";
import "../especialista/GeralEspecialista.css";

const OPCOES_ETAPA = [
  { valor: "", rotulo: "Consolidado Anual" },
  { valor: "1", rotulo: "1º Trimestre" },
  { valor: "2", rotulo: "2º Trimestre" },
  { valor: "3", rotulo: "3º Trimestre" },
];

const GeralPadrao = () => {
  const {
    stats,
    destaques,
    desempenho,
    turmaInfo,
    semMatricula,
    simulacaoInfo,
    trimestreSelecionado,
    setTrimestreSelecionado,
    loading,
    error,
    handleUpdateReading,
  } = useStudentStats();

  // 1. Estado Assíncrono: Carregando (sem live region ruidosa em estados transitórios)
  if (loading && !stats && !semMatricula) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" aria-hidden="true"></div>
        <p className="text-muted mt-2 small mb-0">
          Carregando suas informações escolares...
        </p>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error && !stats) {
    return (
      <div className="alert alert-danger rounded-4 p-3 shadow-sm" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
        Não foi possível carregar os indicadores do estudante: {error}
      </div>
    );
  }

  // 3. Estado Vazio Legítimo: Estudante ainda sem matrícula ativa em turma
  if (semMatricula) {
    return (
      <div className="student-overview">
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white text-center">
          <div className="mb-2 text-primary">
            <i className="bi bi-mortarboard fs-2" aria-hidden="true"></i>
          </div>
          <h2 className="h5 fw-bold text-dark mb-1">
            Aguardando enturmação no período letivo
          </h2>
          <p className="text-secondary small mb-0">
            Sua conta ainda não possui matrícula ativa vinculada a uma turma. Assim que a secretaria ou o especialista concluir sua enturmação, suas disciplinas, notas e frequências aparecerão automaticamente aqui.
          </p>
        </div>
        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <CardapioSemanalCard />
          </div>
        </div>
      </div>
    );
  }

  // 4. Estado Vazio Geral
  if (!stats && !desempenho) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-4 text-center text-muted">
        Nenhuma informação acadêmica disponível para exibição no momento.
      </div>
    );
  }

  const melhorNota = destaques?.melhor_nota;
  const notaAtencao = destaques?.nota_atencao;

  return (
    <div className="student-overview">
      {/* Aviso transparente quando o Administrador simula a visão de um aluno real */}
      {simulacaoInfo && (
        <div className="alert alert-info rounded-3 py-2 px-3 mb-2 small d-flex align-items-center gap-2">
          <i className="bi bi-eye-fill" aria-hidden="true"></i>
          <span>
            <strong>Modo de Simulação:</strong> exibindo indicadores reais do(a) estudante{" "}
            <strong>{simulacaoInfo.alunoNome}</strong> ({simulacaoInfo.turmaNome}).
          </span>
        </div>
      )}

      {/* Barra contextual de Turma, Ciclo Escolar e Filtro de Etapa Avaliativa */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-2 px-3 bg-white rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="small fw-bold text-dark text-uppercase d-flex align-items-center gap-1 me-1">
            <i className="bi bi-calendar-range text-primary" aria-hidden="true"></i>
            Período:
          </span>
          <div
            className="btn-group btn-group-sm flex-wrap p-1 bg-light rounded-pill border"
            role="group"
            aria-label="Filtrar indicadores do estudante por etapa avaliativa"
          >
            {OPCOES_ETAPA.map((opcao) => {
              const isAtiva = trimestreSelecionado === opcao.valor;
              return (
                <button
                  key={opcao.valor || "anual"}
                  type="button"
                  className={`btn-pill-filter ${isAtiva ? "is-active" : ""}`}
                  aria-pressed={isAtiva}
                  onClick={() => setTrimestreSelecionado(opcao.valor)}
                >
                  {opcao.rotulo}
                </button>
              );
            })}
          </div>
        </div>

        {turmaInfo && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
              {turmaInfo.nome_identificador}
            </span>
            {turmaInfo.ciclo && (
              <span className="badge bg-light text-secondary border rounded-pill px-3 py-2">
                {turmaInfo.ciclo}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 1. Grid de 4 Cards Superiores alimentados exclusivamente pelo backend */}
      <div className="student-overview__metrics row g-3 mb-3">
        <FrequenciaGeralCard
          porcentagem={stats?.frequenciaGeral?.porcentagem ?? 0}
          classificacao={stats?.frequenciaGeral?.classificacao ?? "Sem registros"}
        />

        <MelhorNotaCard
          nota={melhorNota?.nota}
          disciplina={melhorNota?.disciplina}
          mensagem={melhorNota?.mensagem}
          temLancamento={melhorNota?.tem_lancamento}
        />

        <NotaAtencaoCard
          nota={notaAtencao?.nota}
          disciplina={notaAtencao?.disciplina}
          mensagem={notaAtencao?.mensagem}
          emAlerta={notaAtencao?.em_alerta}
          temLancamento={notaAtencao?.tem_lancamento}
        />

        <LeituraAtualCard
          leitura={stats?.leituraAtual}
          onSave={handleUpdateReading}
        />
      </div>

      {/* 2. Seção Principal: Desempenho Real (8 colunas) e Cardápio (4 colunas) */}
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
