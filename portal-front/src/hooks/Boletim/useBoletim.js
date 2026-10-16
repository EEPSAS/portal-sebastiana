import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import {
  obterBoletim,
  obterComparativoTurma,
} from "../../services/boletimService";

const TRIMESTRES = [1, 2, 3];
const PESOS_TRIMESTRAIS = [0.3, 0.3, 0.4];

const lerNumero = (valor, rotulo) => {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    throw new Error(`A API retornou um valor inválido para ${rotulo}.`);
  }

  return numero;
};

const normalizarBoletins = (respostas) => {
  const materias = new Map();

  respostas.forEach((resposta, indiceTrimestre) => {
    if (!Array.isArray(resposta?.boletim)) {
      throw new Error("A API retornou um formato inválido para o boletim.");
    }

    resposta.boletim.forEach((registro) => {
      const chave = registro.disciplina_id ?? registro.nome_disciplina;
      if (!chave || !registro.nome_disciplina) {
        throw new Error("O boletim contém uma disciplina sem identificação.");
      }

      if (!materias.has(chave)) {
        materias.set(chave, {
          id: chave,
          nome: registro.nome_disciplina,
          notas: [null, null, null],
          aulas: [0, 0, 0],
          faltas: [0, 0, 0],
        });
      }

      const materia = materias.get(chave);
      if (!("nota_obtida" in registro)) {
        throw new Error("O boletim não informou a nota da disciplina.");
      }
      const nota = lerNumero(registro.nota_obtida, "nota");
      // A API atual não distingue nota zero de falta de lançamento.
      materia.notas[indiceTrimestre] = nota === 0 ? null : nota;

      const aulas = lerNumero(registro.total_aulas, "total de aulas");
      const faltas = lerNumero(registro.somatorio_faltas, "total de faltas");
      if (aulas === null || faltas === null || aulas < 0 || faltas < 0) {
        throw new Error("O boletim contém totais inválidos de aulas ou faltas.");
      }
      materia.aulas[indiceTrimestre] = aulas;
      materia.faltas[indiceTrimestre] = faltas;
    });
  });

  return Array.from(materias.values())
    .map((materia) => {
      const notaFinal = materia.notas.every((nota) => nota !== null)
        ? materia.notas.reduce(
            (total, nota, indice) =>
              total + nota * PESOS_TRIMESTRAIS[indice],
            0
          )
        : null;
      const totalAulas = materia.aulas.reduce((total, aulas) => total + aulas, 0);
      const totalFaltas = materia.faltas.reduce((total, faltas) => total + faltas, 0);

      return {
        ...materia,
        mediaFinal: notaFinal === null ? null : Number(notaFinal.toFixed(2)),
        totalAulas,
        totalFaltas,
        frequenciaAnual:
          totalAulas > 0
            ? Number((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(1))
            : null,
        frequenciaTrimestral: materia.aulas.map((aulas, indice) =>
          aulas > 0
            ? Number(
                (((aulas - materia.faltas[indice]) / aulas) * 100).toFixed(1)
              )
            : null
        ),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};

const normalizarComparativo = (resposta) => {
  if (!Array.isArray(resposta?.comparativo)) {
    throw new Error("A API retornou um formato inválido para o comparativo.");
  }

  return resposta.comparativo.map((registro) => {
    if (!registro.disciplina_id || !registro.nome_disciplina) {
      throw new Error("O comparativo contém uma disciplina sem identificação.");
    }
    if (!("nota_aluno" in registro) || !("media_turma" in registro)) {
      throw new Error("O comparativo não informou todas as médias de notas.");
    }

    const notaAluno = lerNumero(registro.nota_aluno, "nota do aluno");
    const mediaTurma = lerNumero(registro.media_turma, "média da turma");

    return {
      id: registro.disciplina_id ?? registro.nome_disciplina,
      nome: registro.nome_disciplina,
      notaAluno: notaAluno === 0 ? null : notaAluno,
      mediaTurma: mediaTurma === 0 ? null : mediaTurma,
    };
  });
};

export function useBoletim(turmaId) {
  const { user } = useAuth();
  const alunoId = user?.id;
  const [tentativa, setTentativa] = useState(0);
  const chaveRequisicao = `${alunoId ?? ""}:${turmaId ?? ""}:${tentativa}`;
  const [resultado, setResultado] = useState({
    chave: null,
    dados: null,
    erro: null,
  });

  useEffect(() => {
    if (!alunoId || !turmaId) return undefined;

    let requisicaoAtiva = true;

    Promise.all([
      Promise.all(
        TRIMESTRES.map((trimestre) => obterBoletim(alunoId, turmaId, trimestre))
      ),
      obterComparativoTurma(alunoId, turmaId),
    ])
      .then(([respostasBoletim, respostaComparativo]) => {
        if (requisicaoAtiva) {
          setResultado({
            chave: chaveRequisicao,
            dados: {
              disciplinas: normalizarBoletins(respostasBoletim),
              comparativoNotas: normalizarComparativo(respostaComparativo),
            },
            erro: null,
          });
        }
      })
      .catch((erroRequisicao) => {
        if (requisicaoAtiva) {
          setResultado({
            chave: chaveRequisicao,
            dados: null,
            erro:
              erroRequisicao.message ||
              "Não foi possível carregar os dados do boletim.",
          });
        }
      });

    return () => {
      requisicaoAtiva = false;
    };
  }, [alunoId, turmaId, tentativa, chaveRequisicao]);

  const resultadoAtual =
    resultado.chave === chaveRequisicao ? resultado : null;

  return {
    dados: resultadoAtual?.dados ?? null,
    carregando: Boolean(alunoId && turmaId && !resultadoAtual),
    erro: !alunoId
      ? "Não foi possível identificar o aluno autenticado."
      : !turmaId
        ? "Não foi possível identificar sua turma. Acesse o boletim pelo contexto da turma."
        : resultadoAtual?.erro,
    podeTentarNovamente: Boolean(alunoId && turmaId),
    tentarNovamente: () => setTentativa((valor) => valor + 1),
  };
}
