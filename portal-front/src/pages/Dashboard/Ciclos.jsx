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
  listarTurnos,
  atualizarTurno,
  alternarTurno,
} from "../../services/turnosService";
import { useAuth } from "../../hooks/useAuth";
import { formatarDisciplinaCiclo } from "../../utils/formatters";

// Paleta de cores semânticas para identificação e distinção visual dos ciclos
const CORES_CICLOS = [
  { primária: "#10b981", bgHeader: "#f0fdf4", border: "#86efac", badgeBg: "#dcfce7", badgeText: "#166534" }, // 1º (Esmeralda)
  { primária: "#2563eb", bgHeader: "#eff6ff", border: "#93c5fd", badgeBg: "#dbeafe", badgeText: "#1e40af" }, // 2º (Azul Real)
  { primária: "#d97706", bgHeader: "#fffbeb", border: "#fde68a", badgeBg: "#fef3c7", badgeText: "#92400e" }, // 3º (Âmbar)
  { primária: "#7c3aed", bgHeader: "#f5f3ff", border: "#c4b5fd", badgeBg: "#ede9fe", badgeText: "#5b21b6" }, // 4º (Violeta)
  { primária: "#db2777", bgHeader: "#fdf2f8", border: "#f9a8d4", badgeBg: "#fce7f3", badgeText: "#9d174d" }, // 5º (Rosa)
  { primária: "#0891b2", bgHeader: "#ecfeff", border: "#67e8f9", badgeBg: "#cffafe", badgeText: "#155e75" }, // 6º (Ciano)
];

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

  // Estado para colapsar/expandir ciclos individualmente. Por padrão, TODOS INICIAM COLAPSADOS (isAberto === false)
  const [ciclosAbertos, setCiclosAbertos] = useState({});

  const toggleColapsarCiclo = (cicloId) => {
    setCiclosAbertos((prev) => ({
      ...prev,
      [cicloId]: !prev[cicloId],
    }));
  };

  // Modais
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [cicloEmEdicao, setCicloEmEdicao] = useState(null);
  const [excluindoCicloId, setExcluindoCicloId] = useState(null);

  const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState(null);
  const [cicloPreSelecionadoId, setCicloPreSelecionadoId] = useState(null);
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState(null);

  // Configuração dos Turnos Operacionais da Escola (valores padrão e estado sincronizado com a API)
  const TURNOS_PADRAO = [
    {
      id: "Matutino",
      nome: "Matutino",
      hora_inicio: "07:00",
      hora_fim: "12:15",
      duracao_aula_minutos: 50,
      quantidade_aulas: 5,
      intervalo_inicio: "09:30",
      intervalo_fim: "09:56",
      ativo: true,
      descricao: "Turno da manhã, com 5 aulas de 50 minutos e intervalo de 09:30 às 09:56.",
      icone: "bi-sun-fill",
      cor: "warning",
    },
    {
      id: "Vespertino",
      nome: "Vespertino",
      hora_inicio: "12:50",
      hora_fim: "16:25",
      duracao_aula_minutos: 50,
      quantidade_aulas: 5,
      intervalo_inicio: "14:30",
      intervalo_fim: "14:45",
      ativo: true,
      descricao: "Turno da tarde, com 5 aulas de 50 minutos e intervalo de 14:30 às 14:45.",
      icone: "bi-brightness-alt-high-fill",
      cor: "primary",
    },
    {
      id: "Noturno",
      nome: "Noturno",
      hora_inicio: "18:45",
      hora_fim: "22:15",
      duracao_aula_minutos: 45,
      quantidade_aulas: 4,
      intervalo_inicio: "20:30",
      intervalo_fim: "20:45",
      ativo: false,
      descricao: "Turno da noite, voltado prioritariamente para EJA e Cursos Noturnos.",
      icone: "bi-moon-stars-fill",
      cor: "indigo",
    },
    {
      id: "Integral",
      nome: "Integral",
      hora_inicio: "07:00",
      hora_fim: "16:40",
      duracao_aula_minutos: 50,
      quantidade_aulas: 9,
      intervalo_inicio: "09:30",
      intervalo_fim: "09:56",
      ativo: true,
      descricao: "Jornada ampliada do Ensino Médio de Tempo Integral (EMTI).",
      icone: "bi-clock-history",
      cor: "success",
    },
  ];

  const [turnos, setTurnos] = useState(TURNOS_PADRAO);
  const [salvandoTurnoId, setSalvandoTurnoId] = useState(null);
  const [turnoEmEdicaoId, setTurnoEmEdicaoId] = useState(null);

  const carregarDados = async () => {
    setLoading(true);
    setErro("");
    try {
      const [resCiclos, resDisciplinas, resTurmas, resTurnos] = await Promise.all([
        listarDisciplinasPorCiclo(),
        listarDisciplinas(),
        fetchTurmas(),
        listarTurnos().catch(() => null),
      ]);

      setCiclos(resCiclos?.ciclos || []);
      setDisciplinasSemCiclo(resCiclos?.disciplinas_sem_ciclo || []);
      setTodasDisciplinas(Array.isArray(resDisciplinas) ? resDisciplinas : []);

      const listaTurmas = Array.isArray(resTurmas)
        ? resTurmas
        : resTurmas?.data || [];
      setTurmas(listaTurmas);

      if (Array.isArray(resTurnos) && resTurnos.length > 0) {
        setTurnos(resTurnos);
      }
    } catch (err) {
      setErro(err.message || "Erro ao carregar dados de ciclos e disciplinas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      listarDisciplinasPorCiclo(),
      listarDisciplinas(),
      fetchTurmas(),
      listarTurnos().catch(() => null),
    ])
      .then(([resCiclos, resDisciplinas, resTurmas, resTurnos]) => {
        if (!cancelado) {
          setCiclos(resCiclos?.ciclos || []);
          setDisciplinasSemCiclo(resCiclos?.disciplinas_sem_ciclo || []);
          setTodasDisciplinas(Array.isArray(resDisciplinas) ? resDisciplinas : []);
          const listaTurmas = Array.isArray(resTurmas)
            ? resTurmas
            : resTurmas?.data || [];
          setTurmas(listaTurmas);
          if (Array.isArray(resTurnos) && resTurnos.length > 0) {
            setTurnos(resTurnos);
          }
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

  // Handlers para Configuração Dinâmica dos Turnos de Funcionamento
  const handleToggleTurno = async (idTurno) => {
    try {
      const turnoAtualizado = await alternarTurno(idTurno);
      setTurnos((atuais) =>
        atuais.map((t) => (t.id === idTurno ? { ...t, ...turnoAtualizado } : t))
      );
      exibirSucesso(`Turno ${idTurno} ${turnoAtualizado.ativo ? "ativado" : "desativado"} com sucesso!`);
    } catch (err) {
      setErro(err.message || `Erro ao alternar o turno ${idTurno}.`);
    }
  };

  const handleAlterarCampoTurno = (idTurno, campo, valor) => {
    setTurnos((atuais) =>
      atuais.map((t) => (t.id === idTurno ? { ...t, [campo]: valor } : t))
    );
  };

  const handleAdicionarPausa = (idTurno) => {
    setTurnos((atuais) =>
      atuais.map((t) => {
        if (t.id !== idTurno) return t;
        const pausasAtuais = Array.isArray(t.pausas) ? [...t.pausas] : [];
        const ehAlmoco = pausasAtuais.some((p) => p.tipo === "almoco") ? false : true;
        const novaPausa = {
          tipo: ehAlmoco ? "almoco" : "intervalo",
          rotulo: ehAlmoco ? "Almoço" : `Intervalo ${pausasAtuais.length + 1}`,
          hora_inicio: ehAlmoco ? "11:25" : "09:30",
          hora_fim: ehAlmoco ? "12:50" : "09:45",
        };
        return { ...t, pausas: [...pausasAtuais, novaPausa] };
      })
    );
  };

  const handleAlterarPausa = (idTurno, indexPausa, campo, valor) => {
    setTurnos((atuais) =>
      atuais.map((t) => {
        if (t.id !== idTurno) return t;
        const pausasAtuais = Array.isArray(t.pausas) ? [...t.pausas] : [];
        if (!pausasAtuais[indexPausa]) return t;
        const pausaAtualizada = { ...pausasAtuais[indexPausa], [campo]: valor };
        if (campo === "tipo" && valor === "almoco" && (!pausaAtualizada.rotulo || pausaAtualizada.rotulo.startsWith("Intervalo"))) {
          pausaAtualizada.rotulo = "Almoço";
        }
        pausasAtuais[indexPausa] = pausaAtualizada;
        return { ...t, pausas: pausasAtuais };
      })
    );
  };

  const handleRemoverPausa = (idTurno, indexPausa) => {
    setTurnos((atuais) =>
      atuais.map((t) => {
        if (t.id !== idTurno) return t;
        const pausasAtuais = Array.isArray(t.pausas) ? [...t.pausas] : [];
        pausasAtuais.splice(indexPausa, 1);
        return { ...t, pausas: pausasAtuais };
      })
    );
  };

  const handleSalvarTurno = async (idTurno) => {
    const turno = turnos.find((t) => t.id === idTurno);
    if (!turno) return;

    setSalvandoTurnoId(idTurno);
    setErro("");
    try {
      const pausasTurno = Array.isArray(turno.pausas) ? turno.pausas : [];
      const primeiraPausa = pausasTurno[0];

      const payload = {
        hora_inicio: turno.hora_inicio || turno.inicio,
        hora_fim: turno.hora_fim || turno.fim,
        duracao_aula_minutos: Number(turno.duracao_aula_minutos) || 50,
        quantidade_aulas: Number(turno.quantidade_aulas) || 5,
        intervalo_inicio: primeiraPausa?.hora_inicio || turno.intervalo_inicio || "09:30",
        intervalo_fim: primeiraPausa?.hora_fim || turno.intervalo_fim || "09:45",
        pausas: pausasTurno,
        ativo: Boolean(turno.ativo),
        descricao: turno.descricao || null,
      };

      const turnoSalvo = await atualizarTurno(idTurno, payload);
      setTurnos((atuais) =>
        atuais.map((t) => (t.id === idTurno ? { ...t, ...turnoSalvo } : t))
      );
      setTurnoEmEdicaoId(null);
      exibirSucesso(`Configurações operacionais do turno ${turno.nome} salvas com sucesso!`);
    } catch (err) {
      setErro(err.message || `Erro ao salvar as configurações do turno ${idTurno}.`);
    } finally {
      setSalvandoTurnoId(null);
    }
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
    <div className="position-relative ciclos-page-viewport-lock">
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
        className="painel-modulo-viewport-lock"
        conteudoClassName="painel-modulo-conteudo-viewport-lock"
        titulo="Ciclos Curriculares e Turnos"
        subtitulo="Gestão dos agrupamentos curriculares, matriz por ciclos e turnos escolares da instituição."
        icone="bi-arrow-repeat"
        acoes={acoesCiclos}
      >
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-2 py-2 px-3" role="alert">
            {erro}
          </div>
        )}

        {/* Sub-navegação interna entre Ciclos e Turnos padronizada com Turmas */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-1 bg-light rounded-3 border flex-shrink-0 mb-2">
          <div className="d-flex flex-wrap align-items-center gap-1">
            <button
              type="button"
              className={`btn btn-sm rounded-2 px-2.5 py-1 fw-semibold border-0 d-flex align-items-center gap-1.5 transition-all ${
                abaAtiva === "ciclos"
                  ? "btn-primary text-white shadow-xs"
                  : "btn-light text-muted"
              }`}
              onClick={() => setAbaAtiva("ciclos")}
            >
              <i className="bi bi-layers-fill"></i>
              <span>Ciclos Escolares e Matriz</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-2 px-2.5 py-1 fw-semibold border-0 d-flex align-items-center gap-1.5 transition-all ${
                abaAtiva === "turnos"
                  ? "btn-primary text-white shadow-xs"
                  : "btn-light text-muted"
              }`}
              onClick={() => setAbaAtiva("turnos")}
            >
              <i className="bi bi-clock-fill"></i>
              <span>Turnos de Funcionamento</span>
            </button>
          </div>

          <div className="text-muted small px-2">
            {abaAtiva === "ciclos" ? (
              <span><strong>{ciclos.length}</strong> ciclo(s) cadastrado(s)</span>
            ) : (
              <span><strong>{turnos.filter((t) => t.ativo).length}</strong> turno(s) ativo(s)</span>
            )}
          </div>
        </div>

        {/* Conteúdo com rolagem vertical suave confinada */}
        <div className="modulo-conteudo-scroll">

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Carregando ciclos e configurações...</p>
          </div>
        ) : abaAtiva === "ciclos" ? (
          /* ======================================================== */
          /* ABA 1: CICLOS E MATRIZ CURRICULAR AGRUPADA POR CICLOS    */
          /* ======================================================== */
          <div className="d-flex flex-column gap-2.5">
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
              ciclos.map((ciclo, index) => {
                const turmasDoCiclo = turmas.filter(
                  (t) => String(t.ciclo_id) === String(ciclo.id_ciclo)
                );
                const disciplinasDoCiclo = ciclo.disciplinas || [];

                // Paleta de cor individual do ciclo para demarcação visual instantânea
                const paleta = CORES_CICLOS[(ciclo.id_ciclo ?? index) % CORES_CICLOS.length];

                // Filtra todas as disciplinas disponíveis no catálogo que AINDA NÃO pertencem a este ciclo
                const disciplinasDisponiveisParaVincular = todasDisciplinas.filter(
                  (d) =>
                    !disciplinasDoCiclo.some(
                      (cd) => Number(cd.id_disciplina) === Number(d.id_disciplina)
                    )
                );

                const valorSelecionado =
                  disciplinaSelecionadaParaVincular[ciclo.id_ciclo] || "";

                // Por padrão, todos os ciclos iniciam colapsados (isAberto === false)
                const isAberto = Boolean(ciclosAbertos[ciclo.id_ciclo]);

                return (
                  <div
                    key={ciclo.id_ciclo}
                    className="card border rounded-3 shadow-xs bg-white overflow-hidden mb-2.5"
                    style={{
                      borderLeft: `5px solid ${paleta.primária}`,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {/* Cabeçalho do Ciclo Slim com Destaque Visual e Botão de Expandir/Recolher Prominente */}
                    <div
                      className="card-header border-bottom p-2 p-md-2.5"
                      style={{ backgroundColor: paleta.bgHeader }}
                    >
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                            style={{
                              width: "36px",
                              height: "36px",
                              fontSize: "1.05rem",
                              backgroundColor: paleta.primária,
                            }}
                          >
                            <i className="bi bi-layers-fill"></i>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h3 className="h6 fw-bold text-dark mb-0">
                                {ciclo.nome}
                              </h3>
                              <span
                                className="badge rounded-pill py-0.5 px-2"
                                style={{
                                  fontSize: "0.72rem",
                                  backgroundColor: paleta.badgeBg,
                                  color: paleta.badgeText,
                                  border: `1px solid ${paleta.border}`,
                                }}
                              >
                                ID #{ciclo.id_ciclo}
                              </span>

                              {/* Botão Prominente de Colapsar/Expandir Ciclo com Rótulo e Seta */}
                              <button
                                type="button"
                                className="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold d-inline-flex align-items-center gap-1 shadow-xs transition-all ciclo-collapse-btn"
                                onClick={() => toggleColapsarCiclo(ciclo.id_ciclo)}
                                aria-expanded={isAberto}
                                aria-controls={`ciclo-conteudo-${ciclo.id_ciclo}`}
                                title={isAberto ? "Recolher ciclo" : "Abrir e visualizar disciplinas deste ciclo"}
                                style={{
                                  backgroundColor: isAberto ? paleta.primária : "#ffffff",
                                  color: isAberto ? "#ffffff" : paleta.badgeText,
                                  border: `1.5px solid ${paleta.primária}`,
                                  fontSize: "0.75rem",
                                }}
                              >
                                <i
                                  className={`bi ${isAberto ? "bi-chevron-up" : "bi-chevron-down"} fw-bold`}
                                  style={{ fontSize: "0.8rem" }}
                                  aria-hidden="true"
                                ></i>
                                <span>{isAberto ? "Recolher Ciclo" : `Abrir (${disciplinasDoCiclo.length} Matérias)`}</span>
                              </button>
                            </div>
                            {ciclo.descricao ? (
                              <p className="text-secondary small mb-0 mt-0.5" style={{ fontSize: "0.78rem" }}>
                                {ciclo.descricao}
                              </p>
                            ) : (
                              <p className="text-muted small fst-italic mb-0 mt-0.5" style={{ fontSize: "0.78rem" }}>
                                Sem descrição cadastrada.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Estatísticas e Ações do Ciclo Slim */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span
                            className="badge rounded-pill px-2.5 py-1 fw-semibold"
                            style={{
                              fontSize: "0.75rem",
                              backgroundColor: paleta.badgeBg,
                              color: paleta.badgeText,
                              border: `1px solid ${paleta.border}`,
                            }}
                          >
                            <i className="bi bi-journal-bookmark-fill me-1"></i>
                            {disciplinasDoCiclo.length} disciplina(s)
                          </span>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-semibold" style={{ fontSize: "0.75rem" }}>
                            <i className="bi bi-people-fill me-1"></i>
                            {turmasDoCiclo.length} turma(s)
                          </span>

                          {podeGerenciar && (
                            <div className="btn-group btn-group-sm ms-md-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary rounded-start-pill px-2.5 py-1"
                                style={{ fontSize: "0.78rem" }}
                                onClick={() => handleAbrirEditarCiclo(ciclo)}
                                title="Editar nome e descrição do Ciclo"
                              >
                                <i className="bi bi-pencil me-1"></i> Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger rounded-end-pill px-2.5 py-1"
                                style={{ fontSize: "0.78rem" }}
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
                        <div className="mt-1.5 pt-1.5 border-top d-flex align-items-center gap-2 flex-wrap">
                          <small className="text-muted fw-bold" style={{ fontSize: "0.7rem" }}>
                            TURMAS:
                          </small>
                          {turmasDoCiclo.map((t) => (
                            <span
                              key={t.id_turma}
                              className="badge bg-white text-dark border py-0.5 px-2 fw-normal"
                              style={{ fontSize: "0.72rem" }}
                            >
                              {t.nome_identificador}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Corpo do Ciclo: Barra de Ações & Grid de Disciplinas (Visível APENAS quando Aberto) */}
                    {isAberto && (
                      <div className="" id={`ciclo-conteudo-${ciclo.id_ciclo}`}>
                        {/* Barra de Ações: Adicionar Nova Disciplina & Select de Vínculo de Disciplina Existente */}
                        {podeGerenciar && (
                          <div className="py-1.5 px-2.5 bg-light bg-opacity-50 border-bottom">
                            <div className="row px-2 g-2 align-items-center justify-content-between">
                              {/* Botão: Cadastrar Nova Disciplina diretamente neste Ciclo */}
                              <div className="col-12 col-md-auto">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1 shadow-xs"
                                  onClick={() => handleAbrirAdicionarDisciplinaAoCiclo(ciclo.id_ciclo)}
                                >
                                  <i className="bi bi-plus-circle-fill"></i>
                                  <span>Adicionar Nova Disciplina</span>
                                </button>
                              </div>

                              {/* Select de Disciplinas Disponíveis para Vínculo */}
                              <div className="col-12 col-md-auto">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <label
                                    htmlFor={`select-vincular-ciclo-${ciclo.id_ciclo}`}
                                    className="small text-muted fw-semibold text-nowrap mb-0"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    <i className="bi bi-link-45deg me-1"></i>
                                    Vincular disciplina existente:
                                  </label>

                                  {disciplinasDisponiveisParaVincular.length > 0 ? (
                                    <div className="input-group input-group-sm" style={{ minWidth: "240px" }}>
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

                        {/* Grid de Disciplinas Pertencentes ao Ciclo Slim */}
                        <div className="p-2 p-md-2.5">
                          {disciplinasDoCiclo.length === 0 ? (
                            <div className="text-center py-3 text-muted small bg-light rounded-3 border border-dashed">
                              <i className="bi bi-journal-bookmark fs-4 d-block text-muted mb-1"></i>
                              Nenhuma disciplina vinculada a este ciclo até o momento.
                              <div className="mt-1">
                                Utilize o botão <strong>&ldquo;Adicionar Nova Disciplina&rdquo;</strong> ou selecione uma matéria existente no menu ao lado.
                              </div>
                            </div>
                          ) : (
                            <div className="row g-2">
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
                                    <div
                                      className="card h-100 border rounded-3 bg-white shadow-none d-flex flex-column justify-content-between"
                                      style={{ padding: "1.15rem 1.25rem" }}
                                    >
                                      <div>
                                        <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5">
                                          <h4
                                            className="h6 fw-bold text-dark mb-0 text-truncate"
                                            title={formatarDisciplinaCiclo(disc, ciclo)}
                                          >
                                            {formatarDisciplinaCiclo(disc, ciclo)}
                                          </h4>
                                          <span
                                            className="badge bg-primary-subtle text-primary rounded-pill text-nowrap"
                                            style={{ fontSize: "0.68rem" }}
                                          >
                                            {aulasSem} a/sem • {totalAulas} a/ano
                                          </span>
                                        </div>

                                        {/* Professores Vinculados */}
                                        <div className="small text-secondary mb-1.5" style={{ fontSize: "0.78rem" }}>
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
                                              fontSize: "0.76rem",
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
                    )}
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

            <div className="row g-2">
              {turnos.map((turno) => {
                const turmasDoTurno = turmas.filter(
                  (t) => String(t.turno).toLowerCase() === String(turno.id).toLowerCase()
                );
                const isSalvando = salvandoTurnoId === turno.id;
                const estaEditando = turnoEmEdicaoId === turno.id;

                return (
                  <div key={turno.id} className="col-12 col-md-6 col-xl-3">
                    <div
                      className={`card h-100 rounded-3 border shadow-xs p-2.5 bg-white transition-all ${
                        turno.ativo ? "" : "opacity-75 bg-light"
                      } ${estaEditando ? "border-primary shadow" : ""}`}
                    >
                      {/* Cabeçalho do Card */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                              turno.ativo
                                ? "bg-primary-subtle text-primary"
                                : "bg-secondary-subtle text-muted"
                            }`}
                            style={{ width: "32px", height: "32px", fontSize: "1rem" }}
                          >
                            <i className={`bi ${turno.icone || "bi-clock"}`}></i>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>
                              {turno.nome}
                            </h6>
                            <span
                              className={`badge rounded-pill ${
                                turno.ativo
                                  ? "bg-success-subtle text-success"
                                  : "bg-secondary-subtle text-secondary"
                              }`}
                              style={{ fontSize: "0.68rem" }}
                            >
                              {turno.ativo ? "Em Funcionamento" : "Desativado"}
                            </span>
                          </div>
                        </div>

                        {/* Switch de Ativação Rápida */}
                        {podeGerenciar && (
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              role="switch"
                              checked={Boolean(turno.ativo)}
                              onChange={() => handleToggleTurno(turno.id)}
                              title={`Alternar ativação do turno ${turno.nome}`}
                            />
                          </div>
                        )}
                      </div>

                      <p
                        className="text-secondary small mb-2 text-truncate"
                        title={turno.descricao}
                        style={{ fontSize: "0.78rem" }}
                      >
                        {turno.descricao}
                      </p>

                      {/* Configuração Operacional Bloqueada / Editável */}
                      <div className={`p-2 rounded-3 border mb-2 transition-all ${estaEditando ? "bg-white border-primary-subtle" : "bg-light"}`}>
                        {/* Linha 1: Início e Fim do Turno */}
                        <div className="row g-1 mb-1.5 align-items-center">
                          <div className="col-6">
                            <label
                              htmlFor={`turno-inicio-${turno.id}`}
                              className="text-muted fw-semibold d-block mb-0 text-uppercase"
                              style={{ fontSize: "0.65rem" }}
                            >
                              Início
                            </label>
                            <input
                              id={`turno-inicio-${turno.id}`}
                              type="time"
                              className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                                estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                              }`}
                              style={{ fontSize: "0.78rem" }}
                              value={turno.hora_inicio || turno.inicio || "07:00"}
                              onChange={(e) =>
                                handleAlterarCampoTurno(turno.id, "hora_inicio", e.target.value)
                              }
                              disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
                            />
                          </div>
                          <div className="col-6">
                            <label
                              htmlFor={`turno-fim-${turno.id}`}
                              className="text-muted fw-semibold d-block mb-0 text-uppercase"
                              style={{ fontSize: "0.65rem" }}
                            >
                              Término
                            </label>
                            <input
                              id={`turno-fim-${turno.id}`}
                              type="time"
                              className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                                estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                              }`}
                              style={{ fontSize: "0.78rem" }}
                              value={turno.hora_fim || turno.fim || "12:15"}
                              onChange={(e) =>
                                handleAlterarCampoTurno(turno.id, "hora_fim", e.target.value)
                              }
                              disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
                            />
                          </div>
                        </div>

                        {/* Linha 2: Módulo Aula (min) e Qtd Aulas */}
                        <div className="row g-1 mb-1.5 align-items-center">
                          <div className="col-6">
                            <label
                              htmlFor={`turno-duracao-${turno.id}`}
                              className="text-muted fw-semibold d-block mb-0 text-uppercase"
                              style={{ fontSize: "0.65rem" }}
                            >
                              Módulo (min)
                            </label>
                            <input
                              id={`turno-duracao-${turno.id}`}
                              type="number"
                              min="30"
                              max="120"
                              step="5"
                              className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                                estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                              }`}
                              style={{ fontSize: "0.78rem" }}
                              value={turno.duracao_aula_minutos || 50}
                              onChange={(e) =>
                                handleAlterarCampoTurno(
                                  turno.id,
                                  "duracao_aula_minutos",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
                            />
                          </div>
                          <div className="col-6">
                            <label
                              htmlFor={`turno-qtd-${turno.id}`}
                              className="text-muted fw-semibold d-block mb-0 text-uppercase"
                              style={{ fontSize: "0.65rem" }}
                            >
                              Aulas/dia
                            </label>
                            <input
                              id={`turno-qtd-${turno.id}`}
                              type="number"
                              min="1"
                              max="12"
                              className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                                estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                              }`}
                              style={{ fontSize: "0.78rem" }}
                              value={turno.quantidade_aulas || 5}
                              onChange={(e) =>
                                handleAlterarCampoTurno(
                                  turno.id,
                                  "quantidade_aulas",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
                            />
                          </div>
                        </div>

                        {/* Linha 3: Pausas Operacionais (Intervalos / Recreios e Almoço) */}
                        <div className="mt-2 pt-2 border-top">
                          <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <small
                              className="text-muted fw-bold text-uppercase d-block"
                              style={{ fontSize: "0.65rem", letterSpacing: "0.2px" }}
                            >
                              Pausas (Recreio e Almoço)
                            </small>
                            {estaEditando && podeGerenciar && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link p-0 text-decoration-none text-primary fw-semibold"
                                style={{ fontSize: "0.7rem" }}
                                onClick={() => handleAdicionarPausa(turno.id)}
                              >
                                <i className="bi bi-plus-circle me-1"></i>Adicionar
                              </button>
                            )}
                          </div>

                          {/* Modo Leitura / Bloqueado */}
                          {!estaEditando ? (
                            (turno.pausas || []).length > 0 ? (
                              <div className="d-flex flex-column gap-1">
                                {turno.pausas.map((pausa, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className={`d-flex align-items-center justify-content-between px-2 py-0.5 rounded border ${
                                      pausa.tipo === "almoco"
                                        ? "bg-warning-subtle border-warning-subtle text-warning-emphasis"
                                        : "bg-white text-dark"
                                    }`}
                                    style={{ fontSize: "0.72rem" }}
                                  >
                                    <span className="d-flex align-items-center gap-1.5 fw-medium text-truncate">
                                      <span>{pausa.tipo === "almoco" ? "🍽️" : "☕"}</span>
                                      <span className="text-truncate">{pausa.rotulo || (pausa.tipo === "almoco" ? "Almoço" : "Intervalo")}</span>
                                    </span>
                                    <span className="fw-semibold text-nowrap ms-1">
                                      {pausa.hora_inicio} - {pausa.hora_fim}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted small d-block py-1 text-center" style={{ fontSize: "0.7rem" }}>
                                Nenhuma pausa cadastrada
                              </span>
                            )
                          ) : (
                            /* Modo Edição */
                            <div className="d-flex flex-column gap-1.5">
                              {(turno.pausas || []).map((pausa, pIdx) => (
                                <div key={pIdx} className="p-1.5 rounded-2 bg-light border">
                                  <div className="row g-1 align-items-center mb-1">
                                    <div className="col-4">
                                      <select
                                        className="form-select form-select-sm py-0 px-1 fw-semibold"
                                        style={{ fontSize: "0.72rem", height: "24px" }}
                                        value={pausa.tipo || "intervalo"}
                                        onChange={(e) => handleAlterarPausa(turno.id, pIdx, "tipo", e.target.value)}
                                      >
                                        <option value="intervalo">☕ Intervalo</option>
                                        <option value="almoco">🍽️ Almoço</option>
                                      </select>
                                    </div>
                                    <div className="col-6">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm py-0 px-1 fw-medium"
                                        style={{ fontSize: "0.72rem", height: "24px" }}
                                        placeholder="Rótulo (ex: Almoço)"
                                        value={pausa.rotulo || ""}
                                        onChange={(e) => handleAlterarPausa(turno.id, pIdx, "rotulo", e.target.value)}
                                      />
                                    </div>
                                    <div className="col-2 text-end">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger p-0 border-0"
                                        style={{ width: "22px", height: "22px" }}
                                        onClick={() => handleRemoverPausa(turno.id, pIdx)}
                                        title="Remover esta pausa"
                                      >
                                        <i className="bi bi-trash3" style={{ fontSize: "0.75rem" }}></i>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="row g-1 align-items-center">
                                    <div className="col-6">
                                      <input
                                        type="time"
                                        className="form-control form-control-sm text-center py-0 px-1"
                                        style={{ fontSize: "0.72rem", height: "22px" }}
                                        value={pausa.hora_inicio || "09:30"}
                                        onChange={(e) => handleAlterarPausa(turno.id, pIdx, "hora_inicio", e.target.value)}
                                      />
                                    </div>
                                    <div className="col-6">
                                      <input
                                        type="time"
                                        className="form-control form-control-sm text-center py-0 px-1"
                                        style={{ fontSize: "0.72rem", height: "22px" }}
                                        value={pausa.hora_fim || "09:45"}
                                        onChange={(e) => handleAlterarPausa(turno.id, pIdx, "hora_fim", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary w-100 rounded-pill py-0.5 mt-1 d-flex align-items-center justify-content-center gap-1"
                                style={{ fontSize: "0.72rem" }}
                                onClick={() => handleAdicionarPausa(turno.id)}
                              >
                                <i className="bi bi-plus-circle"></i>
                                <span>Adicionar Pausa</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Botão de Edição e Salvar com Bloqueio Automático */}
                        {podeGerenciar && (
                          <div className="mt-2">
                            {!estaEditando ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary w-100 rounded-pill py-1 d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => setTurnoEmEdicaoId(turno.id)}
                                disabled={!turno.ativo || isSalvando}
                                title={`Habilitar edição das configurações do turno ${turno.nome}`}
                              >
                                <i className="bi bi-pencil-square text-primary"></i>
                                <span>Editar Configuração</span>
                              </button>
                            ) : (
                              <div className="d-flex gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary flex-grow-1 rounded-pill py-1 d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                                  style={{ fontSize: "0.75rem" }}
                                  onClick={() => handleSalvarTurno(turno.id)}
                                  disabled={isSalvando}
                                  title="Salvar alterações e bloquear componente"
                                >
                                  {isSalvando ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                      <span>Salvando...</span>
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-check2-circle"></i>
                                      <span>Salvar</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                                  style={{ fontSize: "0.75rem" }}
                                  onClick={() => {
                                    setTurnoEmEdicaoId(null);
                                    carregarDados();
                                  }}
                                  disabled={isSalvando}
                                  title="Cancelar alterações e bloquear"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Rodapé com Turmas Ativas */}
                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          Turmas Ativas:
                        </span>
                        <span className="badge rounded-pill bg-primary px-2 py-0.5" style={{ fontSize: "0.72rem" }}>
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
        </div>

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
