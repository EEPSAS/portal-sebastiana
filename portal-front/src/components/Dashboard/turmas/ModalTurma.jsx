/**
 * ModalTurma.jsx - Formulário de Criação e Edição de Turma com Vínculo de Ciclo e Período Letivo
 *
 * Papel Didático:
 * 1. Atende à Diretriz 3.2a:
 *    Permite atribuir um Ciclo (ex: 1º Ano, 2º Ano, 3º Ano) à Turma.
 *    Ao pertencer a um Ciclo, a turma herda automaticamente todas as disciplinas
 *    daquele ciclo e seus respectivos professores titulares.
 * 2. Vínculo Obrigatório com o Período Letivo:
 *    Obrigatório selecionar o Período Letivo oficial cadastrado no sistema (Ano Letivo),
 *    garantindo que todas as turmas, matrículas e diários estejam formalmente atrelados
 *    ao calendário e ciclo avaliativo em vigor.
 */

import { useEffect, useState } from "react";
import { atualizarTurma, criarTurma } from "../../../services/turmasService";
import { listarCiclos } from "../../../services/disciplinasService";
import { listarPeriodosLetivos } from "../../../services/periodosLetivosService";

/**
 * Conteúdo interno do formulário de criação/edição de turma.
 */
const ModalTurmaContent = ({ turmaParaEditar, onClose, onSuccess }) => {
  const [nomeIdentificador, setNomeIdentificador] = useState(
    () => turmaParaEditar?.nome_identificador || ""
  );
  const [cicloId, setCicloId] = useState(
    () => (turmaParaEditar?.ciclo_id ? String(turmaParaEditar.ciclo_id) : "")
  );
  const [turno, setTurno] = useState(() => turmaParaEditar?.turno || "Matutino");
  const [anoLetivo, setAnoLetivo] = useState(
    () => (turmaParaEditar?.ano_letivo ? String(turmaParaEditar.ano_letivo) : "")
  );
  const [status, setStatus] = useState(() => turmaParaEditar?.status || "Ativa");

  const [ciclosDisponiveis, setCiclosDisponiveis] = useState([]);
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const isEdicao = Boolean(turmaParaEditar?.id_turma);

  useEffect(() => {
    let ativo = true;

    Promise.all([listarCiclos(), listarPeriodosLetivos()])
      .then(([ciclos, periodos]) => {
        if (!ativo) return;
        setCiclosDisponiveis(ciclos || []);

        const listaPeriodos = periodos || [];
        setPeriodosDisponiveis(listaPeriodos);

        // Se estiver criando nova turma e o ano letivo ainda não foi escolhido, pré-seleciona o período ativo vigente
        if (!turmaParaEditar?.ano_letivo && listaPeriodos.length > 0) {
          const periodoAtivo = listaPeriodos.find((p) => p.ativo) || listaPeriodos[0];
          if (periodoAtivo) {
            setAnoLetivo(String(periodoAtivo.ano));
          }
        }
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, [turmaParaEditar?.ano_letivo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");

    if (!nomeIdentificador.trim()) {
      setErro("Informe o nome identificador da turma.");
      return;
    }

    if (!anoLetivo) {
      setErro("A seleção do Período Letivo é obrigatória para vincular a turma.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome_identificador: nomeIdentificador.trim(),
        ciclo_id: cicloId ? Number(cicloId) : null,
        turno,
        ano_letivo: Number(anoLetivo),
        status,
      };

      let resultado;
      if (isEdicao) {
        resultado = await atualizarTurma(turmaParaEditar.id_turma, payload);
      } else {
        resultado = await criarTurma(payload);
      }

      if (onSuccess) {
        onSuccess(resultado, isEdicao);
      }
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao salvar os dados da turma.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="turmas-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="turmas-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-turma-titulo"
      >
        {/* Cabeçalho do Modal */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h5 id="modal-turma-titulo" className="fw-bold mb-0 text-dark">
            {isEdicao ? "Editar Turma" : "Cadastrar Nova Turma"}
          </h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={onClose}
            disabled={salvando}
          ></button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {erro && (
            <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {erro}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="nome-identificador" className="form-label small fw-bold text-dark">
              Nome da Turma / Identificador *:
            </label>
            <input
              id="nome-identificador"
              type="text"
              className="form-control"
              placeholder="Ex: 3º Ano A - Informática"
              value={nomeIdentificador}
              onChange={(e) => setNomeIdentificador(e.target.value)}
              disabled={salvando}
              required
            />
          </div>

          {/* Seleção de Ciclo Curricular (Diretriz 3.2a) */}
          <div className="mb-3">
            <label htmlFor="ciclo-turma" className="form-label small fw-bold text-dark">
              Ciclo Curricular (Herdar Disciplinas e Professores):
            </label>
            <select
              id="ciclo-turma"
              className="form-select"
              value={cicloId}
              onChange={(e) => setCicloId(e.target.value)}
              disabled={salvando}
            >
              <option value="">Sem ciclo específico (personalizado)</option>
              {ciclosDisponiveis.map((c) => (
                <option key={c.id_ciclo} value={c.id_ciclo}>
                  {c.nome}
                </option>
              ))}
            </select>
            <small className="text-muted d-block mt-1" style={{ fontSize: "0.75rem" }}>
              Ao associar um Ciclo, a turma herda automaticamente todas as disciplinas e docentes daquele ciclo.
            </small>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-12 col-sm-6">
              <label htmlFor="turno-turma" className="form-label small fw-bold text-dark">
                Turno *:
              </label>
              <select
                id="turno-turma"
                className="form-select"
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                disabled={salvando}
              >
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Noturno">Noturno</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            {/* Vínculo Obrigatório com o Período Letivo Cadastrado */}
            <div className="col-12 col-sm-6">
              <label htmlFor="ano-letivo" className="form-label small fw-bold text-dark">
                Período Letivo / Ano *:
              </label>
              <select
                id="ano-letivo"
                className="form-select"
                value={anoLetivo}
                onChange={(e) => setAnoLetivo(e.target.value)}
                disabled={salvando}
                required
              >
                <option value="">Selecione o período letivo...</option>
                {periodosDisponiveis.map((p) => (
                  <option key={p.id_periodo_letivo || p.ano} value={p.ano}>
                    Ano {p.ano} — {p.tipo_divisao?.toUpperCase()} {p.ativo ? "(Vigente / Ativo)" : `(${p.status})`}
                  </option>
                ))}
              </select>
              {periodosDisponiveis.length === 0 && (
                <small className="text-danger d-block mt-1" style={{ fontSize: "0.73rem" }}>
                  Nenhum período letivo cadastrado. Cadastre um período primeiro em Acadêmico &gt; Período Letivo.
                </small>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="status-turma" className="form-label small fw-bold text-dark">
              Status da Turma:
            </label>
            <select
              id="status-turma"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={salvando}
            >
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
              <option value="Concluída">Concluída</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-light border px-3 rounded-pill"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm turmas-btn-primario px-4 rounded-pill"
              disabled={salvando || periodosDisponiveis.length === 0}
            >
              {salvando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Salvando...
                </>
              ) : isEdicao ? (
                "Salvar Alterações"
              ) : (
                "Cadastrar Turma"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Componente invólucro do Modal de Turmas com desmontagem e remontagem segura por chave.
 */
const ModalTurma = ({ isOpen, turmaParaEditar, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <ModalTurmaContent
      key={turmaParaEditar?.id_turma || "nova-turma"}
      turmaParaEditar={turmaParaEditar}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default ModalTurma;
