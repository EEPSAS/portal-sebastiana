import { useState, useEffect } from "react";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import ListaPeriodosCard from "../../components/Dashboard/periodoLetivo/ListaPeriodosCard";
import ModalPeriodoLetivo from "../../components/Dashboard/periodoLetivo/ModalPeriodoLetivo";
import { useAuth } from "../../hooks/useAuth";
import {
  listarPeriodosLetivos,
  criarPeriodoLetivo,
  atualizarPeriodoLetivo,
  ativarPeriodoLetivo,
  excluirPeriodoLetivo,
  sincronizarAgendaPeriodo,
} from "../../services/periodosLetivosService";

/**
 * PeriodoLetivo.jsx - Página Oficial de Gestão do Período Letivo (Módulo Acadêmico)
 *
 * Papel Didático:
 * Atende ao Upgrade do Módulo Acadêmico:
 * 1. Permite ao Especialista e Administrador cadastrar o Ano Letivo, escolher o formato
 *    de divisão (Bimestre, Trimestre ou Semestre), definir a pontuação global e individual
 *    das etapas e estipular os intervalos oficiais de início e término.
 * 2. Disponibiliza ativação de período vigente e sincronização com a Agenda/Calendário escolar.
 * 3. Trata visualmente os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio).
 */
export default function PeriodoLetivoPage() {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Estado do Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [periodoEmEdicao, setPeriodoEmEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Ação em processamento por card (ex: ativação ou sincronização)
  const [acaoEmProgressoId, setAcaoEmProgressoId] = useState(null);

  useEffect(() => {
    let ativo = true;

    listarPeriodosLetivos()
      .then((lista) => {
        if (!ativo) return;
        setPeriodos(lista);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.message || "Não foi possível carregar os períodos letivos.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const recarregarPeriodos = async () => {
    try {
      const lista = await listarPeriodosLetivos();
      setPeriodos(lista);
    } catch (err) {
      setErro(err.message || "Não foi possível recarregar os períodos letivos.");
    }
  };

  const handleAbrirCriacao = () => {
    setPeriodoEmEdicao(null);
    setModalAberto(true);
    setMensagemSucesso("");
  };

  const handleAbrirEdicao = (periodo) => {
    setPeriodoEmEdicao(periodo);
    setModalAberto(true);
    setMensagemSucesso("");
  };

  const handleSalvar = async (payload) => {
    setSalvando(true);
    setErro("");
    try {
      if (periodoEmEdicao) {
        await atualizarPeriodoLetivo(periodoEmEdicao.id_periodo_letivo, payload);
        setMensagemSucesso(`Período Letivo de ${payload.ano} atualizado com sucesso!`);
      } else {
        await criarPeriodoLetivo(payload);
        setMensagemSucesso(`Período Letivo de ${payload.ano} criado com sucesso e sincronizado com o calendário!`);
      }
      setModalAberto(false);
      await recarregarPeriodos();
    } catch (err) {
      setErro(err.message || "Erro ao salvar período letivo.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtivar = async (periodo) => {
    setAcaoEmProgressoId(periodo.id_periodo_letivo);
    setErro("");
    try {
      await ativarPeriodoLetivo(periodo.id_periodo_letivo);
      setMensagemSucesso(`Ano Letivo de ${periodo.ano} agora é o período vigente da escola.`);
      await recarregarPeriodos();
    } catch (err) {
      setErro(err.message || "Não foi possível ativar o período letivo.");
    } finally {
      setAcaoEmProgressoId(null);
    }
  };

  const handleSincronizarAgenda = async (periodo) => {
    setAcaoEmProgressoId(periodo.id_periodo_letivo);
    setErro("");
    try {
      const res = await sincronizarAgendaPeriodo(periodo.id_periodo_letivo);
      setMensagemSucesso(res?.message || `Marcos escolares de ${periodo.ano} sincronizados com o calendário com sucesso.`);
    } catch (err) {
      setErro(err.message || "Erro ao sincronizar marcos na agenda.");
    } finally {
      setAcaoEmProgressoId(null);
    }
  };

  const handleExcluir = async (periodo) => {
    setAcaoEmProgressoId(periodo.id_periodo_letivo);
    setErro("");
    try {
      await excluirPeriodoLetivo(periodo.id_periodo_letivo);
      setMensagemSucesso(`Período Letivo de ${periodo.ano} excluído.`);
      await recarregarPeriodos();
    } catch (err) {
      setErro(err.message || "Erro ao excluir o período letivo.");
    } finally {
      setAcaoEmProgressoId(null);
    }
  };

  const acoesCabecalho = podeGerenciar ? (
    <button
      type="button"
      className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
      onClick={handleAbrirCriacao}
    >
      <i className="bi bi-plus-circle-fill fs-6"></i>
      <span>Novo Período Letivo</span>
    </button>
  ) : null;

  return (
    <PainelModulo
      titulo="Período Letivo"
      subtitulo="Configuração do ano letivo escolar, ciclos avaliativos (Bimestres/Trimestres), pontuações e marcos institucionais."
      icone="bi-calendar-range"
      mostrarNav={false}
      acoes={acoesCabecalho}
    >
      {/* Alertas de Feedback */}
      {mensagemSucesso && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5 align-middle"></i>
          <span>{mensagemSucesso}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() => setMensagemSucesso("")}
          ></button>
        </div>
      )}

      {erro && (
        <div className="alert alert-danger alert-dismissible fade show rounded-4 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5 align-middle"></i>
          <span>{erro}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() => setErro("")}
          ></button>
        </div>
      )}

      {/* 1. Estado Assíncrono: Carregando */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando períodos letivos...</span>
          </div>
          <p className="text-muted mt-2 small">Carregando configurações de períodos letivos...</p>
        </div>
      )}

      {/* 2. Estado Assíncrono: Vazio */}
      {!loading && !erro && periodos.length === 0 && (
        <div className="text-center py-5 bg-white rounded-4 border p-5">
          <i className="bi bi-calendar-x fs-1 text-muted d-block mb-3"></i>
          <h5 className="fw-bold text-dark">Nenhum período letivo cadastrado</h5>
          <p className="text-muted small mb-4" style={{ maxWidth: "480px", margin: "0 auto" }}>
            Cadastre o primeiro ano letivo para configurar as divisões avaliativas (bimestres ou trimestres),
            distribuir os pontos e sincronizar os marcos no calendário escolar.
          </p>
          {podeGerenciar && (
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 fw-semibold"
              onClick={handleAbrirCriacao}
            >
              <i className="bi bi-plus-lg me-1"></i> Cadastrar Período Letivo
            </button>
          )}
        </div>
      )}

      {/* 3. Lista de Períodos Letivos Cadastrados */}
      {!loading && periodos.length > 0 && (
        <ListaPeriodosCard
          periodos={periodos}
          podeGerenciar={podeGerenciar}
          onEditar={handleAbrirEdicao}
          onAtivar={handleAtivar}
          onSincronizarAgenda={handleSincronizarAgenda}
          onExcluir={handleExcluir}
          acaoEmProgressoId={acaoEmProgressoId}
        />
      )}

      {/* Modal de Criação / Edição */}
      <ModalPeriodoLetivo
        aberto={modalAberto}
        periodoEmEdicao={periodoEmEdicao}
        onFechar={() => setModalAberto(false)}
        onSalvar={handleSalvar}
        salvando={salvando}
      />
    </PainelModulo>
  );
}
