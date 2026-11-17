/**
 * GeralPadrao (index.jsx) - Visão Geral do Aluno Conectada às Fontes Reais
 *
 * Papel Didático:
 * Monta o ecossistema analítico do Estudante consumindo exclusivamente dados reais da API:
 * 1. Contexto de Turma, Ciclo Escolar e filtro de Etapa Avaliativa (Consolidado ou Trimestres);
 * 2. Linha de KPIs Superiores (Frequência Geral, Melhor Nota, Nota de Atenção e Empréstimo Vigente);
 * 3. Seção Principal (Rankings Top 3 de Notas e Frequências + Cardápio Escolar preservado).
 */

import { useMemo } from "react";
import FrequenciaGeralCard from "./Cards/FrequenciaGeralCard";
import { MelhorNotaCard, NotaAtencaoCard } from "./Cards/NotasDestaqueCard";
import LeituraAtualCard from "./Cards/LeituraAtualCard";
import DesempenhoDisciplinasCard from "./Cards/DesempenhoDisciplinasCard";
import CardapioSemanalCard from "./Cards/CardapioSemanalCard";
import PainelPeriodoGeral from "../common/PainelPeriodoGeral";
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
    periodoContexto,
    semMatricula,
    simulacaoInfo,
    trimestreSelecionado,
    setTrimestreSelecionado,
    loading,
    error,
    handleUpdateReading,
  } = useStudentStats();

  const opcoesEtapa = useMemo(() => {
    if (periodoContexto?.divisoes_disponiveis?.length) {
      return [
        { valor: "", rotulo: "Consolidado Anual" },
        ...periodoContexto.divisoes_disponiveis.map((div, idx) => ({
          valor: String(idx + 1),
          rotulo: `${div.nome}${div.pontos ? ` (${div.pontos} pts)` : ""}${div.is_atual ? " • Atual" : ""}`,
        })),
      ];
    }
    return OPCOES_ETAPA;
  }, [periodoContexto]);

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
    <div className="student-overview geral-page-viewport-lock">
      {/* Aviso transparente quando o Administrador simula a visão de um aluno real */}
      {simulacaoInfo && (
        <div className="alert alert-info rounded-3 py-2 px-3 mb-2 small d-flex align-items-center gap-2 flex-shrink-0">
          <i className="bi bi-eye-fill" aria-hidden="true"></i>
          <span>
            <strong>Modo de Simulação:</strong> exibindo indicadores reais do(a) estudante{" "}
            <strong>{simulacaoInfo.alunoNome}</strong> ({simulacaoInfo.turmaNome}).
          </span>
        </div>
      )}

      {/* Barra padronizada de Período / Etapa Avaliativa */}
      <PainelPeriodoGeral
        rotulo="Período:"
        opcoes={opcoesEtapa}
        valorSelecionado={trimestreSelecionado}
        onSelecionar={(v) => setTrimestreSelecionado(v)}
        anoLetivo={periodoContexto?.ano || turmaInfo?.ano_letivo}
        badgeExtra={
          turmaInfo && (
            <>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                {turmaInfo.nome_identificador}
              </span>
              {turmaInfo.ciclo && (
                <span className="badge bg-light text-secondary border rounded-pill px-3 py-2">
                  {turmaInfo.ciclo}
                </span>
              )}
            </>
          )
        }
        ariaLabel="Filtrar indicadores do estudante por etapa avaliativa"
        className="flex-shrink-0"
      />

      {/* 1. Grid de 4 Cards Superiores alimentados exclusivamente pelo backend */}
      <div className="student-overview__metrics row g-3 mb-3 flex-shrink-0">
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
      <div className="student-overview__details row g-3 align-items-stretch geral-fill-row min-h-0">
        <div className="col-12 col-lg-8 d-flex min-h-0">
          <DesempenhoDisciplinasCard
            dadosDisciplinas={desempenho?.disciplinas}
            dadosFrequencias={desempenho?.frequencias}
          />
        </div>
        <div className="col-12 col-lg-4 d-flex min-h-0">
          <CardapioSemanalCard />
        </div>
      </div>
    </div>
  );
};

export default GeralPadrao;
