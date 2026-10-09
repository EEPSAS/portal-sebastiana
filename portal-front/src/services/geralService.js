//ESPECIALISTA
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