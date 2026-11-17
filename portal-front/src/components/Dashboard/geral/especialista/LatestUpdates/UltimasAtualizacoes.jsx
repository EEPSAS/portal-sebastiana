import { useState, useCallback } from "react";
import UpdateItem from "./UltimasAtualizacoesLista.jsx";
import { fetchDashboardNotificacoes } from "../../../../../services/geralService";

/**
 * UltimasAtualizacoes.jsx - Feed de Atividades Recentes do Painel Geral
 *
 * Papel Didático:
 * - Exibe por padrão as 5 notificações mais recentes (preload leve).
 * - Permite expandir sob demanda para 25 ou 50 notificações sem sobrecarregar o backend.
 * - Suporta filtros por quem enviou (remetente), quem recebeu (destinatário) e categoria.
 */
export default function LatestUpdates({
  updates = [],
  loading = false,
  error = null,
}) {
  const [limite, setLimite] = useState(5);
  const [filtroRemetente, setFiltroRemetente] = useState("");
  const [filtroDestinatario, setFiltroDestinatario] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Armazena itens obtidos sob demanda quando o usuário altera o limite para 25/50 ou aplica filtros
  const [notificacoesCustom, setNotificacoesCustom] = useState(null);
  const [carregandoSobDemanda, setCarregandoSobDemanda] = useState(false);
  const [erroSobDemanda, setErroSobDemanda] = useState(null);

  const temFiltroAtivo =
    limite !== 5 ||
    Boolean(filtroRemetente.trim()) ||
    Boolean(filtroDestinatario.trim()) ||
    filtroCategoria !== "todos";

  const carregarNotificacoes = useCallback(
    async (limiteAtual, remetente, destinatario, categoria) => {
      // Se estiver em 5 e sem nenhum filtro, voltamos para o preload padrão leve
      if (
        limiteAtual === 5 &&
        !remetente.trim() &&
        !destinatario.trim() &&
        categoria === "todos"
      ) {
        setNotificacoesCustom(null);
        setErroSobDemanda(null);
        return;
      }

      setCarregandoSobDemanda(true);
      setErroSobDemanda(null);
      try {
        const dados = await fetchDashboardNotificacoes({
          limite: limiteAtual,
          remetente,
          destinatario,
          categoria,
        });
        setNotificacoesCustom(dados);
      } catch (err) {
        setErroSobDemanda(err.message || "Erro ao consultar notificações.");
      } finally {
        setCarregandoSobDemanda(false);
      }
    },
    []
  );

  // Ao mudar o select de limite (5, 25, 50), dispara a busca sob demanda
  const handleMudarLimite = (novoLimite) => {
    setLimite(novoLimite);
    carregarNotificacoes(
      novoLimite,
      filtroRemetente,
      filtroDestinatario,
      filtroCategoria
    );
  };

  const handleAplicarFiltros = (e) => {
    if (e) e.preventDefault();
    carregarNotificacoes(
      limite,
      filtroRemetente,
      filtroDestinatario,
      filtroCategoria
    );
  };

  const handleLimparFiltros = () => {
    setLimite(5);
    setFiltroRemetente("");
    setFiltroDestinatario("");
    setFiltroCategoria("todos");
    setNotificacoesCustom(null);
    setErroSobDemanda(null);
  };

  // Lista efetiva: se houve busca sob demanda usa notificacoesCustom, senão usa updates do preload leve
  const listaExibida = notificacoesCustom !== null ? notificacoesCustom : updates;
  const estaCarregando = loading || carregandoSobDemanda;
  const erroAtual = error || erroSobDemanda;
  const totalExibido = listaExibida?.length ?? 0;

  return (
    <div className="geral-updates-card mt-2 w-100 d-flex flex-column min-h-0">
      {/* 1. Cabeçalho com Título, Seletor de Quantidade (5, 25, 50) e Botão de Filtros */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 flex-shrink-0">
        <h5 className="geral-updates-title mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bell-fill text-primary fs-5" aria-hidden="true"></i>
          <span>Últimas Notificações</span>
          {notificacoesCustom !== null && (
            <span className="badge rounded-pill bg-light text-secondary border small fw-normal">
              {totalExibido} encontrada(s)
            </span>
          )}
        </h5>

        <div className="d-flex align-items-center gap-2">
          {/* Seletor sob demanda para 5, 25 ou 50 */}
          <div className="d-flex align-items-center gap-1.5">
            <label htmlFor="select-notificacoes-limite" className="small text-muted fw-semibold mb-0 text-nowrap">
              Exibir:
            </label>
            <select
              id="select-notificacoes-limite"
              className="form-select form-select-sm fw-bold border-secondary-subtle"
              style={{ width: "115px" }}
              value={limite}
              onChange={(e) => handleMudarLimite(Number(e.target.value))}
              aria-label="Selecionar quantidade de notificações para carregar"
            >
              <option value={5}>5 últimas</option>
              <option value={25}>25 últimas</option>
              <option value={50}>50 últimas</option>
            </select>
          </div>

          {/* Botão para alternar barra de filtros */}
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-2.5 d-flex align-items-center gap-1 fw-semibold ${
              temFiltroAtivo ? "btn-primary shadow-sm" : "btn-outline-secondary"
            }`}
            onClick={() => setMostrarFiltros((prev) => !prev)}
            aria-expanded={mostrarFiltros}
            title="Filtrar por destinatário, remetente ou categoria"
          >
            <i className="bi bi-funnel"></i>
            <span className="d-none d-sm-inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros Colapsável */}
      {mostrarFiltros && (
        <form
          onSubmit={handleAplicarFiltros}
          className="p-2.5 rounded-3 mb-2 flex-shrink-0"
          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label htmlFor="filtro-remetente" className="form-label small fw-semibold text-dark mb-1">
                Quem enviou (Remetente)
              </label>
              <input
                id="filtro-remetente"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex: Carlos, Nana, Sistema..."
                value={filtroRemetente}
                onChange={(e) => setFiltroRemetente(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro-destinatario" className="form-label small fw-semibold text-dark mb-1">
                Quem recebeu (Destinatário)
              </label>
              <input
                id="filtro-destinatario"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex: Nome do aluno..."
                value={filtroDestinatario}
                onChange={(e) => setFiltroDestinatario(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro-categoria" className="form-label small fw-semibold text-dark mb-1">
                Categoria da Notificação
              </label>
              <select
                id="filtro-categoria"
                className="form-select form-select-sm"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="todos">Todas as Categorias</option>
                <option value="manual">Comunicação Escolar</option>
                <option value="biblioteca">Biblioteca</option>
                <option value="aprovacao_login">Acesso e Contas</option>
                <option value="sistema">Avisos do Sistema</option>
              </select>
            </div>

            <div className="col-12 d-flex justify-content-end gap-2 mt-2">
              {temFiltroAtivo && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  onClick={handleLimparFiltros}
                >
                  Limpar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                disabled={carregandoSobDemanda}
              >
                <i className="bi bi-search"></i>
                <span>{carregandoSobDemanda ? "Buscando..." : "Aplicar Filtros"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Estados de Carregamento e Erro */}
      {estaCarregando && (
        <div className="text-muted py-3 text-center d-flex align-items-center justify-content-center gap-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span className="small">Carregando atualizações...</span>
        </div>
      )}

      {erroAtual && (
        <div className="alert alert-danger py-2 small mb-2" role="alert">
          {erroAtual}
        </div>
      )}

      {/* 4. Estado Vazio */}
      {!estaCarregando && !erroAtual && totalExibido === 0 && (
        <div className="text-muted py-4 text-center small">
          Nenhuma notificação encontrada com os critérios informados.
        </div>
      )}

      {/* 5. Lista com rolagem interna confinada no card */}
      {!estaCarregando && !erroAtual && totalExibido > 0 && (
        <div className="d-flex flex-column geral-updates-scroll min-h-0 flex-grow-1">
          {listaExibida.map((update, idx) => (
            <UpdateItem
              key={update.id || `notif-${idx}`}
              tipo={update.tipo}
              categoria={update.categoria}
              categoriaRotulo={update.categoria_rotulo}
              texto={update.texto}
              titulo={update.titulo}
              assunto={update.assunto}
              criadorNome={update.criador_nome}
              destinatarioNome={update.destinatario_nome}
              tempoAtras={update.tempoAtras}
            />
          ))}
        </div>
      )}
    </div>
  );
}