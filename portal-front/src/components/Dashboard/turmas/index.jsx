import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import {
  cancelarMatriculaAluno,
  excluirTurma,
  fetchMatriculas,
  fetchResumoGeral,
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
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  // Estados de navegação
  const [abaAtiva, setAbaAtiva] = useState("geral");

  // Dados centrais
  const [turmas, setTurmas] = useState([]);
  const [resumoGeral, setResumoGeral] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  // Dados da aba de notas
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");
  const [notas, setNotas] = useState([]);
  const [periodoFiltro, setPeriodoFiltro] = useState("");
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

  // Modais de confirmação de exclusão / desvinculação
  const [turmaParaExcluir, setTurmaParaExcluir] = useState(null);
  const [matriculaParaDesvincular, setMatriculaParaDesvincular] = useState(null);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);

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
      fetchTurmas().catch(() => []),
      fetchResumoGeral().catch(() => []),
      fetchMatriculas().catch(() => []),
    ])
      .then(([dadosTurmas, dadosResumo, dadosMatriculas]) => {
        if (!cancelado) {
          setTurmas(dadosTurmas || []);
          setResumoGeral(dadosResumo || []);
          setMatriculas(dadosMatriculas || []);

          // Seleciona a primeira turma se nenhuma estiver selecionada
          if (dadosTurmas && dadosTurmas.length > 0 && !turmaSelecionadaId) {
            setTurmaSelecionadaId(String(dadosTurmas[0].id_turma));
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
  }, [recargaKey, turmaSelecionadaId]);

  /**
   * 2. Efeito de Notas: Atualiza a lista de notas sempre que a turma ou período mudarem.
   */
  useEffect(() => {
    if (!turmaSelecionadaId) return;

    let cancelado = false;

    fetchTurmaNotas(turmaSelecionadaId, { periodo: periodoFiltro })
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
  }, [turmaSelecionadaId, periodoFiltro, recargaKey]);

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
    setLoadingNotas(true);
    setTurmaSelecionadaId(idTurma);
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
      await cancelarMatriculaAluno(matriculaParaDesvincular.id_matricula, { status: "Evadido" });
      dispararNotificacao(`Matrícula de ${matriculaParaDesvincular.aluno?.name} desvinculada.`);
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
    <div className="position-relative">
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
              <h2 className="fw-bold mb-1 text-primary fs-4">Gestão de Turmas</h2>
              <p className="text-muted mb-0 small">
                Acompanhamento analítico, enturmação de estudantes e diários escolares consolidados.
              </p>
            </div>

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
              setLoadingNotas(true);
              setPeriodoFiltro(novoPeriodo);
            }}
            termoBusca={termoBuscaNota}
            onTermoBuscaChange={setTermoBuscaNota}
            podeGerenciar={podeGerenciar}
            onAbrirImportarNotas={() => setModalImportarAberto(true)}
            loadingNotas={loadingNotas}
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
        turma={turmaAtivaParaCSV}
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
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
              <strong>"{matriculaParaDesvincular.aluno?.name}"</strong> da turma{" "}
              <strong>"{matriculaParaDesvincular.turma?.nome_identificador}"</strong>?
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
    </div>
  );
};

export default Turmas;
