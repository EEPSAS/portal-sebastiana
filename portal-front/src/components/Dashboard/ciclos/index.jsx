/**
 * index.jsx - Container Inteligente do Módulo de Ciclos Curriculares e Turnos (Módulo 5.4)
 *
 * Papel Didático:
 * Atua como o Smart Container (orquestrador de estado e regras de negócio):
 * 1. Consome serviços da API (`disciplinasService`, `turnosService`, `turmasService`);
 * 2. Gerencia os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio);
 * 3. Orquestra a navegação interna por abas ("Ciclos" e "Turnos");
 * 4. Controla abertura e persistência dos modais (`ModalCiclo`, `ModalDisciplina`, `ModalDetalhesDisciplina`);
 * 5. Renderiza a casca `<PainelModulo>` com o ModuloNav acadêmico unificado.
 */

import { useState, useEffect } from "react";
import PainelModulo from "../common/PainelModulo";
import ModalCiclo from "./ModalCiclo";
import ModalDisciplina from "../disciplinas/ModalDisciplina";
import ModalDetalhesDisciplina from "../disciplinas/ModalDetalhesDisciplina";
import CiclosAba from "./CiclosAba";
import TurnosAba from "./TurnosAba";
import {
  listarDisciplinasPorCiclo,
  listarDisciplinas,
  excluirCiclo,
  vincularDisciplinaAoCiclo,
  desvincularDisciplinaDoCiclo,
} from "../../../services/disciplinasService";
import { fetchTurmas } from "../../../services/turmasService";
import {
  listarTurnos,
  atualizarTurno,
  alternarTurno,
} from "../../../services/turnosService";
import { useAuth } from "../../../hooks/useAuth";

// Configuração padrão dos turnos operacionais (fallback)
const TURNOS_PADRAO = [
  {
    id: "Matutino",
    nome: "Matutino",
    hora_inicio: "07:00",
    hora_fim: "12:15",
    duracao_aula_minutos: 50,
    quantidade_aulas: 5,
    intervalo_inicio: "09:30",
    intervalo_fim: "09:45",
    pausas: [
      {
        tipo: "intervalo",
        rotulo: "Intervalo / Recreio",
        hora_inicio: "09:30",
        hora_fim: "09:45",
      },
    ],
    ativo: true,
    descricao: "Turno da manhã, com 5 aulas de 50 minutos e intervalo de 09:30 às 09:45.",
    icone: "bi-sun-fill",
    cor: "warning",
  },
  {
    id: "Vespertino",
    nome: "Vespertino",
    hora_inicio: "12:50",
    hora_fim: "16:25",
    duracao_aula_minutos: 50,
    quantidade_aulas: 4,
    intervalo_inicio: "14:30",
    intervalo_fim: "14:45",
    pausas: [
      {
        tipo: "intervalo",
        rotulo: "Intervalo / Recreio",
        hora_inicio: "14:30",
        hora_fim: "14:45",
      },
    ],
    ativo: true,
    descricao: "Turno da tarde, com 4 aulas de 50 minutos e intervalo de 14:30 às 14:45.",
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
    intervalo_inicio: "20:15",
    intervalo_fim: "20:30",
    pausas: [
      {
        tipo: "intervalo",
        rotulo: "Intervalo / Recreio",
        hora_inicio: "20:15",
        hora_fim: "20:30",
      },
    ],
    ativo: false,
    descricao: "Turno da noite, voltado prioritariamente para EJA e Cursos Noturnos.",
    icone: "bi-moon-stars-fill",
    cor: "indigo",
  },
  {
    id: "Integral",
    nome: "Integral",
    hora_inicio: "07:00",
    hora_fim: "16:25",
    duracao_aula_minutos: 50,
    quantidade_aulas: 9,
    intervalo_inicio: "09:30",
    intervalo_fim: "09:45",
    pausas: [
      {
        tipo: "intervalo",
        rotulo: "Intervalo da Manhã",
        hora_inicio: "09:30",
        hora_fim: "09:45",
      },
      {
        tipo: "almoco",
        rotulo: "Almoço",
        hora_inicio: "11:25",
        hora_fim: "12:50",
      },
      {
        tipo: "intervalo",
        rotulo: "Intervalo da Tarde",
        hora_inicio: "14:30",
        hora_fim: "14:45",
      },
    ],
    ativo: true,
    descricao: "Jornada ampliada do Ensino Médio de Tempo Integral (EMTI) com recreios e almoço.",
    icone: "bi-clock-history",
    cor: "success",
  },
];

export default function CiclosContainer() {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  const [abaAtiva, setAbaAtiva] = useState("ciclos"); // "ciclos" | "turnos"
  const [ciclos, setCiclos] = useState([]);
  const [todasDisciplinas, setTodasDisciplinas] = useState([]);
  const [disciplinasSemCiclo, setDisciplinasSemCiclo] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [turnos, setTurnos] = useState(TURNOS_PADRAO);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Estado dos selects de vínculo rápido por ciclo { [id_ciclo]: id_disciplina_selecionada }
  const [disciplinaSelecionadaParaVincular, setDisciplinaSelecionadaParaVincular] = useState({});
  const [vinculandoPorCicloId, setVinculandoPorCicloId] = useState(null);
  const [desvinculandoChave, setDesvinculandoChave] = useState(null);

  // Estado para colapsar/expandir ciclos individualmente (por padrão, colapsados)
  const [ciclosAbertos, setCiclosAbertos] = useState({});

  // Modais
  const [modalCicloAberto, setModalCicloAberto] = useState(false);
  const [cicloEmEdicao, setCicloEmEdicao] = useState(null);
  const [excluindoCicloId, setExcluindoCicloId] = useState(null);

  const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState(null);
  const [cicloPreSelecionadoId, setCicloPreSelecionadoId] = useState(null);
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState(null);

  // Turnos
  const [salvandoTurnoId, setSalvandoTurnoId] = useState(null);
  const [turnoEmEdicaoId, setTurnoEmEdicaoId] = useState(null);

  const toggleColapsarCiclo = (cicloId) => {
    setCiclosAbertos((prev) => ({
      ...prev,
      [cicloId]: !prev[cicloId],
    }));
  };

  const exibirSucesso = (msg) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 4500);
  };

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

  // Handlers para Ciclos
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

  // Handlers para Disciplinas no Ciclo
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

  const handleDisciplinaSalva = async (_discSalva, mensagem) => {
    setModalDisciplinaAberto(false);
    setDisciplinaEmEdicao(null);
    setCicloPreSelecionadoId(null);
    exibirSucesso(mensagem || "Disciplina salva com sucesso!");
    await carregarDados();
  };

  const handleSelecionarDisciplinaParaVincular = (idCiclo, valor) => {
    setDisciplinaSelecionadaParaVincular((prev) => ({
      ...prev,
      [idCiclo]: valor,
    }));
  };

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

  // Handlers para Turnos
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
    const idLimpo = String(idTurno || "").trim();
    const turno = turnos.find((t) => t.id === idLimpo || t.id === idTurno);
    if (!turno) return;

    setSalvandoTurnoId(idLimpo);
    setErro("");
    try {
      const pausasTurno = Array.isArray(turno.pausas) ? turno.pausas : [];
      const primeiraPausa = pausasTurno[0];

      const payload = {
        hora_inicio: turno.hora_inicio || turno.inicio || "07:00",
        hora_fim: turno.hora_fim || turno.fim || "12:15",
        duracao_aula_minutos: Number(turno.duracao_aula_minutos) || 50,
        quantidade_aulas: Number(turno.quantidade_aulas) || 5,
        intervalo_inicio: primeiraPausa?.hora_inicio || turno.intervalo_inicio || "09:30",
        intervalo_fim: primeiraPausa?.hora_fim || turno.intervalo_fim || "09:45",
        pausas: pausasTurno,
        ativo: Boolean(turno.ativo),
        descricao: turno.descricao || null,
      };

      const turnoSalvo = await atualizarTurno(idLimpo, payload);
      setTurnos((atuais) =>
        atuais.map((t) => (t.id === idLimpo || t.id === idTurno ? { ...t, ...turnoSalvo } : t))
      );
      setTurnoEmEdicaoId(null);
      setErro("");
      exibirSucesso(`Configurações operacionais do turno ${turno.nome} salvas com sucesso!`);
    } catch (err) {
      setErro(err.message || `Erro ao salvar as configurações do turno ${idLimpo}.`);
    } finally {
      setSalvandoTurnoId(null);
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

      {/* PainelModulo com ModuloNav Acadêmico integrado */}
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

        {/* Sub-navegação interna entre Ciclos e Turnos */}
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
              <span> Ciclos Escolares e Matriz </span>
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
              <span> Turnos de Funcionamento </span>
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
            <CiclosAba
              ciclos={ciclos}
              turmas={turmas}
              todasDisciplinas={todasDisciplinas}
              disciplinasSemCiclo={disciplinasSemCiclo}
              ciclosAbertos={ciclosAbertos}
              podeGerenciar={podeGerenciar}
              excluindoCicloId={excluindoCicloId}
              disciplinaSelecionadaParaVincular={disciplinaSelecionadaParaVincular}
              vinculandoPorCicloId={vinculandoPorCicloId}
              desvinculandoChave={desvinculandoChave}
              onToggleColapsarCiclo={toggleColapsarCiclo}
              onAbrirCriarCiclo={handleAbrirCriarCiclo}
              onAbrirEditarCiclo={handleAbrirEditarCiclo}
              onExcluirCiclo={handleExcluirCiclo}
              onAbrirAdicionarDisciplinaAoCiclo={handleAbrirAdicionarDisciplinaAoCiclo}
              onSelecionarDisciplinaParaVincular={handleSelecionarDisciplinaParaVincular}
              onVincularDisciplinaExistente={handleVincularDisciplinaExistente}
              onAbrirEditarDisciplina={handleAbrirEditarDisciplina}
              onDesvincularDisciplina={handleDesvincularDisciplina}
              onVerDetalhesDisciplina={(disc) => setDisciplinaDetalhe(disc)}
            />
          ) : (
            <TurnosAba
              turnos={turnos}
              turmas={turmas}
              turnoEmEdicaoId={turnoEmEdicaoId}
              salvandoTurnoId={salvandoTurnoId}
              podeGerenciar={podeGerenciar}
              onToggleTurno={handleToggleTurno}
              onAlterarCampoTurno={handleAlterarCampoTurno}
              onAdicionarPausa={handleAdicionarPausa}
              onAlterarPausa={handleAlterarPausa}
              onRemoverPausa={handleRemoverPausa}
              onIniciarEdicao={(id) => setTurnoEmEdicaoId(id)}
              onCancelarEdicao={() => {
                setTurnoEmEdicaoId(null);
                carregarDados();
              }}
              onSalvarTurno={handleSalvarTurno}
            />
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

        {/* Modal Reutilizável de Disciplina */}
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
