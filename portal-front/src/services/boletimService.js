import { api } from "./api";

const solicitarJson = async (caminho, { signal } = {}) => {
  const resposta = await api(caminho, { signal });
  let dados;

  try {
    dados = await resposta.json();
  } catch (erro) {
    throw new Error("A API retornou uma resposta inválida para o boletim.", {
      cause: erro,
    });
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.message || "Não foi possível carregar os dados do boletim."
    );
  }

  return dados;
};

const validarIdentificadores = (alunoId, turmaId) => {
  if (!alunoId || !turmaId) {
    throw new Error("Informe o aluno e a turma para consultar o boletim.");
  }
};

// Consulta um único trimestre para manter os filtros temporais definidos pela API.
export const obterBoletim = async (
  alunoId,
  turmaId,
  trimestre,
  { signal } = {}
) => {
  validarIdentificadores(alunoId, turmaId);

  if (![1, 2, 3].includes(Number(trimestre))) {
    throw new Error("O trimestre deve ser 1, 2 ou 3.");
  }

  const caminho = `/alunos/${encodeURIComponent(alunoId)}/turmas/${encodeURIComponent(turmaId)}/boletim?trimestre=${Number(trimestre)}`;
  return solicitarJson(caminho, { signal });
};

// O endpoint sem trimestre retorna o comparativo consolidado do ano letivo.
export const obterComparativoTurma = async (
  alunoId,
  turmaId,
  { signal } = {}
) => {
  validarIdentificadores(alunoId, turmaId);

  const caminho = `/alunos/${encodeURIComponent(alunoId)}/turmas/${encodeURIComponent(turmaId)}/comparativo-turma`;
  return solicitarJson(caminho, { signal });
};
