/**
 * Professores.jsx - Painel de Controle de Professores (Especialista e Administrador)
 *
 * Papel Didático:
 * Atende às diretrizes de 28/10/2026 (Item 2.3.2 e Item 3.2a):
 * 1. Confirmação do pertencimento escolar de professores (@educacao) exigindo o vínculo
 *    obrigatório a pelo menos uma Disciplina da escola;
 * 2. Vínculo direto com disciplinas curriculares e exibição dos Ciclos associados;
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
import { formatarDisciplinaCiclo } from "../../utils/formatters";
import ModalVincularDisciplina from "../../components/Dashboard/professores/ModalVincularDisciplina";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import "../../components/Dashboard/professores/Professores.css";

const ProfessoresPage = () => {
  // Aba ativa: 'pendentes' ou 'confirmados'
  const [abaAtiva, setAbaAtiva] = useState("pendentes");

  // Estado dos dados
  const [professores, setProfessores] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);

  // Mapa de disciplinas selecionadas para cada professor pendente: { [profId]: [id_disciplina, ...] }
  const [disciplinasPendentesMap, setDisciplinasPendentesMap] = useState({});

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

  // Alterna seleção de uma disciplina para aprovação do professor pendente
  const toggleDisciplinaPendente = (profId, idDisciplina) => {
    setDisciplinasPendentesMap((prev) => {
      const atuais = prev[profId] || [];
      const jaTem = atuais.includes(idDisciplina);
      const novos = jaTem
        ? atuais.filter((id) => id !== idDisciplina)
        : [...atuais, idDisciplina];
      return { ...prev, [profId]: novos };
    });
  };

  /**
   * Confirma o pertencimento do professor à instituição exigindo ao menos 1 disciplina (Item 2.3.2).
   */
  const handleConfirmar = async (prof) => {
    const selecionadas = disciplinasPendentesMap[prof.id] || [];
    const jaVinculadas = (prof.disciplinas || []).map((d) => d.id_disciplina);
    const disciplinaIds = Array.from(new Set([...selecionadas, ...jaVinculadas]));

    if (disciplinaIds.length === 0) {
      exibirFeedback(
        "Selecione ao menos uma disciplina abaixo para aprovar e vincular o professor."
      );
      return;
    }

    setProcessandoId(prof.id);
    try {
      const res = await confirmarProfessor(prof.id, disciplinaIds);
      exibirFeedback(res.message || "Professor aprovado e vinculado às disciplinas com sucesso!");
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
          {professoresPendentes.map((prof) => {
            const selecionadas = disciplinasPendentesMap[prof.id] || [];

            return (
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

                      {/* Seleção Obrigatória de Disciplinas para Aprovação (Diretriz 2.3.2) */}
                      <div className="border rounded-3 p-3 bg-light mb-3">
                        <label className="form-label small fw-bold text-dark mb-2 d-block">
                          <i className="bi bi-journal-bookmark-fill text-primary me-1"></i>
                          Vincular Disciplina(s) para Aprovar Acesso (Obrigatório):
                        </label>
                        {disciplinasCatalogo.length === 0 ? (
                          <p className="text-muted small mb-0">
                            Nenhuma disciplina cadastrada. Cadastre em Acadêmico &gt; Disciplinas.
                          </p>
                        ) : (
                          <div
                            className="d-flex flex-wrap gap-2"
                            style={{ maxHeight: "140px", overflowY: "auto" }}
                          >
                            {disciplinasCatalogo.map((disc) => {
                              const marcado = selecionadas.includes(disc.id_disciplina);

                              return (
                                <button
                                  key={disc.id_disciplina}
                                  type="button"
                                  onClick={() =>
                                    toggleDisciplinaPendente(prof.id, disc.id_disciplina)
                                  }
                                  className={`btn btn-sm rounded-pill px-3 ${
                                    marcado
                                      ? "btn-primary fw-semibold"
                                      : "btn-outline-secondary bg-white"
                                  }`}
                                >
                                  <i
                                    className={`bi ${
                                      marcado ? "bi-check-circle-fill" : "bi-plus-circle"
                                    } me-1`}
                                  ></i>
                                  {formatarDisciplinaCiclo(disc)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-success btn-sm px-3 fw-semibold rounded-3"
                          onClick={() => handleConfirmar(prof)}
                          disabled={processandoId === prof.id || selecionadas.length === 0}
                        >
                          {processandoId === prof.id ? (
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          ) : (
                            <i className="bi bi-check-lg me-1"></i>
                          )}
                          Aprovar e Vincular ({selecionadas.length})
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
            );
          })}
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
                          {formatarDisciplinaCiclo(disc)}
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

    const acoesProfessores = (
    <div className="input-group" style={{ minWidth: "220px", maxWidth: "320px" }}>
      <span className="input-group-text bg-white border-end-0 text-muted">
        <i className="bi bi-search"></i>
      </span>
      <input
        type="search"
        className="form-control form-control-sm border-start-0 ps-0 shadow-none"
        placeholder="Buscar por nome ou e-mail..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </div>
  );

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

      <PainelModulo acoes={acoesProfessores}>
      {erro && (
        <div className="alert alert-danger rounded-3 shadow-sm mb-4" role="alert">
          {erro}
        </div>
      )}

      {/* Sub-abas de 2º Nível: Segmentadas e Compactas */}
      <div className="d-flex flex-wrap align-items-center gap-1 p-1 bg-light rounded-pill border mb-4 d-inline-flex">
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border-0 d-flex align-items-center gap-2 ${
            abaAtiva === "pendentes" ? "btn-primary text-white shadow-sm" : "btn-light text-muted"
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

        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold border-0 d-flex align-items-center gap-2 ${
            abaAtiva === "confirmados" ? "btn-primary text-white shadow-sm" : "btn-light text-muted"
          }`}
          onClick={() => setAbaAtiva("confirmados")}
        >
          <i className="bi bi-person-check-fill"></i>
          <span>Professores Confirmados</span>
          <span className="badge rounded-pill bg-secondary ms-1">
            {professoresConfirmados.length}
          </span>
        </button>
      </div>

      {/* Renderização do conteúdo */}
      {renderConteudo()}

      </PainelModulo>

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
