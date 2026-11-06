import { useEffect, useState } from "react";
import {
  fetchTurmaDisciplinas,
  lancarFrequenciaManual,
  lancarNotaManual,
} from "../../../services/turmasService";
import { formatarDisciplinaCiclo } from "../../../utils/formatters";

// Mantém a data no calendário local sem deslocamento causado pelo fuso horário.
const dataHoje = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

export default function ModalLancamentoManual({
  turmaId,
  alunos,
  periodos,
  periodoInicial,
  alunoInicial,
  onClose,
  onSuccess,
}) {
  const [tipo, setTipo] = useState("nota");
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [alunoId, setAlunoId] = useState(alunoInicial || "");
  const [periodo, setPeriodo] = useState(periodoInicial && periodoInicial !== "todos" ? periodoInicial : "");
  const [tipoAvaliacao, setTipoAvaliacao] = useState("");
  const [valorNota, setValorNota] = useState("");
  const [valorMaximo, setValorMaximo] = useState("");
  const [dataRegistro, setDataRegistro] = useState(dataHoje);
  const [observacoes, setObservacoes] = useState("");
  const [quantidadeAulas, setQuantidadeAulas] = useState("1");
  const [statusPresenca, setStatusPresenca] = useState("Presente");
  const [justificativa, setJustificativa] = useState("");
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    fetchTurmaDisciplinas(turmaId)
      .then((lista) => {
        if (ativo) {
          setDisciplinas(lista);
          setDisciplinaId(String(lista[0]?.id_disciplina || ""));
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregandoDisciplinas(false);
      });

    return () => {
      ativo = false;
    };
  }, [turmaId]);

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      const base = {
        turma_id: Number(turmaId),
        disciplina_id: Number(disciplinaId),
        usuario_id: Number(alunoId),
      };

      if (tipo === "nota") {
        await lancarNotaManual({
          ...base,
          periodo_letivo: periodo,
          tipo_avaliacao: tipoAvaliacao,
          valor_nota: Number(valorNota),
          valor_maximo: Number(valorMaximo),
          data_registro: dataRegistro,
          observacoes: observacoes || null,
        });
      } else {
        await lancarFrequenciaManual({
          ...base,
          data_aula: dataRegistro,
          quantidade_aulas: Number(quantidadeAulas),
          status_presenca: statusPresenca,
          justificativa: justificativa || null,
        });
      }

      onSuccess(tipo);
      onClose();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="lancamento-manual-titulo" style={{ backgroundColor: "rgba(0,0,0,.55)", zIndex: 1080 }}>
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content border-0 shadow rounded-4" onSubmit={enviar}>
          <div className="modal-header border-0">
            <div>
              <h2 className="modal-title h5 fw-bold" id="lancamento-manual-titulo">Lançamento acadêmico manual</h2>
              <p className="small text-muted mb-0">Use esta opção como redundância ao arquivo CSV.</p>
            </div>
            <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} disabled={salvando} />
          </div>
          <div className="modal-body pt-0">
            {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="manual-tipo">Tipo de lançamento</label>
                <select id="manual-tipo" className="form-select" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  <option value="nota">Nota</option>
                  <option value="frequencia">Frequência</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="manual-aluno">Aluno</label>
                <select id="manual-aluno" className="form-select" required value={alunoId} onChange={(event) => setAlunoId(event.target.value)}>
                  <option value="">Selecione</option>
                  {alunos.map((aluno) => <option key={aluno.id} value={aluno.id}>{aluno.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="manual-disciplina">Disciplina</label>
                <select id="manual-disciplina" className="form-select" required value={disciplinaId} onChange={(event) => setDisciplinaId(event.target.value)} disabled={carregandoDisciplinas}>
                  <option value="">{carregandoDisciplinas ? "Carregando..." : "Selecione"}</option>
                  {/* Nome + Ciclo (ex.: "Filosofia - 2º Ano regular") para evitar ambiguidade entre ciclos */}
              {disciplinas.map((disciplina) => <option key={disciplina.id_disciplina} value={disciplina.id_disciplina}>{formatarDisciplinaCiclo(disciplina)}</option>)}
                </select>
              </div>
              {tipo === "nota" ? (
                <>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-periodo">Período letivo</label>
                    <select id="manual-periodo" className="form-select" required value={periodo} onChange={(event) => setPeriodo(event.target.value)}>
                      <option value="">Selecione</option>
                      {periodos.map((item) => <option key={item.id_divisao || item.nome} value={item.nome}>{item.nome}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-avaliacao">Avaliação</label>
                    <input id="manual-avaliacao" className="form-control" maxLength={100} required value={tipoAvaliacao} onChange={(event) => setTipoAvaliacao(event.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-nota">Nota</label>
                    <input id="manual-nota" className="form-control" type="number" min="0" step="0.01" required value={valorNota} onChange={(event) => setValorNota(event.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-maximo">Valor máximo</label>
                    <input id="manual-maximo" className="form-control" type="number" min="0.1" step="0.01" required value={valorMaximo} onChange={(event) => setValorMaximo(event.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="manual-observacoes">Observações (opcional)</label>
                    <input id="manual-observacoes" className="form-control" maxLength={255} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-aulas">Quantidade de aulas</label>
                    <input id="manual-aulas" className="form-control" type="number" min="1" max="10" required value={quantidadeAulas} onChange={(event) => setQuantidadeAulas(event.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="manual-presenca">Situação</label>
                    <select id="manual-presenca" className="form-select" value={statusPresenca} onChange={(event) => setStatusPresenca(event.target.value)}>
                      <option>Presente</option>
                      <option>Falta</option>
                      <option>Falta Justificada</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="manual-justificativa">Justificativa (opcional)</label>
                    <textarea id="manual-justificativa" className="form-control" maxLength={500} rows="2" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} />
                  </div>
                </>
              )}
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="manual-data">{tipo === "nota" ? "Data do registro" : "Data da aula"}</label>
                <input id="manual-data" className="form-control" type="date" required value={dataRegistro} onChange={(event) => setDataRegistro(event.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light border rounded-pill px-4" onClick={onClose} disabled={salvando}>Cancelar</button>
            <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={salvando || carregandoDisciplinas || !alunos.length || !disciplinas.length}>
              {salvando ? "Salvando..." : "Salvar lançamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
