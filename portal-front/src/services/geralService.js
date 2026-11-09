import { api } from './api';
import {
  AlunoResumoGlobalSchema,
  DashboardGeralSchema,
  validarContratoZod,
} from '../utils/academicoSchemas';

/**
 * geralService.js - Serviço de Integração Analítica do Painel Geral (/dashboard/geral)
 *
 * Papel Didático:
 * Centraliza todas as chamadas HTTP e transformações de dados para o Módulo 7 (Painel Analítico),
 * atendendo tanto à visão institucional/docente (Especialista, Professor e Adm) quanto
 * aos endpoints analíticos de turmas e estudantes previstos em apiContract.md.
 */

const obterChaveMarcadorLeitura = (alunoId) =>
  `portal_sebastiana_leitura_${alunoId || 'atual'}`;

/**
 * Lê eventual marcador local de página salvo pelo estudante no navegador.
 * Nunca retorna livros fictícios: só complementa o empréstimo real ou a anotação feita pelo próprio usuário.
 */
function lerMarcadorLeituraLocal(alunoId) {
  try {
    const bruto = localStorage.getItem(obterChaveMarcadorLeitura(alunoId));
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

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
      valor: kpis.media_geral ?? '—',
      bgIcone: 'bg-success-subtle',
      textIcone: 'text-success',
      tipoIcone: 'notas',
    },
    {
      id: 'frequencia',
      titulo: 'Média de Frequência Geral',
      valor: kpis.frequencia_media ?? '—',
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
 * para os perfis de Especialista, Professor e Administrador, validando o contrato em runtime via Zod.
 */
export async function fetchDashboardGeral({ divisao } = {}) {
  const query = divisao ? `?divisao=${encodeURIComponent(divisao)}` : '';
  const response = await api(`/dashboard/geral${query}`);

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(
      errData?.message || 'Não foi possível carregar os indicadores do painel geral no momento.'
    );
  }

  const json = await response.json();
  // Suporta retorno direto (withoutWrapping) ou envelopado em data
  const payload = json?.data && json?.data?.kpis ? json.data : json;
  return validarContratoZod(DashboardGeralSchema, payload, 'GET /dashboard/geral');
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
  return payload?.ultimas_notificacoes || [];
}

/**
 * GET /api/alunos/{aluno_id}/turmas/{turma_id}/resumo-global
 * Obtém o resumo global real do estudante (média, frequência, destaques e rankings Top 3)
 * validado estritamente contra AlunoResumoGlobalSchema.
 */
export async function obterResumoAluno(alunoId, turmaId, trimestre = null) {
  const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : '';
  const response = await api(
    `/alunos/${encodeURIComponent(alunoId)}/turmas/${encodeURIComponent(turmaId)}/resumo-global${query}`
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || 'Não foi possível carregar o resumo global do estudante.');
  }

  const json = await response.json();
  const payload = json?.data && json?.data?.student_stats ? json.data : json;
  const validado = validarContratoZod(
    AlunoResumoGlobalSchema,
    payload,
    'GET /alunos/:id/turmas/:id/resumo-global'
  );

  // Mescla marcação de página salva pelo estudante quando compatível com o empréstimo vigente
  const marcador = lerMarcadorLeituraLocal(alunoId);
  if (marcador && validado?.student_stats?.leituraAtual) {
    const leituraApi = validado.student_stats.leituraAtual;
    const semEmprestimoAtivo = leituraApi.livro === 'Nenhum empréstimo ativo';
    if (
      (semEmprestimoAtivo && marcador.livro) ||
      (!semEmprestimoAtivo && marcador.livro === leituraApi.livro && marcador.pagina)
    ) {
      validado.student_stats = {
        ...validado.student_stats,
        leituraAtual: {
          ...leituraApi,
          livro: semEmprestimoAtivo ? marcador.livro : leituraApi.livro,
          autor: semEmprestimoAtivo ? marcador.autor || '' : leituraApi.autor,
          pagina: marcador.pagina || leituraApi.pagina,
        },
      };
    }
  }

  return validado;
}

/**
 * Quando o Administrador utiliza a simulação de perfil "Aluno" no cabeçalho,
 * localiza o primeiro estudante real matriculado em uma turma ativa para exibição fidedigna.
 */
export async function resolverContextoSimulacaoAluno() {
  const respTurmas = await api('/turmas');
  if (!respTurmas.ok) return null;

  const jsonTurmas = await respTurmas.json().catch(() => null);
  const listaTurmas = Array.isArray(jsonTurmas)
    ? jsonTurmas
    : Array.isArray(jsonTurmas?.data)
      ? jsonTurmas.data
      : [];

  for (const turma of listaTurmas) {
    const idTurma = turma.id_turma ?? turma.id;
    if (!idTurma) continue;

    const respAlunos = await api(`/turmas/${encodeURIComponent(idTurma)}/alunos`);
    if (!respAlunos.ok) continue;

    const jsonAlunos = await respAlunos.json().catch(() => null);
    const listaAlunos = Array.isArray(jsonAlunos)
      ? jsonAlunos
      : Array.isArray(jsonAlunos?.data)
        ? jsonAlunos.data
        : [];

    if (listaAlunos.length > 0) {
      const primeiroAluno = listaAlunos[0];
      return {
        alunoId: primeiroAluno.id,
        alunoNome: primeiroAluno.name || primeiroAluno.nome,
        turmaId: idTurma,
        turmaNome: turma.nome_identificador || turma.nome,
      };
    }
  }

  return null;
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
 * Indicadores superiores da Visão Geral do Estudante (GeralPadrao) sem dados fictícios.
 */
export async function fetchStudentStats(alunoId = null, turmaId = null, trimestre = null) {
  if (!alunoId || !turmaId) {
    return null;
  }

  const resumo = await obterResumoAluno(alunoId, turmaId, trimestre);
  return resumo?.student_stats || null;
}

/**
 * Persiste localmente o marcador de página da leitura atual do estudante.
 */
export async function updateStudentReading(novosDadosLeitura, alunoId = null) {
  try {
    localStorage.setItem(
      obterChaveMarcadorLeitura(alunoId),
      JSON.stringify(novosDadosLeitura)
    );
  } catch {
    // Ignora indisponibilidade de armazenamento local sem interromper a UI
  }
  return novosDadosLeitura;
}

/**
 * Retorna os rankings reais de Top 3 Melhores e Top 3 Piores disciplinas/frequências do estudante.
 */
export async function fetchAlunoDesempenho(alunoId = null, turmaId = null, trimestre = null) {
  if (!alunoId || !turmaId) {
    return null;
  }

  const resumo = await obterResumoAluno(alunoId, turmaId, trimestre);
  return resumo?.desempenho || null;
}

export const dashboardService = {
  fetchDashboardGeral,
  obterResumoAluno,
  resolverContextoSimulacaoAluno,
  obterResumoEspecialista,
  obterAlunosCriticos,
  obterDesempenhoTurma,
};
