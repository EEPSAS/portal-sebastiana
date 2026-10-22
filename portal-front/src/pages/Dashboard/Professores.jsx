/**
 * Professores.jsx - Painel de Controle de Professores (Especialista e Administrador)
 *
 * Papel Didático:
 * Atende às diretrizes do sistema:
 * 1. Confirmação do pertencimento escolar de professores que entram com e-mail institucional;
 * 2. Vínculo direto com disciplinas curriculares;
 * 3. Acompanhamento dos docentes ativos na instituição.
 */

import { useEffect, useState } from "react";
import {
  listarProfessores,
  listarDisciplinas,
  confirmarProfessor,
  recusarProfessor,
  vincularDisciplina,
  desvincularDisciplina,
} from "../../services/professoresService";
import ModalVincularDisciplina from "../../components/Dashboard/professores/ModalVincularDisciplina";
import "../../components/Dashboard/professores/Professores.css";

const ProfessoresPage = () => {
  // Aba ativa: 'pendentes' ou 'confirmados'
  const [abaAtiva, setAbaAtiva] = useState("pendentes");

  // Estado dos dados
  const [professores, setProfessores] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);

  // Filtros, busca e gatilho de recarga
  const [busca, setBusca] = useState("");
  const [chaveRecarga, setChaveRecarga] = useState(0);

  // Estados assíncronos
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [processandoId, setProcessandoId] = useState(null);

  // Modal de vínculos
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  // Exibe toast temporário de feedback
  const exibirFeedback = (mensagem) => {
    setFeedback(mensagem);
    setTimeout(() => setFeedback(""), 4500);
  };

  /**
   * Efeito de carregamento assíncrono dos professores e disciplinas.
   * Não executa setState síncrono no corpo do effect para prevenir cascading renders.
   */
  useEffect(() => {
    let ativo = true;

    Promise.all([
      listarProfessores({ q: busca }),
      listarDisciplinas(),
    ])
      .then(([respProfessores, listaDisciplinas]) => {
        if (!ativo) return;
        setProfessores(respProfessores.data || []);
        setPendentesCount(respProfessores.meta?.pendentes_count || 0);
        setDisciplinasCatalogo(listaDisciplinas || []);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.message || "Erro ao carregar dados dos professores.");
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [busca, chaveRecarga]);

  // Filtra em memória para permitir alternância instantânea entre as abas
  const professoresPendentes = professores.filter(
    (p) => p.status_confirmacao === "pendente"
  );
  const professoresConfirmados = professores.filter(
    (p) => p.status_confirmacao === "confirmado" || !p.status_confirmacao
  );

  /**
   * Confirma o pertencimento do professor à instituição.
   */
  const handleConfirmar = async (professorId) => {
    setProcessandoId(professorId);
    try {
      const res = await confirmarProfessor(professorId);
      exibirFeedback(res.message || "Professor confirmado com sucesso!");
      setChaveRecarga((k) => k + 1);
    } catch (err) {
      exibirFeedback(err.message || "Erro ao confirmar professor.");
    } finally {
      setProcessandoId(null);
    }
  };

  /**
   * Recusa o acesso do professor.
   */
  const handleRecusar = async (professorId) => {
    if (!window.confirm("Deseja realmente recusar o acesso institucional deste professor?")) {
      return;
    }

    setProcessandoId(professorId);
    try {
      const res = await recusarProfessor(professorId);
      exibirFeedback(res.message || "Acesso recusado.");
      setChaveRecarga((k) => k + 1);
    } catch (err) {
      exibirFeedback(err.message || "Erro ao recusar professor.");
    } finally {
      setProcessandoId(null);
    }
  };

  /**
   * Vincula uma disciplina curricular ao professor selecionado.
   */
  const handleVincularDisciplina = async (professorId, disciplinaId) => {
    const res = await vincularDisciplina(professorId, disciplinaId);
    exibirFeedback(res.message || "Disciplina vinculada com sucesso!");

    if (res.data) {
      setProfessorSelecionado(res.data);
    }
    setChaveRecarga((k) => k + 1);
  };

  /**
   * Desvincula uma disciplina curricular do professor selecionado.
   */
  const handleDesvincularDisciplina = async (professorId, disciplinaId) => {
    const res = await desvincularDisciplina(professorId, disciplinaId);
    exibirFeedback(res.message || "Disciplina desvinculada com sucesso!");

    if (res.data) {
      setProfessorSelecionado(res.data);
    }
    setChaveRecarga((k) => k + 1);
  };

  /**
   * Renderizador declarativo do conteúdo principal das abas.
   */
  const renderConteudo = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted small mt-2">Carregando professores...</p>
        </div>
      );
    }

    if (abaAtiva === "pendentes") {
      if (professoresPendentes.length === 0) {
        return (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
            <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
            <h2 className="h5 fw-bold text-dark mb-1">Nenhum professor pendente de confirmação</h2>
            <p className="small mb-0">
              Todos os professores cadastrados já foram avaliados e confirmados na instituição.
            </p>
          </div>
        );
      }

      return (
        <div className="row g-3">
          {professoresPendentes.map((prof) => (
            <div key={prof.id} className="col-12 col-lg-6">
              <div className="card professor-card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-start gap-3">
                  {/* Avatar do professor */}
                  <div
                    className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "52px", height: "52px", overflow: "hidden" }}
                  >
                    {prof.avatar ? (
                      <img
                        src={prof.avatar}
                        alt={prof.name}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-person-fill fs-3"></i>
                    )}
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                      <h2 className="h6 fw-bold text-dark mb-0">{prof.name}</h2>
                      <span className="badge badge-pendente px-2 py-1 rounded-pill small">
                        Aguardando Validação
                      </span>
                    </div>

                    <p className="text-muted small mb-2">
                      <i className="bi bi-envelope me-1"></i>
                      {prof.email}
                    </p>

                    <div className="alert alert-light border rounded-3 p-2 small text-muted mb-3">
                      <i className="bi bi-info-circle me-1 text-primary"></i>
                      Este usuário acessou via e-mail institucional e aguarda liberação para visualizar
                      turmas e notas.
                    </div>

                    {/* Botões de Ação */}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-success btn-sm px-3 fw-semibold rounded-3"
                        onClick={() => handleConfirmar(prof.id)}
                        disabled={processandoId === prof.id}
                      >
                        {processandoId === prof.id ? (
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        ) : (
                          <i className="bi bi-check-lg me-1"></i>
                        )}
                        Confirmar Vínculo
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm px-3 fw-semibold rounded-3"
                        onClick={() => handleRecusar(prof.id)}
                        disabled={processandoId === prof.id}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Aba Confirmados
    if (professoresConfirmados.length === 0) {
      return (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
          <i className="bi bi-people text-secondary fs-1 mb-3"></i>
          <h2 className="h5 fw-bold text-dark mb-1">Nenhum professor confirmado</h2>
          <p className="small mb-0">Nenhum docente ativo encontrado com o termo pesquisado.</p>
        </div>
      );
    }

    return (
      <div className="row g-3">
        {professoresConfirmados.map((prof) => (
          <div key={prof.id} className="col-12 col-xl-6">
            <div className="card professor-card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div
                    className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "52px", height: "52px", overflow: "hidden" }}
                  >
                    {prof.avatar ? (
                      <img
                        src={prof.avatar}
                        alt={prof.name}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-person-fill fs-3"></i>
                    )}
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <h2 className="h6 fw-bold text-dark mb-0">{prof.name}</h2>
                      <span className="badge badge-confirmado px-2 py-1 rounded-pill small">
                        Confirmado
                      </span>
                    </div>
                    <p className="text-muted small mb-0">
                      <i className="bi bi-envelope me-1"></i>
                      {prof.email}
                    </p>
                  </div>
                </div>

                {/* Disciplinas atribuídas */}
                <div className="mb-3">
                  <span className="text-secondary fw-semibold small d-block mb-1">
                    Disciplinas Atribuídas ({prof.disciplinas?.length || 0}):
                  </span>

                  {(!prof.disciplinas || prof.disciplinas.length === 0) ? (
                    <span className="text-muted small fst-italic">
                      Nenhuma disciplina vinculada ainda.
                    </span>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {prof.disciplinas.map((disc) => (
                        <span key={disc.id_disciplina} className="disciplina-tag">
                          <i className="bi bi-journal-bookmark text-primary"></i>
                          {disc.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do card: Resumo de turmas e Ação */}
              <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-2">
                <span className="text-muted small">
                  <i className="bi bi-people-fill me-1 text-secondary"></i>
                  {prof.total_turmas || 0} turma(s) com regência
                </span>

                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 fw-semibold rounded-3"
                  onClick={() => setProfessorSelecionado(prof)}
                >
                  <i className="bi bi-pencil-square me-1"></i>
                  Gerenciar Disciplinas
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="professores-page container-fluid px-0">
      {/* Toast flutuante de notificação */}
      {feedback && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1080 }}
          role="status"
          aria-live="polite"
        >
          <div className="toast show align-items-center text-white bg-dark border-0 shadow-lg rounded-3">
            <div className="d-flex">
              <div className="toast-body small py-2 px-3">
                <i className="bi bi-info-circle-fill me-2 text-warning"></i>
                {feedback}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setFeedback("")}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho da página */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Gestão de Professores</h1>
          <p className="text-muted small mb-0">
            Confirme o pertencimento institucional e gerencie as disciplinas curriculares dos docentes.
          </p>
        </div>

        {/* Campo de pesquisa rápida */}
        <div className="input-group" style={{ maxWidth: "320px" }}>
          <span className="input-group-text bg-white border-end-0 text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0 shadow-none"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger rounded-3 shadow-sm mb-4" role="alert">
          {erro}
        </div>
      )}

      {/* Navegação por Abas */}
      <ul className="nav nav-pills gap-2 mb-4 bg-white p-2 rounded-3 shadow-sm border">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link d-flex align-items-center gap-2 ${
              abaAtiva === "pendentes" ? "active" : ""
            }`}
            onClick={() => setAbaAtiva("pendentes")}
          >
            <i className="bi bi-hourglass-split"></i>
            <span>Pendentes de Confirmação</span>
            {pendentesCount > 0 && (
              <span className="badge rounded-pill bg-danger ms-1">
                {pendentesCount}
              </span>
            )}
          </button>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className={`nav-link d-flex align-items-center gap-2 ${
              abaAtiva === "confirmados" ? "active" : ""
            }`}
            onClick={() => setAbaAtiva("confirmados")}
          >
            <i className="bi bi-person-check-fill"></i>
            <span>Professores Confirmados</span>
            <span className="badge rounded-pill bg-secondary ms-1">
              {professoresConfirmados.length}
            </span>
          </button>
        </li>
      </ul>

      {/* Renderização do conteúdo */}
      {renderConteudo()}

      {/* Modal de Gestão de Vínculos Docentes */}
      {professorSelecionado && (
        <ModalVincularDisciplina
          professor={professorSelecionado}
          disciplinasCatalogo={disciplinasCatalogo}
          onClose={() => setProfessorSelecionado(null)}
          onVincular={handleVincularDisciplina}
          onDesvincular={handleDesvincularDisciplina}
        />
      )}
    </div>
  );
};

export default ProfessoresPage;
