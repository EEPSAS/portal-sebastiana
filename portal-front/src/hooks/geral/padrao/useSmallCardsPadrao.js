import { useState, useEffect } from "react";
import { useAuth } from "../../useAuth";
import {
  obterResumoAluno,
  resolverContextoSimulacaoAluno,
  updateStudentReading,
} from "../../../services/geralService";

/**
 * useSmallCardsPadrao.js - Hook unificado da Visão Geral do Aluno (GeralPadrao)
 *
 * Papel Didático:
 * - Consulta em uma única requisição GET /api/alunos/{id}/turmas/{turma_id}/resumo-global;
 * - Suporta filtro de etapa avaliativa (Consolidado Anual ou 1º/2º/3º Trimestre);
 * - Identifica automaticamente ausência de matrícula ativa (sem inventar dados fictícios)
 *   e suporta o Modo de Simulação do Administrador sobre registros reais da escola.
 */
export function useStudentStats() {
  const { user } = useAuth();
  const [trimestreSelecionado, setTrimestreSelecionado] = useState("");
  const [leituraOverride, setLeituraOverride] = useState(null);

  const userId = user?.id ?? null;
  const userTurmaId = user?.turma_id ?? null;
  const isSimulated = Boolean(user?.isSimulated);
  const chaveConsulta = `${userId ?? "anon"}:${userTurmaId ?? "sem-turma"}:${isSimulated}:${trimestreSelecionado}`;

  const [estado, setEstado] = useState({
    chave: null,
    resumo: null,
    semMatricula: false,
    simulacaoInfo: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function carregarResumoReal() {
      try {
        let alvoAlunoId = userId;
        let alvoTurmaId = userTurmaId;
        let infoSimulacao = null;

        // Se o Administrador estiver simulando o painel de Aluno sem matrícula própria, busca um aluno real enturmado
        if (isSimulated && !alvoTurmaId) {
          const contexto = await resolverContextoSimulacaoAluno();
          if (contexto) {
            alvoAlunoId = contexto.alunoId;
            alvoTurmaId = contexto.turmaId;
            infoSimulacao = contexto;
          }
        }

        // Estudante real ainda aguardando enturmação recebe estado vazio legítimo, nunca mocks
        if (!alvoAlunoId || !alvoTurmaId) {
          if (isMounted) {
            setEstado({
              chave: chaveConsulta,
              resumo: null,
              semMatricula: true,
              simulacaoInfo: null,
              error: null,
            });
          }
          return;
        }

        const dados = await obterResumoAluno(
          alvoAlunoId,
          alvoTurmaId,
          trimestreSelecionado || null
        );

        if (isMounted) {
          setEstado({
            chave: chaveConsulta,
            resumo: dados,
            semMatricula: false,
            simulacaoInfo: infoSimulacao,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setEstado({
            chave: chaveConsulta,
            resumo: null,
            semMatricula: false,
            simulacaoInfo: null,
            error: err.message || "Não foi possível carregar o resumo escolar.",
          });
        }
      }
    }

    carregarResumoReal();

    return () => {
      isMounted = false;
    };
  }, [chaveConsulta, userId, userTurmaId, isSimulated, trimestreSelecionado]);

  const loading = estado.chave !== chaveConsulta;
  const resumo = estado.resumo;
  const statsBase = resumo?.student_stats || null;
  const stats = statsBase
    ? {
        ...statsBase,
        leituraAtual: leituraOverride
          ? { ...statsBase.leituraAtual, ...leituraOverride }
          : statsBase.leituraAtual,
      }
    : null;

  // Persiste o marcador de página localmente vinculado ao ID real do estudante consultado
  const handleUpdateReading = async (dadosLivro) => {
    const idAlvo = estado.simulacaoInfo?.alunoId ?? userId;
    setLeituraOverride(dadosLivro);
    await updateStudentReading(dadosLivro, idAlvo);
  };

  return {
    stats,
    destaques: resumo?.destaques || null,
    desempenho: resumo?.desempenho || null,
    turmaInfo: resumo?.turma || null,
    alunoInfo: resumo?.aluno || null,
    periodoSelecionado: resumo?.periodo_selecionado || "Consolidado Anual",
    semMatricula: !loading && estado.semMatricula,
    simulacaoInfo: estado.simulacaoInfo,
    trimestreSelecionado,
    setTrimestreSelecionado,
    loading,
    error: loading ? null : estado.error,
    handleUpdateReading,
  };
}
