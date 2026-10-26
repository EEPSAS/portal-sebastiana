import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  listarNotificacoes,
  listarSuperImportantes,
  marcarNotificacaoLida,
  marcarPadraoComoLidas,
} from "../../services/notificacoesService";

const lerLista = (resposta) => {
  if (Array.isArray(resposta)) return resposta;
  return Array.isArray(resposta?.data) ? resposta.data : [];
};

const lerMeta = (resposta) =>
  resposta?.meta || { current_page: 1, last_page: 1, total: 0 };

const NotificacoesHeader = () => {
  const { user } = useAuth();
  const [aberta, setAberta] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [superImportantes, setSuperImportantes] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [selecionada, setSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSuperImportante, setModalSuperImportante] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setCarregando(true);
      setErro("");

      try {
        const [pagina, prioritarias] = await Promise.all([
          listarNotificacoes(),
          listarSuperImportantes(),
        ]);

        if (!ativo) return;

        const listaSuper = lerLista(prioritarias);
        setNotificacoes(lerLista(pagina));
        setSuperImportantes(listaSuper);
        setMeta(lerMeta(pagina));

        if (listaSuper.length > 0) {
          setSelecionada(listaSuper[0]);
          setModalSuperImportante(true);
          setModalAberto(true);
        }
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    if (user?.id) carregar();

    return () => {
      ativo = false;
    };
  }, [user?.id]);

  const carregarMais = async (event) => {
    const elemento = event.currentTarget;
    const chegouAoFim =
      elemento.scrollTop + elemento.clientHeight >= elemento.scrollHeight - 8;

    if (!chegouAoFim || carregandoMais || meta.current_page >= meta.last_page) return;

    setCarregandoMais(true);
    setErro("");
    try {
      const pagina = await listarNotificacoes({ page: meta.current_page + 1 });
      setNotificacoes((atuais) => [
        ...atuais,
        ...lerLista(pagina).filter((item) => !atuais.some((atual) => atual.id === item.id)),
      ]);
      setMeta(pagina?.meta || meta);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregandoMais(false);
    }
  };

  const carregarPrimeiraPagina = async () => {
    const pagina = await listarNotificacoes();
    setNotificacoes(lerLista(pagina));
    setMeta(lerMeta(pagina));
  };

  const confirmarLeitura = async () => {
    if (!selecionada) return;

    setConfirmando(true);
    setErro("");
    try {
      await marcarNotificacaoLida(selecionada.id);
      setNotificacoes((atuais) => atuais.filter((item) => item.id !== selecionada.id));
      setMeta((atual) => ({ ...atual, total: Math.max(0, atual.total - 1) }));

      const filaAtualizada = superImportantes.filter((item) => item.id !== selecionada.id);
      setSuperImportantes(filaAtualizada);

      if (modalSuperImportante && filaAtualizada.length > 0) {
        setSelecionada(filaAtualizada[0]);
      } else {
        setSelecionada(null);
        setModalAberto(false);
        setModalSuperImportante(false);
      }

      try {
        await carregarPrimeiraPagina();
      } catch (error) {
        setErro(`Leitura confirmada, mas a lista não foi atualizada: ${error.message}`);
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setConfirmando(false);
    }
  };

  const confirmarTodasPadrao = async () => {
    setErro("");
    try {
      await marcarPadraoComoLidas();
    } catch (error) {
      setErro(error.message);
      return;
    }

    try {
      await carregarPrimeiraPagina();
    } catch (error) {
      setErro(`Notificações padrão confirmadas, mas a lista não foi atualizada: ${error.message}`);
    }
  };

  const abrirDetalhes = (notificacao) => {
    setSelecionada(notificacao);
    setModalSuperImportante(false);
    setModalAberto(true);
  };

  const fecharDetalhes = () => {
    setModalAberto(false);
    setModalSuperImportante(false);
    setSelecionada(null);
  };

  const temNotificacoesPendentes = meta.total > 0;
  const abrirCaixa = () => {
    const novaVisibilidade = !aberta;
    setAberta(novaVisibilidade);
    if (!novaVisibilidade) return;

    setCarregando(true);
    setErro("");
    carregarPrimeiraPagina()
      .catch((error) => setErro(error.message))
      .finally(() => setCarregando(false));
  };

  return (
    <>
      <div className="position-relative">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm rounded-circle position-relative"
          aria-label="Abrir notificações"
          aria-expanded={aberta}
          title="Notificações"
          onClick={abrirCaixa}
        >
          <i className="bi bi-bell"></i>
          {meta.total > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {meta.total > 99 ? "99+" : meta.total}
            </span>
          )}
        </button>

        {aberta && (
          <section
            className="position-absolute end-0 mt-2 bg-white border rounded-4 shadow-lg"
            style={{ width: "min(22rem, calc(100vw - 2rem))", zIndex: 1080 }}
            aria-label="Lista de notificações pendentes"
          >
            <div className="d-flex align-items-center justify-content-between gap-2 p-3 border-bottom">
              <h2 className="h6 fw-bold mb-0">Notificações</h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill"
                disabled={!temNotificacoesPendentes}
                onClick={confirmarTodasPadrao}
              >
                Verificar padrões
              </button>
            </div>

            {erro && <div className="alert alert-danger m-3 mb-0 py-2 small">{erro}</div>}
            {carregando ? (
              <div className="text-center text-muted small p-4" role="status">
                Carregando notificações...
              </div>
            ) : notificacoes.length === 0 ? (
              <p className="text-muted small text-center p-4 mb-0">
                Você não tem notificações pendentes.
              </p>
            ) : (
              <div
                className="list-group list-group-flush overflow-auto rounded-bottom-4"
                style={{ maxHeight: "22rem" }}
                onScroll={carregarMais}
              >
                {notificacoes.map((notificacao) => {
                  const importante = notificacao.prioridade !== "padrao";
                  return (
                    <button
                      key={notificacao.id}
                      type="button"
                      className={`list-group-item list-group-item-action text-start fw-semibold ${
                        importante ? "bg-danger-subtle text-danger" : "bg-white text-dark"
                      }`}
                      onClick={() => abrirDetalhes(notificacao)}
                    >
                      {notificacao.titulo}
                    </button>
                  );
                })}
                {carregandoMais && (
                  <div className="text-center text-muted small p-2" role="status">
                    Carregando mais...
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {modalAberto && selecionada && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notificacao-titulo"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1090 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0">
                <div>
                  {modalSuperImportante && (
                    <span className="badge bg-danger mb-2">Super-importante</span>
                  )}
                  <h2 className="modal-title h5 fw-bold" id="notificacao-titulo">
                    {selecionada.titulo}
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={fecharDetalhes}
                ></button>
              </div>
              <div className="modal-body pt-0">
                <p className="text-secondary mb-2" style={{ whiteSpace: "pre-wrap" }}>
                  {selecionada.assunto}
                </p>
                {selecionada.origem === "usuario" && selecionada.criador_nome && (
                  <small className="text-muted">Enviada por {selecionada.criador_nome}</small>
                )}
                {erro && <div className="alert alert-danger mt-3 mb-0 py-2">{erro}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${
                    selecionada.prioridade === "padrao" ? "btn-primary" : "btn-danger"
                  }`}
                  disabled={confirmando}
                  onClick={confirmarLeitura}
                >
                  {confirmando ? "Confirmando..." : "Confirmar leitura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificacoesHeader;
