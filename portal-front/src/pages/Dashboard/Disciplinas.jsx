/**
 * Disciplinas.jsx - Módulo Acadêmico de Catálogo e Gestão de Disciplinas
 *
 * Papel Didático:
 * Atende à reformulação solicitada:
 * - Em Disciplinas, a exibição é direta por Disciplina (sem agrupamento por ciclos);
 * - Cada card apresenta:
 *    1. Nome oficial da disciplina e carga horária (aulas/sem e anual);
 *    2. Ciclos aos quais a disciplina pertence (badges interativos);
 *    3. Professores vinculados (docentes responsáveis);
 *    4. Acesso ao Plano Pedagógico (Ementa, Habilidades BNCC, Objetivos);
 *    5. Ações gerenciais para Especialista e Administrador (Editar, Excluir).
 * - O agrupamento por ciclos e a vinculação de disciplinas aos ciclos ficam concentrados em Ciclos.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import ModalCiclo from "../../components/Dashboard/disciplinas/ModalCiclo";
import ModalDisciplina from "../../components/Dashboard/disciplinas/ModalDisciplina";
import ModalDetalhesDisciplina from "../../components/Dashboard/disciplinas/ModalDetalhesDisciplina";
import {
  listarDisciplinas,
  listarCiclos,
  excluirDisciplina,
} from "../../services/disciplinasService";

const DisciplinasPage = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  const [disciplinas, setDisciplinas] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [recargaKey, setRecargaKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  // Modais
  const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState(null);
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState(null);
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);

  const exibirFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  };

  useEffect(() => {
    let ativo = true;

    Promise.all([listarDisciplinas(), listarCiclos()])
      .then(([dadosDisciplinas, dadosCiclos]) => {
        if (!ativo) return;
        setDisciplinas(Array.isArray(dadosDisciplinas) ? dadosDisciplinas : []);
        setCiclos(Array.isArray(dadosCiclos) ? dadosCiclos : []);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.message || "Não foi possível carregar as disciplinas.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [recargaKey]);

  const handleAbrirNovaDisciplina = () => {
    setDisciplinaEmEdicao(null);
    setModalDisciplinaAberto(true);
  };

  const handleAbrirEditarDisciplina = (disc) => {
    setDisciplinaEmEdicao(disc);
    setModalDisciplinaAberto(true);
  };

  const handleDisciplinaSalva = (discSalva, mensagem) => {
    setModalDisciplinaAberto(false);
    setDisciplinaEmEdicao(null);
    exibirFeedback(mensagem || "Disciplina salva com sucesso!");
    setRecargaKey((k) => k + 1);
  };

  const handleNovoCicloSalvo = (cicloSalvo) => {
    setModalCicloAberto(false);
    if (cicloSalvo?.id_ciclo) {
      setCiclos((prev) => [...prev, cicloSalvo]);
    }
    exibirFeedback("Novo ciclo cadastrado com sucesso!");
  };

  const handleExcluirDisciplina = async (disc) => {
    if (
      !window.confirm(
        `Deseja realmente remover a disciplina "${disc.nome}" do catálogo escolar?`
      )
    ) {
      return;
    }

    setExcluindoId(disc.id_disciplina);
    try {
      await excluirDisciplina(disc.id_disciplina);
      exibirFeedback("Disciplina removida com sucesso do catálogo.");
      setRecargaKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Não foi possível remover a disciplina.");
    } finally {
      setExcluindoId(null);
    }
  };

  // Filtragem local por termo e por ciclo
  const termoFiltro = busca.trim().toLowerCase();
  const disciplinasFiltradas = disciplinas.filter((d) => {
    const atendeTexto =
      !termoFiltro ||
      String(d.nome || "").toLowerCase().includes(termoFiltro) ||
      String(d.ementa || "").toLowerCase().includes(termoFiltro) ||
      String(d.habilidades_bncc || "").toLowerCase().includes(termoFiltro);

    const atendeCiclo =
      !filtroCiclo ||
      (Array.isArray(d.ciclos) &&
        d.ciclos.some((c) => String(c.id_ciclo) === String(filtroCiclo)));

    return atendeTexto && atendeCiclo;
  });

  const acoesDisciplinas = (
    <div className="d-flex align-items-center gap-2">
      {podeGerenciar && (
        <button
          type="button"
          className="btn btn-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2 shadow-sm"
          onClick={handleAbrirNovaDisciplina}
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Nova Disciplina</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="position-relative">
      {feedback && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {feedback}
        </div>
      )}

      <PainelModulo acoes={acoesDisciplinas}>
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-4" role="alert">
            {erro}
          </div>
        )}

        {/* Barra de Filtros e Busca Rápida */}
        <div className="card border-0 bg-light rounded-4 p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Pesquisar por disciplina, BNCC ou ementa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {busca && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary bg-white border-start-0"
                    onClick={() => setBusca("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <select
                className="form-select form-select-sm"
                value={filtroCiclo}
                onChange={(e) => setFiltroCiclo(e.target.value)}
              >
                <option value="">Todos os Ciclos</option>
                {ciclos.map((c) => (
                  <option key={c.id_ciclo} value={c.id_ciclo}>
                    Filtrar por: {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-lg-3 text-lg-end text-muted small">
              <strong>{disciplinasFiltradas.length}</strong> de{" "}
              <strong>{disciplinas.length}</strong> disciplina(s)
            </div>
          </div>
        </div>

        {/* Estado de Carregamento */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Carregando catálogo de disciplinas...</p>
          </div>
        ) : disciplinasFiltradas.length === 0 ? (
          <div className="text-center py-5 border rounded-4 bg-light">
            <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
            <h2 className="h5 fw-bold text-dark">Nenhuma disciplina encontrada</h2>
            <p className="text-muted small mb-3">
              {busca || filtroCiclo
                ? "Tente ajustar ou limpar os filtros para localizar as disciplinas."
                : "Cadastre as disciplinas da matriz curricular da escola."}
            </p>
            {podeGerenciar && (
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 fw-semibold"
                onClick={handleAbrirNovaDisciplina}
              >
                <i className="bi bi-plus-lg me-1"></i> Cadastrar Primeira Disciplina
              </button>
            )}
          </div>
        ) : (
          /* Grid Direto de Disciplinas (Conforme Requisito: Sem Agrupamento por Ciclos) */
          <div className="row g-3">
            {disciplinasFiltradas.map((disc) => {
              const aulasSem =
                disc.aulas_semanais ||
                Math.max(1, Math.round((disc.carga_horaria_anual || 160) / 40));
              const totalAulas =
                disc.total_aulas_anuais ||
                disc.carga_horaria_anual ||
                aulasSem * 40;

              return (
                <div className="col-12 col-md-6 col-xl-4" key={disc.id_disciplina}>
                  <div className="card h-100 border rounded-4 shadow-sm bg-white p-3 d-flex flex-column justify-content-between">
                    <div>
                      {/* Topo do Card: Nome e Carga Horária */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h3 className="h6 fw-bold text-dark mb-0" title={disc.nome}>
                          {disc.nome}
                        </h3>
                        <span className="badge bg-primary-subtle text-primary rounded-pill text-nowrap">
                          {aulasSem} a/sem • {totalAulas} a/ano
                        </span>
                      </div>

                      {/* Ciclos aos quais a disciplina pertence */}
                      <div className="mb-2">
                        <small className="text-muted d-block fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
                          CICLOS VINCULADOS:
                        </small>
                        {Array.isArray(disc.ciclos) && disc.ciclos.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {disc.ciclos.map((c) => (
                              <span
                                key={c.id_ciclo}
                                className="badge bg-secondary-subtle text-dark rounded-pill"
                                style={{ fontSize: "0.72rem" }}
                              >
                                <i className="bi bi-diagram-3 me-1 text-secondary"></i>
                                {c.nome}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            className="badge bg-warning-subtle text-dark rounded-pill"
                            style={{ fontSize: "0.72rem" }}
                          >
                            <i className="bi bi-exclamation-triangle me-1 text-warning"></i>
                            Não vinculada a ciclos
                          </span>
                        )}
                      </div>

                      {/* Professores Vinculados */}
                      <div className="mb-2">
                        <small className="text-muted d-block fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
                          DOCENTE(S):
                        </small>
                        {Array.isArray(disc.professores) && disc.professores.length > 0 ? (
                          <div className="small text-secondary text-truncate" title={disc.professores.map((p) => p.name).join(", ")}>
                            <i className="bi bi-person-badge me-1 text-primary"></i>
                            {disc.professores.map((p) => p.name).join(", ")}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic small">
                            Nenhum professor vinculado ainda.
                          </span>
                        )}
                      </div>

                      {/* Resumo de Ementa ou BNCC */}
                      {disc.ementa && (
                        <p
                          className="text-muted small mb-2"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          <strong>Ementa:</strong> {disc.ementa}
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Card com Ações */}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none px-0 fw-semibold text-primary"
                        onClick={() => setDisciplinaDetalhe(disc)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        Plano Pedagógico
                      </button>

                      {podeGerenciar && (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-start-pill px-2"
                            onClick={() => handleAbrirEditarDisciplina(disc)}
                            title="Editar disciplina"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger rounded-end-pill px-2"
                            onClick={() => handleExcluirDisciplina(disc)}
                            disabled={excluindoId === disc.id_disciplina}
                            title="Excluir disciplina do catálogo"
                          >
                            {excluindoId === disc.id_disciplina ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PainelModulo>

      {/* Modal Reutilizável de Criação / Edição de Disciplina */}
      <ModalDisciplina
        aberto={modalDisciplinaAberto}
        disciplina={disciplinaEmEdicao}
        ciclos={ciclos}
        onFechar={() => {
          setModalDisciplinaAberto(false);
          setDisciplinaEmEdicao(null);
        }}
        onSalvo={handleDisciplinaSalva}
        onAbrirModalCiclo={() => setModalCicloAberto(true)}
      />

      {/* Modal de Detalhes Pedagógicos */}
      <ModalDetalhesDisciplina
        disciplina={disciplinaDetalhe}
        onFechar={() => setDisciplinaDetalhe(null)}
      />

      {/* Modal de Criação Rápida de Ciclo (+ dentro do modal de disciplina) */}
      {modalCicloAberto && (
        <ModalCiclo
          ciclo={null}
          onFechar={() => setModalCicloAberto(false)}
          onSalvo={handleNovoCicloSalvo}
        />
      )}
    </div>
  );
};

export default DisciplinasPage;
