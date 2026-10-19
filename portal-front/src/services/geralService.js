import { api } from './api';

/**
 * geralService.js - Serviço de Integração Analítica do Painel Geral (/dashboard/geral)
 *
 * Papel Didático:
 * Centraliza todas as chamadas HTTP e transformações de dados para o Módulo 7 (Painel Analítico),
 * atendendo tanto à visão institucional/docente (Especialista, Professor e Adm) quanto
 * aos endpoints analíticos de turmas e estudantes previstos em apiContract.md.
 */

/**
 * Formata os KPIs brutos vindos de GET /api/dashboard/geral no array de cards superiores
 * exibidos pelo componente EstatisticaDocenteCard.jsx.
 */
export function montarCardsKpis(kpis = {}) {
  return [
    {
      id: 'total-alunos',
      titulo: 'Total de Alunos',
      valor: kpis.total_alunos ?? 0,
      bgIcone: 'bg-danger-subtle',
      textIcone: 'text-danger',
      tipoIcone: 'alunos',
    },
    {
      id: 'media-geral',
      titulo: 'Média Geral de Notas',
      valor: kpis.media_geral ?? 0,
      bgIcone: 'bg-success-subtle',
      textIcone: 'text-success',
      tipoIcone: 'notas',
    },
    {
      id: 'frequencia',
      titulo: 'Frequência Média',
      valor: kpis.frequencia_media ?? '100%',
      bgIcone: 'bg-warning-subtle',
      textIcone: 'text-warning',
      tipoIcone: 'frequencia',
    },
    {
      id: 'noticias',
      titulo: 'Notícias Publicadas',
      valor: kpis.noticias_publicadas ?? 0,
      bgIcone: 'bg-primary-subtle',
      textIcone: 'text-primary',
      tipoIcone: 'noticias',
    },
  ];
}

/**
 * GET /api/dashboard/geral
 * Busca em uma única requisição os KPIs, médias/frequências por turma e últimas atualizações
 * para os perfis de Especialista, Professor e Administrador.
 */
export async function fetchDashboardGeral() {
  const response = await api('/dashboard/geral');

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(
      errData?.message || 'Não foi possível carregar os indicadores do painel geral no momento.'
    );
  }

  const json = await response.json();
  // Suporta retorno direto (withoutWrapping) ou envelopado em data
  return json?.data && json?.data?.kpis ? json.data : json;
}

/**
 * Helper mantido por compatibilidade com chamadas unitárias dos Small Cards.
 */
export async function geralService() {
  const payload = await fetchDashboardGeral();
  return montarCardsKpis(payload?.kpis || {});
}

/**
 * Helper mantido por compatibilidade para leitura de médias e frequências por turma.
 */
export async function fetchResumoTurmas() {
  const payload = await fetchDashboardGeral();
  const resumo = payload?.resumo_turmas || {};

  return {
    medias: resumo.medias || [],
    frequencias: resumo.frequencias || [],
  };
}

/**
 * Helper mantido por compatibilidade para leitura do feed de atualizações recentes.
 */
export async function fetchLatestUpdates() {
  const payload = await fetchDashboardGeral();
  return payload?.ultimas_atualizacoes || [];
}

/**
 * GET /api/alunos/{aluno_id}/turmas/{turma_id}/resumo-global
 * Obtém o resumo global real do estudante (média geral, frequência global e alertas de risco).
 */
export async function obterResumoAluno(alunoId, turmaId, trimestre = null) {
  const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : '';
  const response = await api(`/alunos/${alunoId}/turmas/${turmaId}/resumo-global${query}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || 'Não foi possível carregar o resumo global do estudante.');
  }

  return response.json();
}

/**
 * GET /api/turmas/{turma_id}/resumo-gerencial
 * Obtém os KPIs gerenciais e a distribuição de desempenho de uma turma específica.
 */
export async function obterResumoEspecialista(turmaId, trimestre = null) {
  const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : '';
  const response = await api(`/turmas/${turmaId}/resumo-gerencial${query}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || 'Não foi possível carregar o resumo gerencial da turma.');
  }

  return response.json();
}

/**
 * GET /api/turmas/{turma_id}/alunos-criticos
 * Lista os alunos em risco crítico de reprovação por nota ou falta na turma.
 */
export async function obterAlunosCriticos(turmaId, trimestre = null) {
  const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : '';
  const response = await api(`/turmas/${turmaId}/alunos-criticos${query}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || 'Não foi possível listar os alunos em situação crítica.');
  }

  return response.json();
}

/**
 * GET /api/turmas/{turma_id}/desempenho-componentes
 * Obtém o ranking consolidado de desempenho por componente curricular da turma.
 */
export async function obterDesempenhoTurma(turmaId, trimestre = null) {
  const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : '';
  const response = await api(`/turmas/${turmaId}/desempenho-componentes${query}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || 'Não foi possível carregar o desempenho por disciplina da turma.');
  }

  return response.json();
}

/**
 * Indicadores superiores da Visão Geral do Estudante (GeralPadrao).
 * Caso o estudante possua identificadores de matrícula/turma informados, consulta a API real;
 * caso contrário, retorna os indicadores didáticos padrão para exibição imediata no painel.
 */
export async function fetchStudentStats(alunoId = null, turmaId = null) {
  if (alunoId && turmaId) {
    try {
      const resumo = await obterResumoAluno(alunoId, turmaId);
      if (resumo?.student_stats) {
        return resumo.student_stats;
      }
    } catch {
      // Fallback gracioso caso o estudante ainda não possua matrícula ativa na turma consultada
    }
  }

  return {
    frequenciaGeral: {
      porcentagem: 94,
      classificacao: 'Ótima',
    },
    mediaNotas: {
      valor: '8.2',
      comparacao: '+0.5 acima da média',
    },
    leituraAtual: {
      livro: 'Dom Casmurro',
      pagina: 'Pág. 120',
    },
    proximaNotificacao: {
      titulo: 'Prova de Matemática',
      tempoRestante: 'Em 3 dias',
    },
  };
}

/**
 * Atualiza em memória os metadados do card de Leitura Atual do estudante.
 */
export async function updateStudentReading(novosDadosLeitura) {
  return novosDadosLeitura;
}

/**
 * Retorna os dados de Top 3 Melhores e Top 3 Piores disciplinas/frequências para o card do Aluno.
 */
export async function fetchAlunoDesempenho() {
  return {
    disciplinas: {
      melhores: [
        { posicao: 1, nome: 'Língua Portuguesa', valor: 9.8, cor: '#10b981', corBadge: '#10b981' },
        { posicao: 2, nome: 'História', valor: 9.5, cor: '#3b82f6', corBadge: '#3b82f6' },
        { posicao: 3, nome: 'Biologia', valor: 9.2, cor: '#8b5cf6', corBadge: '#8b5cf6' },
      ],
      piores: [
        { posicao: 1, nome: 'Matemática', valor: 5.6, cor: '#ef4444', corBadge: '#ef4444' },
        { posicao: 2, nome: 'Inglês', valor: 6.3, cor: '#f59e0b', corBadge: '#f59e0b' },
        { posicao: 3, nome: 'Química', valor: 6.8, cor: '#06b6d4', corBadge: '#06b6d4' },
      ],
    },
    frequencias: {
      melhores: [
        { posicao: 1, nome: 'Educação Física', valor: 100, cor: '#10b981', corBadge: '#10b981' },
        { posicao: 2, nome: 'Artes', valor: 98, cor: '#3b82f6', corBadge: '#3b82f6' },
        { posicao: 3, nome: 'Geografia', valor: 96, cor: '#8b5cf6', corBadge: '#8b5cf6' },
      ],
      piores: [
        { posicao: 1, nome: 'Filosofia', valor: 76, cor: '#ef4444', corBadge: '#ef4444' },
        { posicao: 2, nome: 'Física', valor: 80, cor: '#f59e0b', corBadge: '#f59e0b' },
        { posicao: 3, nome: 'Sociologia', valor: 84, cor: '#06b6d4', corBadge: '#06b6d4' },
      ],
    },
  };
}

export const dashboardService = {
  fetchDashboardGeral,
  obterResumoAluno,
  obterResumoEspecialista,
  obterAlunosCriticos,
  obterDesempenhoTurma,
};