import { api } from "./api";
import {
  BoletimAlunoConsultaInputSchema,
  BoletimAlunoSchema,
  BoletimIdentificadoresInputSchema,
  ComparativoTurmaSchema,
  validarContratoZod,
  validarFormularioZod,
} from "../utils/academicoSchemas";

/**
 * boletimService.js - Serviço de consulta do Boletim Escolar e Comparativo do Aluno
 *
 * Papel Didático:
 * Conecta o painel do estudante aos endpoints de desempenho individual, aplicando
 * revalidação estrita em runtime com Zod (espelhando BoletimAlunoData e ComparativoTurmaData).
 */

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

  const check = validarFormularioZod(BoletimIdentificadoresInputSchema, {
    alunoId,
    turmaId,
  });

  if (!check.valido) {
    throw new Error(check.mensagem);
  }

  return check.dados;
};

// Consulta um único trimestre validando parâmetros de entrada e o retorno BoletimAlunoSchema com Zod.
export const obterBoletim = async (
  alunoId,
  turmaId,
  trimestre,
  { signal } = {}
) => {
  validarIdentificadores(alunoId, turmaId);

  const checkConsulta = validarFormularioZod(BoletimAlunoConsultaInputSchema, {
    alunoId,
    turmaId,
    trimestre,
  });

  if (!checkConsulta.valido) {
    throw new Error(checkConsulta.mensagem);
  }

  const { alunoId: idAluno, turmaId: idTurma, trimestre: numTrimestre } =
    checkConsulta.dados;

  const caminho = `/alunos/${encodeURIComponent(idAluno)}/turmas/${encodeURIComponent(idTurma)}/boletim?trimestre=${numTrimestre}`;
  const raw = await solicitarJson(caminho, { signal });

  return validarContratoZod(
    BoletimAlunoSchema,
    raw?.data || raw,
    "GET /alunos/:id/turmas/:id/boletim"
  );
};

// O endpoint sem trimestre retorna o comparativo consolidado do ano letivo validado via ComparativoTurmaSchema.
export const obterComparativoTurma = async (
  alunoId,
  turmaId,
  { signal } = {}
) => {
  const { alunoId: idAluno, turmaId: idTurma } = validarIdentificadores(
    alunoId,
    turmaId
  );

  const caminho = `/alunos/${encodeURIComponent(idAluno)}/turmas/${encodeURIComponent(idTurma)}/comparativo-turma`;
  const raw = await solicitarJson(caminho, { signal });

  return validarContratoZod(
    ComparativoTurmaSchema,
    raw?.data || raw,
    "GET /alunos/:id/turmas/:id/comparativo-turma"
  );
};

export const boletimService = {
  obterBoletim,
  obterComparativoTurma,
};
