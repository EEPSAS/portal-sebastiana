import { useCallback, useEffect, useState } from "react";
import { aprovacaoService } from "../../services/aprovacaoService";

const LABEL_PAPEL = {
  aluno: "Aluno",
  padrao: "Aluno",
  professor: "Professor",
};

// Apresenta somente os pedidos pendentes e envia a decisão ao backend autorizado.
const Aprovacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [error, setError] = useState("");

  const carregarSolicitacoes = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      setSolicitacoes(await aprovacaoService.listarSolicitacoes());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    aprovacaoService.listarSolicitacoes()
      .then((items) => {
        if (active) {
          setSolicitacoes(items);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const decidir = async (solicitacao, approvalStatus) => {
    setError("");
    setProcessandoId(solicitacao.id);

    try {
      await aprovacaoService.decidirSolicitacao(solicitacao.id, approvalStatus);
      setSolicitacoes((atuais) => atuais.filter((item) => item.id !== solicitacao.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <section className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Pedidos de acesso</h1>
          <p className="text-secondary mb-0">
            Analise as solicitações de alunos e professores da escola.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={carregarSolicitacoes}
          disabled={loading}
        >
          Atualizar lista
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary" role="status">
          <span className="spinner-border spinner-border-sm" />
          Carregando pedidos...
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="alert alert-info" role="status">
          Não há pedidos aguardando análise.
        </div>
      ) : (
        <div className="table-responsive bg-white rounded-3 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Perfil</th>
                <th scope="col">Solicitado em</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((solicitacao) => (
                <tr key={solicitacao.id}>
                  <td>{solicitacao.name}</td>
                  <td>{solicitacao.email}</td>
                  <td>{LABEL_PAPEL[solicitacao.role] || solicitacao.role}</td>
                  <td>
                    {solicitacao.created_at
                      ? new Date(solicitacao.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => decidir(solicitacao, "approved")}
                        disabled={processandoId !== null}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => decidir(solicitacao, "rejected")}
                        disabled={processandoId !== null}
                      >
                        Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Aprovacoes;
