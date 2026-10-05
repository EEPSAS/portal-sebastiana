//small cards
export async function geralService() {
  const data = {
    totalAlunos: 128,
    mediaGeral: 8.4,
    frequenciaMedia: '94%',
    noticiasPublicadas: 12,
  };

  return [
    {
      id: 'total-alunos',
      titulo: 'Total de Alunos',
      valor: data.totalAlunos,
      bgIcone: 'bg-danger-subtle',
      textIcone: 'text-danger',
      tipoIcone: 'alunos'
    },
    {
      id: 'media-geral',
      titulo: 'Média Geral de Notas',
      valor: data.mediaGeral,
      bgIcone: 'bg-success-subtle',
      textIcone: 'text-success',
      tipoIcone: 'notas'
    },
    {
      id: 'frequencia',
      titulo: 'Frequência Média',
      valor: data.frequenciaMedia,
      bgIcone: 'bg-warning-subtle',
      textIcone: 'text-warning',
      tipoIcone: 'frequencia'
    },
    {
      id: 'noticias',
      titulo: 'Notícias Publicadas',
      valor: data.noticiasPublicadas,
      bgIcone: 'bg-primary-subtle',
      textIcone: 'text-primary',
      tipoIcone: 'noticias'
    }
  ];
}

//medium cards
export async function fetchResumoTurmas() {
  // Quando o endpoint estiver pronto, substitua pelo seu fetch real:
  // const response = await fetch('https://api.exemplo.com/turmas/resumo');
  // if (!response.ok) throw new Error('Erro ao buscar dados das turmas');
  // return await response.json();

  // Dados ilustrativos para os cards até a integração com a API.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        medias: [
          { id: 1, turma: '1º Ano', nota: 8.2, cor: '#d63384' },
          { id: 2, turma: '2º Ano', nota: 7.6, cor: '#0d6efd' },
          { id: 3, turma: '3º Ano', nota: 8.9, cor: '#0dcaf0' },
        ],
        frequencias: [
          { id: 1, turma: '1º Ano', percentual: 96, cor: '#20c997' },
          { id: 2, turma: '2º Ano', percentual: 92, cor: '#20c997' },
          { id: 3, turma: '3º Ano', percentual: 97, cor: '#fd7e14' },
        ],
      });
    }, 500);
  });
}

//ultimas atualizações
export async function fetchLatestUpdates() {
  // Substitua pela chamada real à sua API
  // const response = await fetch('https://api.exemplo.com/dashboard/updates');
  // const data = await response.json();
  
  // Simulando o retorno estruturado da API
  return [
    {
      id: 'upd-1',
      tipo: 'noticia', // Usado para definir o ícone e a cor
      texto: 'Nova notícia publicada: Feira de Ciências 2026',
      tempoAtras: '2h atrás'
    },
    {
      id: 'upd-2',
      tipo: 'notas',
      texto: 'Notas do 2º bimestre atualizadas — 3º Ano',
      tempoAtras: '5h atrás'
    }
  ];
}