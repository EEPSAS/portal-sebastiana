/**
 * Ciclos.jsx - Gestão Integrada de Ciclos Curriculares, Matriz por Ciclos e Turnos Escolares
 *
 * Papel Didático:
 * Atende à reformulação solicitada:
 * 1. A visualização de Disciplinas AGRUPADAS POR CICLO fica concentrada nesta tela;
 * 2. Em cada Ciclo, o Especialista/Administrador pode:
 *    - Visualizar todas as disciplinas vinculadas àquele Ciclo;
 *    - Adicionar uma nova disciplina ao Ciclo (mesmo modal completo de Disciplinas);
 *    - Vincular uma disciplina existente ao Ciclo através de um <select> dedicado
 *      com todas as disciplinas do catálogo que ainda não possuem vínculo naquele ciclo;
 *    - Desvincular uma disciplina do Ciclo (preservando-a no catálogo escolar);
 *    - Editar e excluir o Ciclo escolar;
 * 3. Gestão dos Turnos de Funcionamento da escola na aba complementar;
 * 4. ModuloNav perfeitamente integrado exibindo o menu acadêmico completo.
 */

import { useState, useEffect } from "react";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import ModalCiclo from "../../components/Dashboard/disciplinas/ModalCiclo";
import ModalDisciplina from "../../components/Dashboard/disciplinas/ModalDisciplina";
import ModalDetalhesDisciplina from "../../components/Dashboard/disciplinas/ModalDetalhesDisciplina";
import {
  listarDisciplinasPorCiclo,
  listarDisciplinas,
  excluirCiclo,
  vincularDisciplinaAoCiclo,
  desvincularDisciplinaDoCiclo,
} from "../../services/disciplinasService";
import { fetchTurmas } from "../../services/turmasService";
import {
  ListaTurnosConfigSchema,
  validarFormularioZod,
} from "../../utils/academicoSchemas";
import { useAuth } from "../../hooks/useAuth";

export default function CiclosPage() {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  const [abaAtiva, setAbaAtiva] = useState("ciclos"); // "ciclos" | "turnos"
  const [ciclos, setCiclos] = useState([]);
  const [todasDisciplinas, setTodasDisciplinas] = useState([]);
  const [disciplinasSemCiclo, setDisciplinasSemCiclo] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Estado dos selects de vínculo rápido por ciclo { [id_ciclo]: id_disciplina_selecionada }
  const [disciplinaSelecionadaParaVincular, setDisciplinaSelecionadaParaVincular] = useState({});
  const [vinculandoPorCicloId, setVinculandoPorCicloId] = useState(null);
  const [desvinculandoChave, setDesvinculandoChave] = useState(null);

  // Modais
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [cicloEmEdicao, setCicloEmEdicao] = useState(null);
  const [excluindoCicloId, setExcluindoCicloId] = useState(null);

  const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState(null);
  const [cicloPreSelecionadoId, setCicloPreSelecionadoId] = useState(null);
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState(null);

  // Configuração dos Turnos da Escola
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
      const [resCiclos, resDisciplinas, resTurmas] = await Promise.all([
        listarDisciplinasPorCiclo(),
        listarDisciplinas(),
        fetchTurmas(),
      ]);

      setCiclos(resCiclos?.ciclos || []);
      setDisciplinasSemCiclo(resCiclos?.disciplinas_sem_ciclo || []);
      setTodasDisciplinas(Array.isArray(resDisciplinas) ? resDisciplinas : []);

      const listaTurmas = Array.isArray(resTurmas)
        ? resTurmas
        : resTurmas?.data || [];
      setTurmas(listaTurmas);
    } catch (err) {
      setErro(err.message || "Erro ao carregar dados de ciclos e disciplinas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarDisciplinasPorCiclo(), listarDisciplinas(), fetchTurmas()])
      .then(([resCiclos, resDisciplinas, resTurmas]) => {
        if (!cancelado) {
          setCiclos(resCiclos?.ciclos || []);
          setDisciplinasSemCiclo(resCiclos?.disciplinas_sem_ciclo || []);
          setTodasDisciplinas(Array.isArray(resDisciplinas) ? resDisciplinas : []);
          const listaTurmas = Array.isArray(resTurmas)
            ? resTurmas
            : resTurmas?.data || [];
          setTurmas(listaTurmas);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err.message || "Erro ao carregar dados de ciclos e disciplinas.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const exibirSucesso = (msg) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 4500);
  };

  // Turnos
  const handleSalvarTurnos = (novosTurnos) => {
    setTurnos(novosTurnos);
    const checkTurnos = validarFormularioZod(ListaTurnosConfigSchema, novosTurnos);
    if (!checkTurnos.valido) {
      setErro(checkTurnos.mensagem);
      return;
    }
    setErro("");
    try {
      localStorage.setItem(
        "portal_sebastiana_turnos_config",
        JSON.stringify(checkTurnos.dados)
      );
      exibirSucesso("Configuração dos turnos escolares atualizada com sucesso!");
    } catch {
      // Ignora erro
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

  // Ciclos
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
        `Tem certeza que deseja excluir o Ciclo "${ciclo.nome}"? As disciplinas continuarão salvas no catálogo escolar, apenas desvinculadas deste ciclo.`
      )
    ) {
      return;
    }

    setExcluindoCicloId(ciclo.id_ciclo);
    try {
      await excluirCiclo(ciclo.id_ciclo);
      exibirSucesso(`Ciclo "${ciclo.nome}" excluído com sucesso.`);
      await carregarDados();
    } catch (err) {
      setErro(err.message || "Falha ao excluir o ciclo.");
    } finally {
      setExcluindoCicloId(null);
    }
  };

  // Disciplinas no Ciclo
  const handleAbrirAdicionarDisciplinaAoCiclo = (idCiclo) => {
    setCicloPreSelecionadoId(idCiclo);
    setDisciplinaEmEdicao(null);
    setModalDisciplinaAberto(true);
  };

  const handleAbrirEditarDisciplina = (disc) => {
    setCicloPreSelecionadoId(null);
    setDisciplinaEmEdicao(disc);
    setModalDisciplinaAberto(true);
  };

  const handleDisciplinaSalva = async (discSalva, mensagem) => {
    setModalDisciplinaAberto(false);
    setDisciplinaEmEdicao(null);
    setCicloPreSelecionadoId(null);
    exibirSucesso(mensagem || "Disciplina salva com sucesso!");
    await carregarDados();
  };

  // Vínculo rápido de disciplina existente a um ciclo
  const handleVincularDisciplinaExistente = async (idCiclo) => {
    const idDisciplina = disciplinaSelecionadaParaVincular[idCiclo];
    if (!idDisciplina) {
      alert("Selecione uma disciplina existente para vincular a este ciclo.");
      return;
    }

    setVinculandoPorCicloId(idCiclo);
    try {
      const res = await vincularDisciplinaAoCiclo(idCiclo, idDisciplina);
      exibirSucesso(res?.message || "Disciplina vinculada ao ciclo com sucesso!");
      // Limpa a seleção daquele ciclo
      setDisciplinaSelecionadaParaVincular((prev) => ({
        ...prev,
        [idCiclo]: "",
      }));
      await carregarDados();
    } catch (err) {
      alert(err.message || "Erro ao vincular a disciplina ao ciclo.");
    } finally {
      setVinculandoPorCicloId(null);
    }
  };

  // Desvinculação de disciplina do ciclo
  const handleDesvincularDisciplina = async (ciclo, disc) => {
    if (
      !window.confirm(
        `Deseja desvincular a disciplina "${disc.nome}" do ciclo "${ciclo.nome}"?\n\nA disciplina continuará salva no catálogo escolar.`
      )
    ) {
      return;
    }

    const chave = `${ciclo.id_ciclo}-${disc.id_disciplina}`;
    setDesvinculandoChave(chave);
    try {
      const res = await desvincularDisciplinaDoCiclo(ciclo.id_ciclo, disc.id_disciplina);
      exibirSucesso(res?.message || "Disciplina desvinculada do ciclo com sucesso!");
      await carregarDados();
    } catch (err) {
      alert(err.message || "Erro ao desvincular a disciplina do ciclo.");
    } finally {
      setDesvinculandoChave(null);
    }
  };

  const acoesCiclos = (
    <div className="d-flex align-items-center gap-2">
      {podeGerenciar && (
        <button
          type="button"
          className="btn btn-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2 shadow-sm"
          onClick={handleAbrirCriarCiclo}
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Novo Ciclo</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="position-relative">
      {mensagemSucesso && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {mensagemSucesso}
        </div>
      )}

      {/* PainelModulo com ModuloNav Acadêmico padrão (Turmas, Boletim, Professores, Disciplinas, Período Letivo, Ciclos) */}
      <PainelModulo
        titulo="Ciclos Curriculares e Turnos"
        subtitulo="Gestão dos agrupamentos curriculares, matriz por ciclos e turnos escolares da instituição."
        icone="bi-arrow-repeat"
        acoes={acoesCiclos}
      >
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-4" role="alert">
            {erro}
          </div>
        )}

        {/* Sub-navegação interna entre Ciclos e Turnos */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom">
          <div className="btn-group p-1 bg-light rounded-pill border" role="group">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold transition-all ${
                abaAtiva === "ciclos"
                  ? "btn-primary shadow-sm"
                  : "btn-light text-secondary border-0"
              }`}
              onClick={() => setAbaAtiva("ciclos")}
            >
              <i className="bi bi-layers-fill me-1"></i> Ciclos Escolares e Matriz
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold transition-all ${
                abaAtiva === "turnos"
                  ? "btn-primary shadow-sm"
                  : "btn-light text-secondary border-0"
              }`}
              onClick={() => setAbaAtiva("turnos")}
            >
              <i className="bi bi-clock-fill me-1"></i> Turnos de Funcionamento
            </button>
          </div>

          <div className="text-muted small">
            {abaAtiva === "ciclos" ? (
              <span><strong>{ciclos.length}</strong> ciclo(s) cadastrado(s)</span>
            ) : (
              <span><strong>{turnos.filter((t) => t.ativo).length}</strong> turno(s) ativo(s)</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Carregando ciclos e configurações...</p>
          </div>
        ) : abaAtiva === "ciclos" ? (
          /* ======================================================== */
          /* ABA 1: CICLOS E MATRIZ CURRICULAR AGRUPADA POR CICLOS    */
          /* ======================================================== */
          <div className="d-flex flex-column gap-4">
            {/* Disciplinas Não Vinculadas (se houver) */}
            {disciplinasSemCiclo.length > 0 && (
              <div className="p-3 rounded-4 border border-warning bg-warning-subtle bg-opacity-25 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-warning-subtle">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                    <h5 className="h6 fw-bold text-dark mb-0">
                      Disciplinas Não Vinculadas a Nenhum Ciclo
                    </h5>
                  </div>
                  <span className="badge bg-warning text-dark rounded-pill">
                    {disciplinasSemCiclo.length} disciplina(s)
                  </span>
                </div>
                <p className="text-muted small mb-3">
                  Estas matérias constam no catálogo escolar mas ainda não foram associadas a nenhum ciclo curricular:
                </p>
                <div className="row g-2">
                  {disciplinasSemCiclo.map((disc) => (
                    <div className="col-12 col-md-6 col-xl-4" key={disc.id_disciplina}>
                      <div className="card h-100 border rounded-3 p-2 bg-white shadow-none d-flex flex-column justify-content-between">
                        <div>
                          <strong className="d-block text-dark small">{disc.nome}</strong>
                          <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                            {disc.aulas_semanais || 4} aulas/sem • {disc.carga_horaria_anual || 160} aulas/ano
                          </span>
                        </div>
                        <div className="pt-2 mt-2 border-top d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleAbrirEditarDisciplina(disc)}
                          >
                            <i className="bi bi-pencil me-1"></i> Vincular a Ciclos
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista dos Ciclos com suas Disciplinas */}
            {ciclos.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border p-4">
                <i className="bi bi-layers fs-1 text-muted d-block mb-2"></i>
                <h6 className="fw-bold text-dark">Nenhum ciclo curricular cadastrado</h6>
                <p className="text-muted small mb-3">
                  Cadastre o primeiro ciclo (ex: 1º Ano Regular, 2º Ano, etc.) para organizar turmas e a matriz de disciplinas.
                </p>
                {podeGerenciar && (
                  <button
                    type="button"
                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                    onClick={handleAbrirCriarCiclo}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Cadastrar Primeiro Ciclo
                  </button>
                )}
              </div>
            ) : (
              ciclos.map((ciclo) => {
                const turmasDoCiclo = turmas.filter(
                  (t) => String(t.ciclo_id) === String(ciclo.id_ciclo)
                );
                const disciplinasDoCiclo = ciclo.disciplinas || [];

                // Filtra todas as disciplinas disponíveis no catálogo que AINDA NÃO pertencem a este ciclo
                const disciplinasDisponiveisParaVincular = todasDisciplinas.filter(
                  (d) =>
                    !disciplinasDoCiclo.some(
                      (cd) => Number(cd.id_disciplina) === Number(d.id_disciplina)
                    )
                );

                const valorSelecionado =
                  disciplinaSelecionadaParaVincular[ciclo.id_ciclo] || "";

                return (
                  <div
                    key={ciclo.id_ciclo}
                    className="card border rounded-4 shadow-sm bg-white overflow-hidden"
                  >
                    {/* Cabeçalho do Ciclo */}
                    <div className="card-header bg-light border-bottom p-3 p-md-4">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white shadow-sm"
                            style={{ width: "42px", height: "42px", fontSize: "1.2rem" }}
                          >
                            <i className="bi bi-layers-fill"></i>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h3 className="h5 fw-bold text-dark mb-0">
                                {ciclo.nome}
                              </h3>
                              <span className="badge bg-secondary-subtle text-secondary rounded-pill border">
                                ID #{ciclo.id_ciclo}
                              </span>
                            </div>
                            {ciclo.descricao ? (
                              <p className="text-secondary small mb-0 mt-1">
                                {ciclo.descricao}
                              </p>
                            ) : (
                              <p className="text-muted small fst-italic mb-0 mt-1">
                                Sem descrição cadastrada.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Estatísticas e Ações do Ciclo */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fw-semibold">
                            <i className="bi bi-journal-bookmark-fill me-1"></i>
                            {disciplinasDoCiclo.length} disciplina(s)
                          </span>
                          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 fw-semibold">
                            <i className="bi bi-people-fill me-1"></i>
                            {turmasDoCiclo.length} turma(s)
                          </span>

                          {podeGerenciar && (
                            <div className="btn-group btn-group-sm ms-md-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary rounded-start-pill px-3"
                                onClick={() => handleAbrirEditarCiclo(ciclo)}
                                title="Editar nome e descrição do Ciclo"
                              >
                                <i className="bi bi-pencil me-1"></i> Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger rounded-end-pill px-3"
                                onClick={() => handleExcluirCiclo(ciclo)}
                                disabled={excluindoCicloId === ciclo.id_ciclo}
                                title="Excluir Ciclo"
                              >
                                {excluindoCicloId === ciclo.id_ciclo ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <>
                                    <i className="bi bi-trash me-1"></i> Excluir
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Turmas vinculadas ao ciclo */}
                      {turmasDoCiclo.length > 0 && (
                        <div className="mt-2 pt-2 border-top d-flex align-items-center gap-2 flex-wrap">
                          <small className="text-muted fw-bold" style={{ fontSize: "0.72rem" }}>
                            TURMAS:
                          </small>
                          {turmasDoCiclo.map((t) => (
                            <span
                              key={t.id_turma}
                              className="badge bg-white text-dark border small fw-normal"
                            >
                              {t.nome_identificador}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Barra de Ações: Adicionar Nova Disciplina & Select de Vínculo de Disciplina Existente */}
                    {podeGerenciar && (
                      <div className="p-3 bg-light bg-opacity-50 border-bottom">
                        <div className="row g-2 align-items-center justify-content-between">
                          {/* Botão: Cadastrar Nova Disciplina diretamente neste Ciclo */}
                          <div className="col-12 col-md-auto">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                              onClick={() => handleAbrirAdicionarDisciplinaAoCiclo(ciclo.id_ciclo)}
                            >
                              <i className="bi bi-plus-circle-fill"></i>
                              <span>Adicionar Nova Disciplina</span>
                            </button>
                          </div>

                          {/* NOVO RECURSO: Select de Disciplinas Disponíveis para Vínculo */}
                          <div className="col-12 col-md-auto">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <label
                                htmlFor={`select-vincular-ciclo-${ciclo.id_ciclo}`}
                                className="small text-muted fw-semibold text-nowrap mb-0"
                              >
                                <i className="bi bi-link-45deg me-1"></i>
                                Vincular disciplina existente:
                              </label>

                              {disciplinasDisponiveisParaVincular.length > 0 ? (
                                <div className="input-group input-group-sm" style={{ minWidth: "260px" }}>
                                  <select
                                    id={`select-vincular-ciclo-${ciclo.id_ciclo}`}
                                    className="form-select form-select-sm"
                                    value={valorSelecionado}
                                    onChange={(e) =>
                                      setDisciplinaSelecionadaParaVincular((prev) => ({
                                        ...prev,
                                        [ciclo.id_ciclo]: e.target.value,
                                      }))
                                    }
                                    disabled={vinculandoPorCicloId === ciclo.id_ciclo}
                                  >
                                    <option value="">Selecione uma disciplina...</option>
                                    {disciplinasDisponiveisParaVincular.map((d) => (
                                      <option key={d.id_disciplina} value={d.id_disciplina}>
                                        {d.nome} ({d.aulas_semanais || 4} a/sem)
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="btn btn-success fw-semibold"
                                    onClick={() => handleVincularDisciplinaExistente(ciclo.id_ciclo)}
                                    disabled={
                                      !valorSelecionado ||
                                      vinculandoPorCicloId === ciclo.id_ciclo
                                    }
                                    title="Vincular disciplina selecionada a este ciclo"
                                  >
                                    {vinculandoPorCicloId === ciclo.id_ciclo ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      "Vincular"
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary small fw-normal">
                                  Todas as disciplinas já vinculadas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grid de Disciplinas Pertencentes ao Ciclo */}
                    <div className="p-3 p-md-4">
                      {disciplinasDoCiclo.length === 0 ? (
                        <div className="text-center py-4 text-muted small bg-light rounded-3 border border-dashed">
                          <i className="bi bi-journal-bookmark fs-3 d-block text-muted mb-1"></i>
                          Nenhuma disciplina vinculada a este ciclo até o momento.
                          <div className="mt-2">
                            Utilize o botão <strong>&ldquo;Adicionar Nova Disciplina&rdquo;</strong> ou selecione uma matéria existente no menu ao lado.
                          </div>
                        </div>
                      ) : (
                        <div className="row g-3">
                          {disciplinasDoCiclo.map((disc) => {
                            const aulasSem =
                              disc.aulas_semanais ||
                              Math.max(
                                1,
                                Math.round((disc.carga_horaria_anual || 160) / 40)
                              );
                            const totalAulas =
                              disc.total_aulas_anuais ||
                              disc.carga_horaria_anual ||
                              aulasSem * 40;

                            const chaveDesvinculo = `${ciclo.id_ciclo}-${disc.id_disciplina}`;
                            const estáDesvinculando = desvinculandoChave === chaveDesvinculo;

                            return (
                              <div
                                className="col-12 col-md-6 col-xl-4"
                                key={disc.id_disciplina}
                              >
                                <div className="card h-100 border rounded-3 p-3 bg-white shadow-none d-flex flex-column justify-content-between">
                                  <div>
                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                      <h4
                                        className="h6 fw-bold text-dark mb-0 text-truncate"
                                        title={disc.nome}
                                      >
                                        {disc.nome}
                                      </h4>
                                      <span
                                        className="badge bg-primary-subtle text-primary rounded-pill text-nowrap"
                                        style={{ fontSize: "0.68rem" }}
                                      >
                                        {aulasSem} a/sem • {totalAulas} a/ano
                                      </span>
                                    </div>

                                    {/* Professores Vinculados */}
                                    <div className="small text-secondary mb-2">
                                      <i className="bi bi-person-badge me-1 text-primary"></i>
                                      <strong>Docente(s):</strong>{" "}
                                      {Array.isArray(disc.professores) && disc.professores.length > 0 ? (
                                        disc.professores.map((p) => p.name).join(", ")
                                      ) : (
                                        <span className="text-muted fst-italic">
                                          Nenhum docente vinculado
                                        </span>
                                      )}
                                    </div>

                                    {/* Ementa breve */}
                                    {disc.ementa && (
                                      <p
                                        className="text-muted small mb-0"
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

                                  {/* Ações na Disciplina dentro do Ciclo */}
                                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-decoration-none px-0 fw-semibold text-primary"
                                      style={{ fontSize: "0.78rem" }}
                                      onClick={() => setDisciplinaDetalhe(disc)}
                                    >
                                      <i className="bi bi-eye me-1"></i> Plano Pedagógico
                                    </button>

                                    {podeGerenciar && (
                                      <div className="btn-group btn-group-sm">
                                        <button
                                          type="button"
                                          className="btn btn-outline-primary rounded-start-pill py-0 px-2"
                                          style={{ fontSize: "0.75rem" }}
                                          onClick={() => handleAbrirEditarDisciplina(disc)}
                                          title="Editar disciplina"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger rounded-end-pill py-0 px-2"
                                          style={{ fontSize: "0.75rem" }}
                                          onClick={() => handleDesvincularDisciplina(ciclo, disc)}
                                          disabled={estáDesvinculando}
                                          title="Desvincular disciplina deste ciclo"
                                        >
                                          {estáDesvinculando ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                          ) : (
                                            <i className="bi bi-link-45deg"></i>
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* ABA 2: TURNOS ESCOLARES                                  */
          /* ======================================================== */
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Turnos de Funcionamento</h5>
                <small className="text-muted">
                  Configure os horários operacionais e controle a oferta de períodos de aula na instituição.
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
                              turno.ativo
                                ? "bg-primary-subtle text-primary"
                                : "bg-secondary-subtle text-muted"
                            }`}
                            style={{ width: "38px", height: "38px", fontSize: "1.1rem" }}
                          >
                            <i className={`bi ${turno.icone}`}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">{turno.nome}</h6>
                            <small
                              className={
                                turno.ativo ? "text-success fw-semibold" : "text-muted"
                              }
                            >
                              {turno.ativo ? "Em Funcionamento" : "Desativado"}
                            </small>
                          </div>
                        </div>

                        {/* Switch de Ativação */}
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

                      {/* Definição de Horários */}
                      <div className="p-2 rounded-3 bg-light border mb-3">
                        <small
                          className="text-muted fw-bold text-uppercase d-block mb-1"
                          style={{ fontSize: "0.68rem" }}
                        >
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
                              onChange={(e) =>
                                handleAlterarHorario(turno.id, "inicio", e.target.value)
                              }
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
                              onChange={(e) =>
                                handleAlterarHorario(turno.id, "fim", e.target.value)
                              }
                              disabled={!turno.ativo}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Turmas no turno */}
                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Turmas Ativas:</span>
                        <span className="badge rounded-pill bg-primary px-2 py-1">
                          {turmasDoTurno.length}{" "}
                          {turmasDoTurno.length === 1 ? "turma" : "turmas"}
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
              exibirSucesso(
                cicloEmEdicao
                  ? `Ciclo "${cicloEmEdicao.nome}" atualizado com sucesso!`
                  : "Novo ciclo escolar cadastrado com sucesso!"
              );
              await carregarDados();
            }}
          />
        )}

        {/* Modal Reutilizável de Disciplina (para adicionar disciplina diretamente ao ciclo) */}
        <ModalDisciplina
          aberto={modalDisciplinaAberto}
          disciplina={disciplinaEmEdicao}
          ciclos={ciclos}
          cicloPadraoId={cicloPreSelecionadoId}
          onFechar={() => {
            setModalDisciplinaAberto(false);
            setDisciplinaEmEdicao(null);
            setCicloPreSelecionadoId(null);
          }}
          onSalvo={handleDisciplinaSalva}
          onAbrirModalCiclo={() => setModalCicloAberto(true)}
        />

        {/* Modal de Detalhes Pedagógicos */}
        <ModalDetalhesDisciplina
          disciplina={disciplinaDetalhe}
          onFechar={() => setDisciplinaDetalhe(null)}
        />
      </PainelModulo>
    </div>
  );
}
