import { api } from './api';

const lerResposta = async (response, mensagemPadrao) => {
  const dados = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(dados?.message || mensagemPadrao);
  }
  return dados?.data ?? dados;
};

export const listarHorarios = async ({ signal } = {}) => {
  const response = await api('/horarios', { signal });
  const dados = await lerResposta(response, 'Não foi possível carregar os horários.');
  return Array.isArray(dados) ? dados : [];
};

export const gerarHorario = async (turmaId, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}/horario/gerar`, {
    method: 'POST',
    signal,
  });
  return lerResposta(response, 'Não foi possível gerar o horário da turma.');
};

export const moverAula = async (horarioId, aulaId, destino, { signal } = {}) => {
  const response = await api(`/horarios/${horarioId}/aulas/${aulaId}`, {
    method: 'PATCH',
    body: destino,
    signal,
  });
  return lerResposta(response, 'Não foi possível mover a aula.');
};

export const horariosService = {
  listar: listarHorarios,
  gerar: gerarHorario,
  moverAula,
};
