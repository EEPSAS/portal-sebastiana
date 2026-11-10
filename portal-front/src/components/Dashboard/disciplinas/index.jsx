/**
 * index.jsx - Container Inteligente do Módulo de Disciplinas (Módulo 5.5)
 *
 * Papel Didático:
 * Atua como o Smart Container do catálogo curricular da instituição:
 * 1. Consome os serviços da API (`disciplinasService`);
 * 2. Gerencia a busca em tempo real e a filtragem por ciclo escolar;
 * 3. Orquestra a abertura dos modais de criação/edição (`ModalDisciplina`), detalhes (`ModalDetalhesDisciplina`)
 *    e criação rápida de ciclos (`ModalCiclo` importado do domínio de ciclos);
 * 4. Renderiza a casca `<PainelModulo>` com `<DisciplinasFiltros />` e `<DisciplinasGrid />`.
 */

import { useEffect, useState } from "react";
import PainelModulo from "../common/PainelModulo";
import ModalDisciplina from "./ModalDisciplina";
import ModalDetalhesDisciplina from "./ModalDetalhesDisciplina";
import ModalCiclo from "../ciclos/ModalCiclo";
import DisciplinasFiltros from "./DisciplinasFiltros";
import DisciplinasGrid from "./DisciplinasGrid";
import {
  listarDisciplinas,
  listarCiclos,
  excluirDisciplina,
} from "../../../services/disciplinasService";
import { useAuth } from "../../../hooks/useAuth";

export default function DisciplinasContainer() {
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

  const handleDisciplinaSalva = (_discSalva, mensagem) => {
    setModalDisciplinaAberto(false);
    setDisciplinaEmEdicao(null);
    exibirFeedback(mensagem || "Disciplina salva com sucesso!");
    setRecargaKey((k) => k + 1);
  };

  const handleNovoCicloSalvo = (_novoCiclo, mensagem) => {
    setModalCicloAberto(false);
    exibirFeedback(mensagem || "Ciclo cadastrado com sucesso!");
    listarCiclos().then((dados) => {
      setCiclos(Array.isArray(dados) ? dados : []);
    });
  };

  const handleExcluirDisciplina = async (disc) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a disciplina "${disc.nome}" do catálogo escolar?`
      )
    ) {
      return;
    }

    setExcluindoId(disc.id_disciplina);
    try {
      await excluirDisciplina(disc.id_disciplina);
      exibirFeedback(`Disciplina "${disc.nome}" excluída com sucesso.`);
      setRecargaKey((k) => k + 1);
    } catch (err) {
      setErro(err.message || "Erro ao excluir a disciplina.");
    } finally {
      setExcluindoId(null);
    }
  };

  // Filtragem declarativa em memória para performance imediata
  const disciplinasFiltradas = disciplinas.filter((d) => {
    const termo = busca.trim().toLowerCase();
    const atendeTexto =
      !termo ||
      d.nome?.toLowerCase().includes(termo) ||
      d.ementa?.toLowerCase().includes(termo) ||
      d.habilidades_bncc?.toLowerCase().includes(termo);

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
    <div className="position-relative disciplinas-page-viewport-lock">
      {/* Toast flutuante de notificação */}
      {feedback && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {feedback}
        </div>
      )}

      <PainelModulo
        className="painel-modulo-viewport-lock"
        conteudoClassName="painel-modulo-conteudo-viewport-lock"
        acoes={acoesDisciplinas}
      >
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-2 py-2 px-3" role="alert">
            {erro}
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <DisciplinasFiltros
          busca={busca}
          filtroCiclo={filtroCiclo}
          ciclos={ciclos}
          totalFiltradas={disciplinasFiltradas.length}
          totalGeral={disciplinas.length}
          onBuscaChange={(b) => setBusca(b)}
          onLimparBusca={() => setBusca("")}
          onFiltroCicloChange={(c) => setFiltroCiclo(c)}
        />

        {/* Conteúdo com scroll confinado */}
        <div className="modulo-conteudo-scroll">
          <DisciplinasGrid
            disciplinasFiltradas={disciplinasFiltradas}
            loading={loading}
            busca={busca}
            filtroCiclo={filtroCiclo}
            podeGerenciar={podeGerenciar}
            excluindoId={excluindoId}
            onAbrirNovaDisciplina={handleAbrirNovaDisciplina}
            onVerDetalhes={(disc) => setDisciplinaDetalhe(disc)}
            onEditar={handleAbrirEditarDisciplina}
            onExcluir={handleExcluirDisciplina}
          />
        </div>
      </PainelModulo>

      {/* Modal de Criação / Edição de Disciplina */}
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

      {/* Modal de Criação Rápida de Ciclo */}
      {modalCicloAberto && (
        <ModalCiclo
          ciclo={null}
          onFechar={() => setModalCicloAberto(false)}
          onSalvo={handleNovoCicloSalvo}
        />
      )}
    </div>
  );
}
