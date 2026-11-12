/**
 * index.jsx - Container Inteligente do Módulo de Professores (Módulo 5.6)
 *
 * Papel Didático:
 * Atua como o Smart Container de gestão docente da escola:
 * 1. Consome os serviços da API (`professoresService`);
 * 2. Gerencia a busca reativa de professores e controle de recarga;
 * 3. Orquestra a aprovação/recusa com seleção obrigatória de disciplinas para pendentes;
 * 4. Controla abertura e persistência de vínculos com `ModalVincularDisciplina`;
 * 5. Renderiza a casca `<PainelModulo>` com as abas de Docentes Confirmados e Pendentes.
 */

import { useEffect, useState } from "react";
import PainelModulo from "../common/PainelModulo";
import ProfessoresConfirmadosAba from "./ProfessoresConfirmadosAba";
import ProfessoresPendentesAba from "./ProfessoresPendentesAba";
import ModalVincularDisciplina from "./ModalVincularDisciplina";
import {
  listarProfessores,
  listarDisciplinas,
  confirmarProfessor,
  recusarProfessor,
  vincularDisciplina,
  desvincularDisciplina,
} from "../../../services/professoresService";
import { notificarAtualizacaoPendencias } from "../../../utils/notificacoesEventos";
import "./Professores.css";

export default function ProfessoresContainer() {
  const [abaAtiva, setAbaAtiva] = useState("confirmados");
  const [professores, setProfessores] = useState([]);
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([]);
  const [pendentesCount, setPendentesCount] = useState(0);

  // Mapa de disciplinas selecionadas para cada professor pendente: { [profId]: [id_disciplina, ...] }
  const [disciplinasPendentesMap, setDisciplinasPendentesMap] = useState({});

  const [busca, setBusca] = useState("");
  const [chaveRecarga, setChaveRecarga] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [processandoId, setProcessandoId] = useState(null);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  const exibirFeedback = (mensagem) => {
    setFeedback(mensagem);
    setTimeout(() => setFeedback(""), 4500);
  };

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
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [busca, chaveRecarga]);

  const professoresPendentes = professores.filter(
    (p) => p.status_confirmacao === "pendente"
  );
  const professoresConfirmados = professores.filter(
    (p) => p.status_confirmacao === "confirmado" || !p.status_confirmacao
  );

  const toggleDisciplinaPendente = (profId, idDisciplina) => {
    setDisciplinasPendentesMap((prev) => {
      const atuais = prev[profId] || [];
      const existe = atuais.includes(idDisciplina);
      const novos = existe
        ? atuais.filter((id) => id !== idDisciplina)
        : [...atuais, idDisciplina];
      return { ...prev, [profId]: novos };
    });
  };

  const handleConfirmar = async (prof) => {
    const disciplinasSelecionadas = disciplinasPendentesMap[prof.id] || [];
    if (disciplinasSelecionadas.length === 0) {
      exibirFeedback("Selecione pelo menos uma disciplina para aprovar o acesso do professor.");
      return;
    }

    setProcessandoId(prof.id);
    setErro("");
    try {
      await confirmarProfessor(prof.id, disciplinasSelecionadas);
      exibirFeedback(`Professor(a) ${prof.name} confirmado(a) e vinculado(a) com sucesso!`);
      notificarAtualizacaoPendencias();
      setChaveRecarga((c) => c + 1);
    } catch (err) {
      setErro(err.message || "Erro ao aprovar o professor.");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRecusar = async (profId) => {
    if (!window.confirm("Deseja realmente recusar o vínculo deste professor com a escola?")) {
      return;
    }

    setProcessandoId(profId);
    setErro("");
    try {
      await recusarProfessor(profId);
      exibirFeedback("Vínculo do professor recusado.");
      notificarAtualizacaoPendencias();
      setChaveRecarga((c) => c + 1);
    } catch (err) {
      setErro(err.message || "Erro ao recusar o professor.");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleDesvincular = async (profId, disciplinaId) => {
    await desvincularDisciplina(profId, disciplinaId);
    exibirFeedback("Disciplina desvinculada com sucesso.");
    setChaveRecarga((c) => c + 1);
  };

  const handleVincularModal = async (profId, disciplinaId) => {
    await vincularDisciplina(profId, disciplinaId);
    exibirFeedback(`Disciplina vinculada ao professor(a) ${professorSelecionado.name}!`);
    setChaveRecarga((c) => c + 1);
  };

  const acoesProfessores = (
    <div className="d-flex align-items-center gap-2">
      <div className="input-group input-group-sm" style={{ width: "220px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="search"
          className="form-control border-start-0 ps-0 shadow-none"
          placeholder="Buscar professor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="position-relative professores-page-viewport-lock">
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
        acoes={acoesProfessores}
      >
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-2 py-2 px-3 flex-shrink-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {erro}
          </div>
        )}

        {/* Sub-navegação interna entre Confirmados e Pendentes */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-1 bg-light rounded-3 border flex-shrink-0 mb-2">
          <div className="d-flex flex-wrap align-items-center gap-1">
            <button
              type="button"
              className={`btn btn-sm rounded-2 px-3 py-1 fw-semibold border-0 d-flex align-items-center gap-1.5 transition-all ${
                abaAtiva === "confirmados"
                  ? "btn-primary text-white shadow-xs"
                  : "btn-light text-muted"
              }`}
              onClick={() => setAbaAtiva("confirmados")}
            >
              <i className="bi bi-check-circle-fill"></i>
              <span>Docentes Ativos</span>
              <span className="badge bg-white text-primary rounded-pill ms-1">
                {professoresConfirmados.length}
              </span>
            </button>

            <button
              type="button"
              className={`btn btn-sm rounded-2 px-3 py-1 fw-semibold border-0 d-flex align-items-center gap-1.5 transition-all ${
                abaAtiva === "pendentes"
                  ? "btn-primary text-white shadow-xs"
                  : "btn-light text-muted"
              }`}
              onClick={() => setAbaAtiva("pendentes")}
            >
              <i className="bi bi-hourglass-split"></i>
              <span>Aguardando Validação</span>
              {pendentesCount > 0 && (
                <span className="badge bg-warning text-dark rounded-pill ms-1">
                  {pendentesCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-muted small px-2">
            <strong>{professores.length}</strong> professor(es) cadastrado(s)
          </div>
        </div>

        {/* Conteúdo da Aba Ativa com rolagem interna confinada */}
        <div className="modulo-conteudo-scroll pt-1 pb-2">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Carregando corpo docente da escola...</p>
            </div>
          ) : abaAtiva === "pendentes" ? (
            <ProfessoresPendentesAba
              professoresPendentes={professoresPendentes}
              disciplinasCatalogo={disciplinasCatalogo}
              disciplinasPendentesMap={disciplinasPendentesMap}
              processandoId={processandoId}
              onToggleDisciplinaPendente={toggleDisciplinaPendente}
              onConfirmar={handleConfirmar}
              onRecusar={handleRecusar}
            />
          ) : (
            <ProfessoresConfirmadosAba
              professoresConfirmados={professoresConfirmados}
              onAbrirModalVincular={(prof) => setProfessorSelecionado(prof)}
            />
          )}
        </div>
      </PainelModulo>

      {/* Modal de Gerenciamento de Vínculos com Disciplinas */}
      {professorSelecionado && (
        <ModalVincularDisciplina
          professor={professorSelecionado}
          disciplinasCatalogo={disciplinasCatalogo}
          onClose={() => setProfessorSelecionado(null)}
          onVincular={handleVincularModal}
          onDesvincular={handleDesvincular}
        />
      )}
    </div>
  );
}
