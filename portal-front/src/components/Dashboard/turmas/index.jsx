import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import {
  cancelarMatriculaAluno,
  excluirDadosCsv,
  excluirTurma,
  extrairLista,
  fetchMatriculas,
  fetchResumoGeral,
  fetchTurmaAlunos,
  fetchTurmaNotas,
  fetchTurmas,
} from "../../../services/turmasService";
import GeralAba from "./GeralAba";
import ModalImportarNotas from "./ModalImportarNotas";
import ModalTurma from "./ModalTurma";
import ModalVincularAluno from "./ModalVincularAluno";
import NotasAba from "./NotasAba";
import "./Turmas.css";
import TurmasAba from "./TurmasAba";

/**
 * Determina o trimestre escolar corrente com base no mês do calendário (padrão rede estadual de MG):
 * - Meses 1 a 4 (Jan a Abr): 1º Trimestre
 * - Meses 5 a 8 (Mai a Ago): 2º Trimestre
 * - Meses 9 a 12 (Set a Dez): 3º Trimestre
 */
const obterTrimestreAtual = () => {
  const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0 (Jan) a 11 (Dez)
  if (mesAtual <= 4) return "1º Trimestre";
  if (mesAtual <= 8) return "2º Trimestre";
  return "3º Trimestre";
};

// Definição das 3 abas oficiais do módulo de turmas
const ABAS = [
  { id: "geral", label: "Visão Geral e Indicadores" },
  { id: "turmas", label: "Quadro de Turmas e Alunos" },
  { id: "notas", label: "Notas e Diário Escolar" },
];

/**
 * Orquestrador Central da área de Turmas.
 * Segue a arquitetura da Biblioteca Escolar, organizando o módulo em abas:
 * 1. `GeralAba`: Cards e gráficos analíticos de desempenho e presença (Recharts);
 * 2. `TurmasAba`: CRUD de turmas e relação nominal de alunos matriculados;
 * 3. `NotasAba`: Médias gerais por turma e listagem consolidada de notas.
 */
const Turmas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  // Estados de navegação
  const [abaAtiva, setAbaAtiva] = useState("geral");

  // Dados centrais
  const [turmas, setTurmas] = useState([]);
  const [resumoGeral, setResumoGeral] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  // Dados da aba de notas: seleção individual de aluno para não carregar todos de uma vez
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [alunosTurmaSelecionada, setAlunosTurmaSelecionada] = useState([]);
  const [alunoFiltroNota, setAlunoFiltroNota] = useState("");
  const [notas, setNotas] = useState([]);
  const [periodoFiltro, setPeriodoFiltro] = useState(() => obterTrimestreAtual());
  const [termoBuscaNota, setTermoBuscaNota] = useState("");

  // Estados de carregamento e avisos
  const [loadingGeral, setLoadingGeral] = useState(true);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [notificacao, setNotificacao] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");

  // Modais de escrita
  const [modalTurmaAberto, setModalTurmaAberto] = useState(false);
  const [turmaParaEditar, setTurmaParaEditar] = useState(null);
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [turmaParaVincular, setTurmaParaVincular] = useState(null);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [turmaParaImportarCsv, setTurmaParaImportarCsv] = useState(null);

  // Modais de confirmação de exclusão / desvinculação
  const [turmaParaExcluir, setTurmaParaExcluir] = useState(null);
  const [matriculaParaDesvincular, setMatriculaParaDesvincular] = useState(null);
  const [modalExcluirCsvAberto, setModalExcluirCsvAberto] = useState(false);
  const [turmaParaExcluirCsv, setTurmaParaExcluirCsv] = useState(null);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);
  const [processandoExclusaoCsv, setProcessandoExclusaoCsv] = useState(false);

  // Chave numérica para disparo de recarga após operações de escrita
  const [recargaKey, setRecargaKey] = useState(0);

  // Exibe mensagem temporária no toast flutuante
  const dispararNotificacao = (mensagem) => {
    setNotificacao(mensagem);
    setTimeout(() => setNotificacao(""), 4500);
  };

  /**
   * 1. Efeito Central: Busca turmas, resumo agregado e matrículas ativas.
   */
  useEffect(() => {
    let cancelado = false;

    Promise.all([
      fetchTurmas().catch((err) => {
        console.warn("Falha ao buscar turmas:", err);
        return [];
      }),
      fetchResumoGeral().catch((err) => {
        console.warn("Falha ao buscar resumo analítico:", err);
        return [];
      }),
      fetchMatriculas().catch((err) => {
        console.warn("Falha ao buscar matrículas escolares:", err);
        return [];
      }),
    ])
      .then(([dadosTurmas, dadosResumo, dadosMatriculas]) => {
        if (!cancelado) {
          // Extração padronizada e enxuta das listas via extrairLista()
          const listaTurmas = extrairLista(dadosTurmas);
          const listaResumo = extrairLista(dadosResumo);
          const listaMatriculas = extrairLista(dadosMatriculas);

          setTurmas(listaTurmas);
          setResumoGeral(listaResumo);
          setMatriculas(listaMatriculas);

          // Seleciona a primeira turma se nenhuma estiver selecionada
          if (listaTurmas.length > 0) {
            setTurmaSelecionadaId((prev) => prev || String(listaTurmas[0].id_turma));
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErroCarregamento(err.message || "Erro ao carregar dados escolares.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingGeral(false);
      });

    return () => {
      cancelado = true;
    };
  }, [recargaKey]);

  /**
   * 2. Efeito de Alunos da Turma: Busca a relação de estudantes da turma ativa
   * para alimentar o filtro seletivo de notas, evitando a sobrecarga de carregar todos.
   */
  useEffect(() => {
    if (!turmaSelecionadaId) return;

    let cancelado = false;

    fetchTurmaAlunos(turmaSelecionadaId)
      .then((dadosAlunos) => {
        if (!cancelado) {
          setAlunosTurmaSelecionada(extrairLista(dadosAlunos));
        }
      })
      .catch((err) => {
        console.warn("Falha ao carregar alunos da turma para o filtro de notas:", err);
        if (!cancelado) setAlunosTurmaSelecionada([]);
      });

    return () => {
      cancelado = true;
    };
  }, [turmaSelecionadaId, recargaKey]);

  /**
   * 3. Efeito de Notas do Estudante: Consulta na API exclusivamente as notas
   * do estudante selecionado no filtro, garantindo performance e granularidade.
   */
  useEffect(() => {
    if (!turmaSelecionadaId || !alunoFiltroNota) return;

    let cancelado = false;

    fetchTurmaNotas(turmaSelecionadaId, {
      periodo: periodoFiltro,
      alunoId: alunoFiltroNota,
    })
      .then((dadosNotas) => {
        if (!cancelado) {
          setNotas(dadosNotas || []);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setNotas([]);
        }
      })
      .finally(() => {
        if (!cancelado) setLoadingNotas(false);
      });

    return () => {
      cancelado = true;
    };
  }, [turmaSelecionadaId, alunoFiltroNota, periodoFiltro, recargaKey]);

  // Abertura de modais
  const handleAbrirCriarTurma = () => {
    setTurmaParaEditar(null);
    setModalTurmaAberto(true);
  };

  const handleAbrirEditarTurma = (turma) => {
    setTurmaParaEditar(turma);
    setModalTurmaAberto(true);
  };

  const handleAbrirVincularAluno = (turma) => {
    setTurmaParaVincular(turma);
    setModalVincularAberto(true);
  };

  const handleSelecionarTurmaNotas = (idTurma) => {
    setTurmaSelecionadaId(idTurma);
    setAlunoFiltroNota("");
    setNotas([]);
  };

  const handleAlunoFiltroChange = (idAluno) => {
    setAlunoFiltroNota(idAluno);
    if (idAluno) {
      setLoadingNotas(true);
    } else {
      setNotas([]);
      setLoadingNotas(false);
    }
  };

  // Navega para a visão individual do Boletim Escolar passando os identificadores do aluno e turma
  const handleAbrirBoletimAluno = (idAluno) => {
    navigate("/dashboard/boletim", {
      state: {
        aluno_id: idAluno,
        turma_id: turmaSelecionadaId,
      },
    });
  };

  // Abre o modal de importação associando-o opcionalmente a uma turma contextual específica
  const handleAbrirImportarNotas = (turmaContextual = null) => {
    if (turmaContextual?.id_turma) {
      setTurmaSelecionadaId(String(turmaContextual.id_turma));
      setTurmaParaImportarCsv(turmaContextual);
    } else {
      setTurmaParaImportarCsv(turmaAtivaParaCSV);
    }
    setModalImportarAberto(true);
  };

  // Abre o modal de exclusão associando-o opcionalmente a uma turma contextual específica
  const handleAbrirExcluirDadosCsv = (turmaContextual = null) => {
    if (turmaContextual?.id_turma) {
      setTurmaSelecionadaId(String(turmaContextual.id_turma));
      setTurmaParaExcluirCsv(turmaContextual);
    } else {
      setTurmaParaExcluirCsv(turmaAtivaParaCSV);
    }
    setModalExcluirCsvAberto(true);
  };

  // Executa a exclusão segura dos dados carregados pelo CSV na turma selecionada
  const handleConfirmarExclusaoCsv = async () => {
    const idTurmaAlvo = turmaParaExcluirCsv?.id_turma || turmaSelecionadaId;
    if (!idTurmaAlvo) return;

    setProcessandoExclusaoCsv(true);
    try {
      const resp = await excluirDadosCsv(idTurmaAlvo, {
        periodo: periodoFiltro,
      });
      dispararNotificacao(resp?.message || "Dados do diário escolar excluídos com sucesso!");
      setModalExcluirCsvAberto(false);
      setTurmaParaExcluirCsv(null);
      setNotas([]);
      setRecargaKey((prev) => prev + 1);
    } catch (err) {
      alert(err.message || "Erro ao excluir os dados do diário escolar.");
    } finally {
      setProcessandoExclusaoCsv(false);
    }
  };

  // Sucesso na criação / edição de turma
  const handleSucessoTurma = (resultado, isEdicao) => {
    dispararNotificacao(
      isEdicao
        ? `Turma "${resultado?.nome_identificador}" atualizada com sucesso!`
        : `Turma "${resultado?.nome_identificador}" cadastrada com sucesso!`
    );
    setRecargaKey((prev) => prev + 1);
  };

  // Sucesso na homologação de matrícula do aluno
  const handleSucessoVincular = () => {
    dispararNotificacao("Matrícula homologada com sucesso! Aluno confirmado na turma.");
    setRecargaKey((prev) => prev + 1);
  };

  // Sucesso na importação de notas CSV
  const handleSucessoImportacaoCSV = (resultado) => {
    dispararNotificacao(resultado?.message || "Notas importadas e sincronizadas com sucesso!");
    setRecargaKey((prev) => prev + 1);
  };

  // Confirmação e execução de exclusão de turma
  const handleConfirmarExclusaoTurma = async () => {
    if (!turmaParaExcluir) return;

    setProcessandoExclusao(true);
    try {
      await excluirTurma(turmaParaExcluir.id_turma);
      dispararNotificacao(`Turma "${turmaParaExcluir.nome_identificador}" excluída com sucesso.`);
      setTurmaParaExcluir(null);
      setRecargaKey((prev) => prev + 1);
    } catch (err) {
      alert(err.message || "Não foi possível excluir a turma.");
    } finally {
      setProcessandoExclusao(false);
    }
  };

  // Confirmação e execução de desvinculação de aluno
  const handleConfirmarDesvinculacao = async () => {
    if (!matriculaParaDesvincular) return;

    setProcessandoExclusao(true);
    try {
      const idMatricula = matriculaParaDesvincular.id_matricula ?? matriculaParaDesvincular.id;
      const turmaIdDesvinculada = matriculaParaDesvincular.turma_id ?? matriculaParaDesvincular.turma?.id_turma;
      const nomeAluno = matriculaParaDesvincular.aluno?.name || matriculaParaDesvincular.name || "Estudante";

      await cancelarMatriculaAluno(idMatricula, { status: "Evadido" });

      // Atualização otimista imediata na listagem de matrículas
      setMatriculas((prev) =>
        prev.filter((m) => (m.id_matricula ?? m.id) !== idMatricula)
      );

      // Atualização otimista imediata no contador total_alunos da turma afetada
      if (turmaIdDesvinculada) {
        setTurmas((prev) =>
          prev.map((t) => {
            if ((t.id_turma ?? t.id) === turmaIdDesvinculada) {
              return {
                ...t,
                total_alunos: Math.max(0, (t.total_alunos ?? 1) - 1),
              };
            }
            return t;
          })
        );
      }

      dispararNotificacao(`Matrícula de ${nomeAluno} desvinculada.`);
      setMatriculaParaDesvincular(null);
      setRecargaKey((prev) => prev + 1);
    } catch (err) {
      alert(err.message || "Erro ao desvincular o estudante.");
    } finally {
      setProcessandoExclusao(false);
    }
  };

  // Turma atualmente ativa para o modal de importação de CSV
  const turmaAtivaParaCSV =
    turmas.find((t) => String(t.id_turma) === String(turmaSelecionadaId)) || turmas[0] || null;

  return (
    // `turmas-tema-gestao` ativa o novo visual escopado no Turmas.css (somente especialista e adm)
    <div className={`position-relative ${podeGerenciar ? "turmas-tema-gestao" : ""}`.trim()}>
      {/* Toast Flutuante no padrão da Biblioteca */}
      {notificacao && <div className="turmas-toast">✓ {notificacao}</div>}

      {/* Alerta de Erro de Carregamento */}
      {erroCarregamento && (
        <div
          className="alert alert-warning d-flex justify-content-between align-items-center mb-4 shadow-sm rounded-3 border-start border-4 border-warning"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">⚠️</span>
            <span className="fw-semibold text-warning-emphasis small">{erroCarregamento}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-dark rounded-pill fw-semibold"
            onClick={() => setRecargaKey((prev) => prev + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Painel Central Branco com Cantos Arredondados */}
      <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        {/* Cabeçalho Central com Título e Menu de Abas */}
        <header className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1 text-primary fs-4 turmas-header-titulo">Gestão de Turmas</h2>
              <p className="text-muted mb-0 small">
                Acompanhamento analítico, enturmação de estudantes e diários escolares consolidados.
              </p>
              {/* Linha divisória curta: só aparece no tema de gestão (CSS oculta nos demais) */}
              {podeGerenciar && <span className="turmas-header-divisor" aria-hidden="true" />}
            </div>

            {/* Frase institucional (sem ilustração), exclusiva de especialista e adm */}
            {podeGerenciar && (
              <p className="turmas-header-frase mb-0">
                Cada turma, um futuro em construção.
              </p>
            )}

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setRecargaKey((prev) => prev + 1)}
                title="Atualizar dados"
                disabled={loadingGeral}
              >
                <i className={`bi bi-arrow-clockwise me-1 ${loadingGeral ? "spinner-border spinner-border-sm" : ""}`}></i>
                Atualizar
              </button>
            </div>
          </div>

          {/* Menu de Navegação em Abas (Idêntico ao da Biblioteca) */}
          <nav className="d-flex gap-4 border-bottom pb-2" aria-label="Abas de Turmas">
            {ABAS.map((aba) => (
              <button
                key={aba.id}
                type="button"
                onClick={() => setAbaAtiva(aba.id)}
                className={`turmas-tab-btn ${abaAtiva === aba.id ? "is-active" : ""}`}
              >
                {aba.label}
              </button>
            ))}
          </nav>
        </header>

        {/* 1. Conteúdo da Aba Geral: Indicadores e Gráficos */}
        {abaAtiva === "geral" && (
          <GeralAba
            resumoGeral={resumoGeral}
            totalMatriculados={matriculas.length}
            loading={loadingGeral}
            temaGestao={podeGerenciar}
          />
        )}

        {/* 2. Conteúdo da Aba Turmas: Cards de Turma e Lista de Matriculados */}
        {abaAtiva === "turmas" && (
          <TurmasAba
            turmas={turmas}
            matriculas={matriculas}
            podeGerenciar={podeGerenciar}
            onCriarTurma={handleAbrirCriarTurma}
            onEditarTurma={handleAbrirEditarTurma}
            onVincularAluno={handleAbrirVincularAluno}
            onImportarNotas={handleAbrirImportarNotas}
            onExcluirTurma={setTurmaParaExcluir}
            onDesvincularAluno={setMatriculaParaDesvincular}
            loading={loadingGeral}
          />
        )}

        {/* 3. Conteúdo da Aba Notas: Cards de Média e Diário Escolar */}
        {abaAtiva === "notas" && (
          <NotasAba
            resumoGeral={resumoGeral}
            turmaSelecionadaId={turmaSelecionadaId}
            onSelecionarTurma={handleSelecionarTurmaNotas}
            notas={notas}
            periodoFiltro={periodoFiltro}
            onPeriodoFiltroChange={(novoPeriodo) => {
              setPeriodoFiltro(novoPeriodo);
            }}
            termoBusca={termoBuscaNota}
            onTermoBuscaChange={setTermoBuscaNota}
            podeGerenciar={podeGerenciar}
            onAbrirImportarNotas={handleAbrirImportarNotas}
            onAbrirExcluirDadosCsv={handleAbrirExcluirDadosCsv}
            loadingNotas={loadingNotas}
            trimestreAtual={obterTrimestreAtual()}
            alunosTurma={alunosTurmaSelecionada}
            alunoFiltroId={alunoFiltroNota}
            onAlunoFiltroChange={handleAlunoFiltroChange}
            onAbrirBoletimAluno={handleAbrirBoletimAluno}
          />
        )}
      </div>

      {/* Modal 1: Criar / Editar Turma */}
      <ModalTurma
        isOpen={modalTurmaAberto}
        turmaParaEditar={turmaParaEditar}
        onClose={() => setModalTurmaAberto(false)}
        onSuccess={handleSucessoTurma}
      />

      {/* Modal 2: Confirmar Matrícula de Aluno */}
      <ModalVincularAluno
        turma={turmaParaVincular}
        turmasDisponiveis={turmas}
        isOpen={modalVincularAberto}
        onClose={() => {
          setModalVincularAberto(false);
          setTurmaParaVincular(null);
        }}
        onSuccess={handleSucessoVincular}
      />

      {/* Modal 3: Importar CSV de Notas */}
      <ModalImportarNotas
        turma={turmaParaImportarCsv || turmaAtivaParaCSV}
        isOpen={modalImportarAberto}
        onClose={() => {
          setModalImportarAberto(false);
          setTurmaParaImportarCsv(null);
        }}
        onSuccess={handleSucessoImportacaoCSV}
      />

      {/* Modal 4: Confirmação de Exclusão de Turma */}
      {turmaParaExcluir && (
        <div
          className="turmas-modal-overlay"
          onClick={() => setTurmaParaExcluir(null)}
          role="presentation"
        >
          <div
            className="turmas-modal-dialog turmas-modal-dialog--sm p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-exclusao-turma-titulo"
          >
            <div className="fs-1 mb-2">🗑️</div>
            <h5 id="confirmar-exclusao-turma-titulo" className="fw-bold mb-2 text-dark">
              Excluir Turma?
            </h5>
            <p className="text-muted mb-4 small">
              Deseja realmente remover a turma <strong>"{turmaParaExcluir.nome_identificador}"</strong>?
              Esta ação só será permitida se a turma não possuir alunos ativos.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => setTurmaParaExcluir(null)}
                className="btn btn-sm btn-light border px-3 rounded-pill"
                disabled={processandoExclusao}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoTurma}
                className="btn btn-sm btn-danger px-4 fw-bold rounded-pill"
                disabled={processandoExclusao}
              >
                {processandoExclusao ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Confirmação de Desvinculação de Estudante */}
      {matriculaParaDesvincular && (
        <div
          className="turmas-modal-overlay"
          onClick={() => setMatriculaParaDesvincular(null)}
          role="presentation"
        >
          <div
            className="turmas-modal-dialog turmas-modal-dialog--sm p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-desvinculo-titulo"
          >
            <div className="fs-1 mb-2">⚠️</div>
            <h5 id="confirmar-desvinculo-titulo" className="fw-bold mb-2 text-dark">
              Desvincular Estudante?
            </h5>
            <p className="text-muted mb-4 small">
              Confirma a desvinculação de{" "}
              <strong>"{matriculaParaDesvincular.aluno?.name || matriculaParaDesvincular.name || "Estudante"}"</strong> da turma{" "}
              <strong>"{matriculaParaDesvincular.turma?.nome_identificador || matriculaParaDesvincular.turma_nome || "Turma"}"</strong>?
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => setMatriculaParaDesvincular(null)}
                className="btn btn-sm btn-light border px-3 rounded-pill"
                disabled={processandoExclusao}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesvinculacao}
                className="btn btn-sm btn-danger px-4 fw-bold rounded-pill"
                disabled={processandoExclusao}
              >
                {processandoExclusao ? "Desvinculando..." : "Sim, desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Confirmação de Exclusão de Dados do CSV */}
      {modalExcluirCsvAberto && (
        <div
          className="turmas-modal-overlay"
          onClick={() => {
            setModalExcluirCsvAberto(false);
            setTurmaParaExcluirCsv(null);
          }}
          role="presentation"
        >
          <div
            className="turmas-modal-dialog turmas-modal-dialog--sm p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-exclusao-csv-titulo"
          >
            <div className="fs-1 mb-2 text-danger">🗑️</div>
            <h5 id="confirmar-exclusao-csv-titulo" className="fw-bold mb-2 text-dark">
              Excluir Dados do CSV?
            </h5>
            <p className="text-muted mb-4 small">
              Deseja realmente excluir as notas e faltas carregadas via CSV da turma{" "}
              <strong>"{(turmaParaExcluirCsv || turmaAtivaParaCSV)?.nome_identificador}"</strong>
              {periodoFiltro ? (
                <>
                  {" "}para o período <strong>"{periodoFiltro}"</strong>
                </>
              ) : (
                " de todos os períodos"
              )}? Esta ação não poderá ser desfeita.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => {
                  setModalExcluirCsvAberto(false);
                  setTurmaParaExcluirCsv(null);
                }}
                className="btn btn-sm btn-light border px-3 rounded-pill"
                disabled={processandoExclusaoCsv}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoCsv}
                className="btn btn-sm btn-danger px-4 fw-bold rounded-pill"
                disabled={processandoExclusaoCsv}
              >
                {processandoExclusaoCsv ? "Excluindo..." : "Sim, excluir dados"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Turmas;
