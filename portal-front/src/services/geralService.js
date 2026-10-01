export async function geralService() {
  // Exemplo de chamada HTTP
  const response = await fetch('https://api.exemplo.com/dashboard/stats');
  
  if (!response.ok) {
    throw new Error('Falha ao carregar as estatísticas.');
  }

  const data = await response.json();

  // Transforma o objeto da API num array para permitir renderização dinâmica com .map()
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