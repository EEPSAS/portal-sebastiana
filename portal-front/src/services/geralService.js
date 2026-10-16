import { api } from './api';

// Cache de curtíssima duração para evitar chamadas HTTP triplicadas quando os 3 hooks montam juntos
let pendingPromise = null;
let cachedPayload = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 2000;

/**
 * Busca os dados reais consolidados do painel geral (Especialista e Professor) no backend.
 */
export async function fetchDashboardGeral() {
  const agora = Date.now();
  if (cachedPayload && agora - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPayload;
  }

  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    try {
      const response = await api('/dashboard/geral');
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.message || 'Não foi possível carregar os indicadores do painel geral no momento.'
        );
      }

      const json = await response.json();
      // Compatível com retorno direto ou envelopado em data
      const payload = json?.data && json?.data?.kpis ? json.data : json;
      cachedPayload = payload;
      cacheTimestamp = Date.now();
      return payload;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

// ESPECIALISTA E PROFESSOR
// Small cards superiores (KPIs reais do banco de dados)
export async function geralService() {
  const payload = await fetchDashboardGeral();
  const kpis = payload?.kpis || {};

  return [
    {
      id: 'total-alunos',
      titulo: 'Total de Alunos',
      valor: kpis.total_alunos ?? 0,
      bgIcone: 'bg-danger-subtle',
      textIcone: 'text-danger',
      tipoIcone: 'alunos'
    },
    {
      id: 'media-geral',
      titulo: 'Média Geral de Notas',
      valor: kpis.media_geral ?? 0,
      bgIcone: 'bg-success-subtle',
      textIcone: 'text-success',
      tipoIcone: 'notas'
    },
    {
      id: 'frequencia',
      titulo: 'Frequência Média',
      valor: kpis.frequencia_media ?? '100%',
      bgIcone: 'bg-warning-subtle',
      textIcone: 'text-warning',
      tipoIcone: 'frequencia'
    },
    {
      id: 'noticias',
      titulo: 'Notícias Publicadas',
      valor: kpis.noticias_publicadas ?? 0,
      bgIcone: 'bg-primary-subtle',
      textIcone: 'text-primary',
      tipoIcone: 'noticias'
    }
  ];
}

// Medium cards (Médias e Frequências por Turma reais do banco)
export async function fetchResumoTurmas() {
  const payload = await fetchDashboardGeral();
  const resumo = payload?.resumo_turmas || {};

  return {
    medias: resumo.medias || [],
    frequencias: resumo.frequencias || [],
  };
}

// Últimas atualizações reais (Notícias publicadas e Lançamentos de notas)
export async function fetchLatestUpdates() {
  const payload = await fetchDashboardGeral();
  return payload?.ultimas_atualizacoes || [];
}

//PADRAO
//small cards
export async function fetchStudentStats() {
  // Substituir pelo endpoint real da API
  // const response = await fetch('https://api.exemplo.com/estudante/stats');
  // return await response.json();

  // Simulação de resposta da API
  return {
    frequenciaGeral: {
      porcentagem: 94,
      classificacao: 'Ótima'
    },
    mediaNotas: {
      valor: '8.2',
      comparacao: '+0.5 acima da média'
    },
    leituraAtual: {
      livro: 'Dom Casmurro',
      pagina: 'Pág. 120'
    },
    proximaNotificacao: {
      titulo: 'Prova de Matemática',
      tempoRestante: 'Em 3 dias'
    }
  };
}

export async function updateStudentReading(novosDadosLeitura) {
  // Substituir pela chamada PUT/PATCH real
  // await fetch('https://api.exemplo.com/estudante/leitura', {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(novosDadosLeitura)
  // });

  return novosDadosLeitura;
}

export async function fetchAlunoDesempenho() {
  // Simulação de dados para o painel de Desempenho por Disciplina e Frequência
  return {
    disciplinas: {
      melhores: [
        { posicao: 1, nome: "Língua Portuguesa", valor: 9.8, cor: "#10b981", corBadge: "#10b981" },
        { posicao: 2, nome: "História", valor: 9.5, cor: "#3b82f6", corBadge: "#3b82f6" },
        { posicao: 3, nome: "Biologia", valor: 9.2, cor: "#8b5cf6", corBadge: "#8b5cf6" },
      ],
      piores: [
        { posicao: 1, nome: "Matemática", valor: 5.6, cor: "#ef4444", corBadge: "#ef4444" },
        { posicao: 2, nome: "Inglês", valor: 6.3, cor: "#f59e0b", corBadge: "#f59e0b" },
        { posicao: 3, nome: "Química", valor: 6.8, cor: "#06b6d4", corBadge: "#06b6d4" },
      ]
    },
    frequencias: {
      melhores: [
        { posicao: 1, nome: "Educação Física", valor: 100, cor: "#10b981", corBadge: "#10b981" },
        { posicao: 2, nome: "Artes", valor: 98, cor: "#3b82f6", corBadge: "#3b82f6" },
        { posicao: 3, nome: "Geografia", valor: 96, cor: "#8b5cf6", corBadge: "#8b5cf6" },
      ],
      piores: [
        { posicao: 1, nome: "Filosofia", valor: 76, cor: "#ef4444", corBadge: "#ef4444" },
        { posicao: 2, nome: "Física", valor: 80, cor: "#f59e0b", corBadge: "#f59e0b" },
        { posicao: 3, nome: "Sociologia", valor: 84, cor: "#06b6d4", corBadge: "#06b6d4" },
      ]
    }
  };
}

//medium cards
export async function fetchBoletimDados() {
  // Simulação de chamada à API. 
  // No futuro: const response = await fetch('/api/boletim'); return response.json();
  
  return [
    { id: 1, materia: 'Português', pontos: 85, cor: '#0d6efd' }, // Azul
    { id: 2, materia: 'Matemática', pontos: 79, cor: '#198754' }, // Verde
    { id: 3, materia: 'História', pontos: 81, cor: '#00bcd4' }, // Ciano
    { id: 4, materia: 'Biologia', pontos: 77, cor: '#d6006e' }, // Rosa
    { id: 5, materia: 'Física', pontos: 90, cor: '#6f42c1' }, // Roxo
    { id: 6, materia: 'Química', pontos: 72, cor: '#fd7e14' }, // Laranja
    { id: 7, materia: 'Geografia', pontos: 88, cor: '#ffc107' }, // Amarelo
    { id: 8, materia: 'Inglês', pontos: 95, cor: '#dc3545' }  // Vermelho
  ];
}

//notifications
export async function fetchAgendaData() {
  // Simulação de uma chamada à API (ex: fetch('/api/estudante/agenda'))
  return [
    {
      id: 1,
      tipo: 'biblioteca', // Define o ícone (livro) e a cor (azul)
      texto: 'Sua reserva de livro: "Dom Casmurro" está pronta para retirada.',
      tempo: '2h atrás'
    },
    {
      id: 2,
      tipo: 'nota', // Define o ícone (tabela) e a cor (azul claro)
      texto: 'Sua nota de Química (Prova 2) publicada 7.8',
      tempo: '5h atrás'
    },
    {
      id: 3,
      tipo: 'lembrete', // Define o ícone (sino) e a cor (rosa/magenta)
      texto: 'Lembrete: Entrega do trabalho de História amanhã!',
      tempo: '8h atrás'
    },
    {
      id: 4,
      tipo: 'tarefa', // Define o ícone (calendário/check) e a cor (verde)
      texto: 'Entrega de Trabalho de Geografia: "Geopolítica Global"',
      tempo: '2 dias atrás'
    },
    {
      id: 5,
      tipo: 'concurso', // Define o ícone (medalha) e a cor (laranja)
      texto: 'Resultado do Concurso Literário disponível. Parabéns pelos finalistas!',
      tempo: '3 dias atrás'
    },
    {
      id: 6,
      tipo: 'evento', // Define o ícone (relógio) e a cor (verde)
      texto: 'Lembrete: Atividade de Biologia Prática começa às 10:00 AM amanhã.',
      tempo: '12h atrás'
    }
  ];
}