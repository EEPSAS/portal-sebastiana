import { useState } from "react";
import { useDashboardBibliotecario } from "../../../../hooks/geral/bibliotecario/useDashboardBibliotecario";
import dadosTopLivrosMock from "./dadosTopLivrosMock";
import CirculacaoAtivaCard from "./CirculacaoAtivaCard";
import DestaqueMesCard from "./DestaqueMesCard";
import DevolucoesTabela from "./DevolucoesTabela";
import ModalCriarNotificacao from "../../turmas/ModalCriarNotificacao";

/** Organiza o painel bibliotecário em cards responsivos com dados do serviço da biblioteca. */
const GeralBibliotecario = () => {
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const {
    quantidadeAtiva,
    devolucoesRecentes,
    devolucoesEmAtraso,
    devolucoesHoje,
    devolucoesProximosDias,
    destaqueDoMes,
    mesAtual,
    formatarData,
    loading,
    error,
  } = useDashboardBibliotecario();
  const matriculaNotificacao = emprestimoSelecionado
    ? {
        aluno: {
          id: emprestimoSelecionado.usuario?.id,
          name: emprestimoSelecionado.usuario?.name,
        },
      }
    : null;

  if (loading) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" aria-hidden="true"></div>
        <p className="text-muted mt-2 mb-0">Carregando dados da biblioteca...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-4" role="alert">
        Não foi possível carregar os dados da biblioteca: {error}
      </div>
    );
  }

  return (
    <div className="librarian-overview">
      {mensagemSucesso && (
        <div className="alert alert-success py-2" role="status">
          {mensagemSucesso}
        </div>
      )}
      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-6">
          <DestaqueMesCard
            destaque={destaqueDoMes}
            mesAtual={mesAtual}
            topLivros={dadosTopLivrosMock}
          />
        </div>
        <div className="col-12 col-xl-6">
          <CirculacaoAtivaCard
            quantidadeAtiva={quantidadeAtiva}
            devolucoesRecentes={devolucoesRecentes}
            formatarData={formatarData}
          />
        </div>
      </div>

      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-lg-4">
          <DevolucoesTabela
            titulo="Devoluções em atraso"
            emprestimos={devolucoesEmAtraso}
            formatarData={formatarData}
            mensagemVazia="Não há devoluções em atraso."
            corBadge="text-bg-danger"
            onNotificar={setEmprestimoSelecionado}
          />
        </div>
        <div className="col-12 col-lg-4">
          <DevolucoesTabela
            titulo="Devoluções para hoje"
            emprestimos={devolucoesHoje}
            formatarData={formatarData}
            mensagemVazia="Não há devoluções previstas para hoje."
            corBadge="text-bg-warning"
            onNotificar={setEmprestimoSelecionado}
          />
        </div>
        <div className="col-12 col-lg-4">
          <DevolucoesTabela
            titulo="Devoluções nos próximos 3 dias"
            emprestimos={devolucoesProximosDias}
            formatarData={formatarData}
            mensagemVazia="Não há devoluções previstas nos próximos 3 dias."
            corBadge="text-bg-primary"
            onNotificar={setEmprestimoSelecionado}
          />
        </div>
      </div>
      {matriculaNotificacao && (
        <ModalCriarNotificacao
          matricula={matriculaNotificacao}
          matriculas={[matriculaNotificacao]}
          turmas={[]}
          role="bibliotecaria"
          somenteAluno
          onClose={() => setEmprestimoSelecionado(null)}
          onCreated={() => {
            setEmprestimoSelecionado(null);
            setMensagemSucesso("Notificação enviada ao estudante.");
          }}
        />
      )}
    </div>
  );
};

export default GeralBibliotecario;