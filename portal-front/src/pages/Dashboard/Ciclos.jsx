import { useState, useEffect } from "react";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import ModalCiclo from "../../components/Dashboard/disciplinas/ModalCiclo";
import { listarDisciplinasPorCiclo, excluirCiclo } from "../../services/disciplinasService";
import { fetchTurmas } from "../../services/turmasService";
import {
  ListaTurnosConfigSchema,
  validarFormularioZod,
} from "../../utils/academicoSchemas";

/**
 * Ciclos.jsx - Gestão Integrada de Ciclos Curriculares e Turnos Escolares
 *
 * Papel Didático:
 * Atende ao Módulo Acadêmico permitindo aos Especialistas e Administradores:
 * 1. Gerenciar os Ciclos Escolares (1º Ano, 2º Ano, etc.), suas matrizes e turmas vinculadas;
 * 2. Configurar diretamente os Turnos em funcionamento na escola (Matutino, Vespertino, Noturno e Integral),
 *    seus intervalos operacionais e o monitoramento das turmas ativas em cada turno.
 */
export default function CiclosPage() {
  const [abaAtiva, setAbaAtiva] = useState("ciclos"); // "ciclos" | "turnos"
  const [ciclos, setCiclos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Modal de criação / edição de Ciclo
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [cicloEmEdicao, setCicloEmEdicao] = useState(null);
  const [excluindoCicloId, setExcluindoCicloId] = useState(null);

  // Configuração direta dos Turnos da Escola (persistência ágil local / institucional)
  const TURNOS_PADRAO = [
    {
      id: "Matutino",
      nome: "Matutino",
      inicio: "07:00",
      fim: "11:30",
      ativo: true,
      descricao: "Turno da manhã, com 5 aulas de 50 minutos e 20 minutos de recreio.",
      icone: "bi-sun-fill",
      cor: "warning",
    },
    {
      id: "Vespertino",
      nome: "Vespertino",
      inicio: "13:00",
      fim: "17:30",
      ativo: true,
      descricao: "Turno da tarde, com 5 aulas de 50 minutos e 20 minutos de recreio.",
      icone: "bi-brightness-alt-high-fill",
      cor: "primary",
    },
    {
      id: "Noturno",
      nome: "Noturno",
      inicio: "18:45",
      fim: "22:15",
      ativo: false,
      descricao: "Turno da noite, voltado prioritariamente para EJA e Cursos Noturnos.",
      icone: "bi-moon-stars-fill",
      cor: "indigo",
    },
    {
      id: "Integral",
      nome: "Integral",
      inicio: "07:00",
      fim: "16:40",
      ativo: true,
      descricao: "Jornada ampliada do Ensino Médio de Tempo Integral (EMTI).",
      icone: "bi-clock-history",
      cor: "success",
    },
  ];

  // Revalida o JSON salvo em localStorage via Zod para evitar estado corrompido ou fora do contrato
  const [turnos, setTurnos] = useState(() => {
    try {
      const salvo = localStorage.getItem("portal_sebastiana_turnos_config");
      if (!salvo) return TURNOS_PADRAO;
      const validado = ListaTurnosConfigSchema.safeParse(JSON.parse(salvo));
      return validado.success ? validado.data : TURNOS_PADRAO;
    } catch {
      return TURNOS_PADRAO;
    }
  });

  const carregarDados = async () => {
    setLoading(true);
    setErro("");
    try {
      const [resCiclos, resTurmas] = await Promise.all([
        listarDisciplinasPorCiclo(),
        fetchTurmas(),
      ]);
      setCiclos(resCiclos?.ciclos || []);
      const listaTurmas = Array.isArray(resTurmas)
        ? resTurmas
        : resTurmas?.data || [];
      setTurmas(listaTurmas);
    } catch (err) {
      setErro(err.message || "Erro ao carregar dados de ciclos e turmas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarDisciplinasPorCiclo(), fetchTurmas()])
      .then(([resCiclos, resTurmas]) => {
        if (!cancelado) {
          setCiclos(resCiclos?.ciclos || []);
          const listaTurmas = Array.isArray(resTurmas)
            ? resTurmas
            : resTurmas?.data || [];
          setTurmas(listaTurmas);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err.message || "Erro ao carregar dados de ciclos e turmas.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Aplica revalidação Zod (inclusive garantindo término > início nos turnos ativos) antes de persistir
  const handleSalvarTurnos = (novosTurnos) => {
    setTurnos(novosTurnos);

    const checkTurnos = validarFormularioZod(ListaTurnosConfigSchema, novosTurnos);
    if (!checkTurnos.valido) {
      setMensagemSucesso("");
      setErro(checkTurnos.mensagem);
      return;
    }

    setErro("");
    try {
      localStorage.setItem(
        "portal_sebastiana_turnos_config",
        JSON.stringify(checkTurnos.dados)
      );
      setMensagemSucesso("Configuração dos turnos escolares atualizada com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch {
      // Ignora erro de storage local
    }
  };

  const handleToggleTurno = (idTurno) => {
    const atualizados = turnos.map((t) =>
      t.id === idTurno ? { ...t, ativo: !t.ativo } : t
    );
    handleSalvarTurnos(atualizados);
  };

  const handleAlterarHorario = (idTurno, campo, valor) => {
    const atualizados = turnos.map((t) =>
      t.id === idTurno ? { ...t, [campo]: valor } : t
    );
    handleSalvarTurnos(atualizados);
  };

  const handleAbrirCriarCiclo = () => {
    setCicloEmEdicao(null);
    setModalCicloAberto(true);
  };

  const handleAbrirEditarCiclo = (ciclo) => {
    setCicloEmEdicao(ciclo);
    setModalCicloAberto(true);
  };

  const handleExcluirCiclo = async (ciclo) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o Ciclo "${ciclo.nome}"? As disciplinas e turmas continuarão salvas, apenas desvinculadas deste ciclo.`
      )
    ) {
      return;
    }

    setExcluindoCicloId(ciclo.id_ciclo);
    try {
      await excluirCiclo(ciclo.id_ciclo);
      setMensagemSucesso(`Ciclo "${ciclo.nome}" excluído com sucesso.`);
      await carregarDados();
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      setErro(err.message || "Falha ao excluir o ciclo.");
    } finally {
      setExcluindoCicloId(null);
    }
  };

  const abasCustomizadas = [
    { id: "ciclos", label: "Ciclos Escolares", icone: "bi-layers-fill" },
    { id: "turnos", label: "Turnos de Funcionamento", icone: "bi-clock-fill" },
  ];

  return (
    <PainelModulo
      titulo="Ciclos e Turnos Escolares"
      subtitulo="Configuração dos ciclos da matriz curricular e dos turnos de funcionamento da instituição."
      icone="bi-arrow-repeat"
      mostrarNav={true}
      abasCustomizadas={abasCustomizadas}
      abaAtivaCustomizada={abaAtiva}
      onTrocarAba={setAbaAtiva}
      acoesBoasVindas={
        abaAtiva === "ciclos" && (
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
            onClick={handleAbrirCriarCiclo}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Novo Ciclo</span>
          </button>
        )
      }
    >
      {/* Alertas de Notificação */}
      {mensagemSucesso && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill fs-5 text-success"></i>
          <div>{mensagemSucesso}</div>
          <button type="button" className="btn-close" onClick={() => setMensagemSucesso("")} aria-label="Fechar"></button>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger alert-dismissible fade show rounded-4 mb-4 d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
          <div>{erro}</div>
          <button type="button" className="btn-close" onClick={() => setErro("")} aria-label="Fechar"></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="text-muted mt-2 small">Carregando configurações escolares...</p>
        </div>
      ) : abaAtiva === "ciclos" ? (
        /* ABA 1: CICLOS ESCOLARES */
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Matriz por Ciclos</h5>
              <small className="text-muted">
                Agrupamentos de anos e séries que compartilham a mesma grade de disciplinas.
              </small>
            </div>
          </div>

          {ciclos.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-4 border p-4">
              <i className="bi bi-layers fs-1 text-muted d-block mb-2"></i>
              <h6 className="fw-bold text-dark">Nenhum ciclo cadastrado</h6>
              <p className="text-muted small mb-3">
                Crie os ciclos curriculares da escola (ex: 1º Ano Ensino Médio, 2º Ano, etc.) para organizar turmas e matérias.
              </p>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 fw-semibold"
                onClick={handleAbrirCriarCiclo}
              >
                <i className="bi bi-plus-lg me-1"></i> Cadastrar Primeiro Ciclo
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {ciclos.map((ciclo) => {
                const turmasDoCiclo = turmas.filter(
                  (t) => String(t.ciclo_id) === String(ciclo.id_ciclo)
                );
                const qtdDisciplinas = ciclo.disciplinas?.length || 0;
                const qtdTurmas = turmasDoCiclo.length;

                return (
                  <div key={ciclo.id_ciclo} className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100 border rounded-4 shadow-sm p-3 bg-white d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                              style={{ width: "40px", height: "40px", fontSize: "1.2rem" }}
                            >
                              <i className="bi bi-layers-fill"></i>
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0 text-dark">{ciclo.nome}</h6>
                              <span className="badge bg-light text-secondary border">
                                ID #{ciclo.id_ciclo}
                              </span>
                            </div>
                          </div>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-sm btn-light border rounded-pill px-2 py-1"
                              onClick={() => handleAbrirEditarCiclo(ciclo)}
                              title="Editar Ciclo"
                            >
                              <i className="bi bi-pencil-fill small text-muted"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border rounded-pill px-2 py-1 ms-1 text-danger"
                              onClick={() => handleExcluirCiclo(ciclo)}
                              disabled={excluindoCicloId === ciclo.id_ciclo}
                              title="Excluir Ciclo"
                            >
                              {excluindoCicloId === ciclo.id_ciclo ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash3-fill small"></i>
                              )}
                            </button>
                          </div>
                        </div>

                        {ciclo.descricao ? (
                          <p className="text-secondary small mb-3" style={{ minHeight: "38px" }}>
                            {ciclo.descricao}
                          </p>
                        ) : (
                          <p className="text-muted small fst-italic mb-3" style={{ minHeight: "38px" }}>
                            Sem descrição cadastrada.
                          </p>
                        )}

                        <div className="d-flex align-items-center gap-3 pt-2 border-top">
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <i className="bi bi-journal-bookmark-fill text-primary"></i>
                            <span><strong>{qtdDisciplinas}</strong> disciplinas</span>
                          </div>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <i className="bi bi-people-fill text-success"></i>
                            <span><strong>{qtdTurmas}</strong> turmas</span>
                          </div>
                        </div>
                      </div>

                      {turmasDoCiclo.length > 0 && (
                        <div className="mt-3 pt-2 border-top">
                          <small className="text-muted d-block fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
                            TURMAS VINCULADAS:
                          </small>
                          <div className="d-flex flex-wrap gap-1">
                            {turmasDoCiclo.map((t) => (
                              <span key={t.id_turma} className="badge bg-light text-dark border small fw-normal">
                                {t.nome_identificador}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ABA 2: TURNOS ESCOLARES (Configuração Direta e Sem Sobrecarga) */
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Turnos da Escola</h5>
              <small className="text-muted">
                Configure os horários oficiais e controle a oferta de períodos de aula na instituição.
              </small>
            </div>
          </div>

          <div className="row g-3">
            {turnos.map((turno) => {
              const turmasDoTurno = turmas.filter(
                (t) => String(t.turno).toLowerCase() === String(turno.id).toLowerCase()
              );

              return (
                <div key={turno.id} className="col-12 col-md-6 col-xl-3">
                  <div
                    className={`card h-100 rounded-4 border shadow-sm p-3 bg-white transition-all ${
                      turno.ativo ? "" : "opacity-75 bg-light"
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center ${
                            turno.ativo ? "bg-primary-subtle text-primary" : "bg-secondary-subtle text-muted"
                          }`}
                          style={{ width: "38px", height: "38px", fontSize: "1.1rem" }}
                        >
                          <i className={`bi ${turno.icone}`}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">{turno.nome}</h6>
                          <small className={turno.ativo ? "text-success fw-semibold" : "text-muted"}>
                            {turno.ativo ? "Em Funcionamento" : "Desativado"}
                          </small>
                        </div>
                      </div>

                      {/* Switch de Ativação Direta */}
                      <div className="form-check form-switch m-0">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          role="switch"
                          checked={turno.ativo}
                          onChange={() => handleToggleTurno(turno.id)}
                          title={`Alternar ativação do turno ${turno.nome}`}
                        />
                      </div>
                    </div>

                    <p className="text-secondary small mb-3" style={{ minHeight: "40px" }}>
                      {turno.descricao}
                    </p>

                    {/* Definição de Horários Direta */}
                    <div className="p-2 rounded-3 bg-light border mb-3">
                      <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.68rem" }}>
                        Horário de Funcionamento
                      </small>
                      <div className="row g-2 align-items-center">
                        <div className="col-6">
                          <label
                            htmlFor={`turno-inicio-${turno.id}`}
                            className="text-muted small"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Início
                          </label>
                          <input
                            id={`turno-inicio-${turno.id}`}
                            type="time"
                            className="form-control form-control-sm text-center fw-semibold"
                            value={turno.inicio}
                            onChange={(e) => handleAlterarHorario(turno.id, "inicio", e.target.value)}
                            disabled={!turno.ativo}
                          />
                        </div>
                        <div className="col-6">
                          <label
                            htmlFor={`turno-fim-${turno.id}`}
                            className="text-muted small"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Término
                          </label>
                          <input
                            id={`turno-fim-${turno.id}`}
                            type="time"
                            className="form-control form-control-sm text-center fw-semibold"
                            value={turno.fim}
                            onChange={(e) => handleAlterarHorario(turno.id, "fim", e.target.value)}
                            disabled={!turno.ativo}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Turmas em funcionamento no turno */}
                    <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Turmas Ativas:</span>
                      <span className="badge rounded-pill bg-primary px-2 py-1">
                        {turmasDoTurno.length} {turmasDoTurno.length === 1 ? "turma" : "turmas"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Criar / Editar Ciclo */}
      {modalCicloAberto && (
        <ModalCiclo
          ciclo={cicloEmEdicao}
          onFechar={() => setModalCicloAberto(false)}
          onSalvo={async () => {
            setModalCicloAberto(false);
            setMensagemSucesso(
              cicloEmEdicao
                ? `Ciclo "${cicloEmEdicao.nome}" atualizado com sucesso!`
                : "Novo ciclo escolar cadastrado com sucesso!"
            );
            await carregarDados();
            setTimeout(() => setMensagemSucesso(""), 4000);
          }}
        />
      )}
    </PainelModulo>
  );
}
