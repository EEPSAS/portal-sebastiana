import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { gerarHorario, listarHorarios, moverAula } from '../../../services/horariosService';
import './HorariosEscolares.css';

const DIAS = [
  { numero: 1, nome: 'Segunda-feira' },
  { numero: 2, nome: 'Terça-feira' },
  { numero: 3, nome: 'Quarta-feira' },
  { numero: 4, nome: 'Quinta-feira' },
  { numero: 5, nome: 'Sexta-feira' },
];

const HorariosEscolares = () => {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const podeEditar = ['especialista', 'adm'].includes(role);
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvandoAula, setSalvandoAula] = useState(false);
  const [aulaArrastada, setAulaArrastada] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    const carregarHorarios = async () => {
      try {
        const resultado = await listarHorarios();
        if (ativo) {
          setTurmas(resultado);
          setTurmaSelecionadaId(String(resultado[0]?.turma?.id_turma || ''));
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    carregarHorarios();
    return () => {
      ativo = false;
    };
  }, []);

  const turmaSelecionada = turmas.find(
    ({ turma }) => String(turma.id_turma) === turmaSelecionadaId,
  );
  const horario = turmaSelecionada?.horario;
  const aulasPorPosicao = new Map(
    (horario?.aulas || []).map((aula) => [`${aula.dia_semana}-${aula.aula_numero}`, aula]),
  );

  const atualizarHorarioSelecionado = (horarioAtualizado) => {
    setTurmas((atuais) => atuais.map((item) => (
      String(item.turma.id_turma) === turmaSelecionadaId
        ? { ...item, horario: horarioAtualizado }
        : item
    )));
  };

  const handleGerar = async () => {
    if (!turmaSelecionada) return;

    setErro('');
    setGerando(true);
    try {
      const resultado = await gerarHorario(turmaSelecionadaId);
      atualizarHorarioSelecionado(resultado);
    } catch (error) {
      setErro(error.message);
    } finally {
      setGerando(false);
    }
  };

  const handleMoverAula = async (aula, dia, periodo) => {
    if (!horario || salvandoAula) return;

    setErro('');
    setSalvandoAula(true);
    try {
      const resultado = await moverAula(horario.id, aula.id, {
        destino_dia_semana: dia,
        destino_aula_numero: periodo,
      });
      atualizarHorarioSelecionado(resultado);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoAula(false);
      setAulaArrastada(null);
    }
  };

  return (
    <section className="horarios-escolares mt-4" aria-labelledby="horarios-escolares-titulo">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h3 id="horarios-escolares-titulo" className="h5 fw-bold mb-1">Horários das Turmas</h3>
          <p className="text-muted small mb-0">Grade semanal por turma e ano letivo.</p>
        </div>

        {turmas.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <label htmlFor="horario-turma" className="form-label small mb-0">Turma</label>
            <select
              id="horario-turma"
              className="form-select form-select-sm horario-turma-seletor"
              value={turmaSelecionadaId}
              onChange={(event) => {
                setTurmaSelecionadaId(event.target.value);
                setErro('');
                setAulaArrastada(null);
                setEditando(false);
              }}
            >
              {turmas.map(({ turma }) => (
                <option key={turma.id_turma} value={turma.id_turma}>
                  {turma.nome_identificador} — {turma.ano_letivo}
                </option>
              ))}
            </select>
            {podeEditar && horario && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setEditando((atual) => !atual)}
                disabled={gerando || salvandoAula || carregando}
                aria-pressed={editando}
              >
                {editando ? 'Concluir edição' : 'Editar'}
              </button>
            )}
            {podeEditar && (
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-3"
                onClick={handleGerar}
                disabled={gerando || salvandoAula || carregando || editando}
              >
                {gerando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Em montagem
                  </>
                ) : (
                  <>
                    <i className="bi bi-shuffle me-1" aria-hidden="true" />
                    Gerar
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}

      {carregando ? (
        <div className="text-muted small" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Carregando horários...
        </div>
      ) : turmas.length === 0 ? (
        <p className="alert alert-light border mb-0">
          Não há turmas vinculadas ao seu perfil para consultar horários.
        </p>
      ) : !horario && gerando ? (
        <div className="text-muted small" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Em montagem — aguardando a validação da grade semanal.
        </div>
      ) : !horario ? (
        <p className="alert alert-light border mb-0">
          Ainda não há horário concluído para esta turma.
          {podeEditar && ' Selecione Gerar para montar a grade semanal.'}
        </p>
      ) : (
        <>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span className="fw-semibold">{turmaSelecionada.turma.nome_identificador}</span>
            <span className="badge text-bg-light">{horario.ano_letivo}</span>
            <span className={`badge ${gerando ? 'text-bg-warning' : 'text-bg-success'}`}>
              {gerando ? 'Em montagem' : 'Concluído'}
            </span>
            {salvandoAula && <span className="small text-muted">Salvando edição...</span>}
            {podeEditar && editando && (
              <span className="small text-muted">
                Arraste uma aula para outra posição; se ocupada, as aulas trocam de lugar.
              </span>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle text-center horario-semanal">
              <caption className="visually-hidden">Horário semanal da turma selecionada</caption>
              <thead className="table-light">
                <tr>
                  <th scope="col">Aula</th>
                  {DIAS.map(({ numero, nome }) => <th scope="col" key={numero}>{nome}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }, (_, index) => {
                  const periodo = index + 1;
                  return (
                    <tr key={periodo}>
                      <th scope="row">{periodo}ª</th>
                      {DIAS.map(({ numero: dia, nome }) => {
                        const aula = aulasPorPosicao.get(`${dia}-${periodo}`);
                        return (
                          <td
                            key={dia}
                            className={editando ? 'horario-celula-editavel' : ''}
                            draggable={Boolean(podeEditar && editando && aula && !salvandoAula)}
                            onDragStart={() => {
                              if (editando) setAulaArrastada(aula || null);
                            }}
                            onDragOver={(event) => {
                              if (editando) event.preventDefault();
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (editando && aulaArrastada) {
                                handleMoverAula(aulaArrastada, dia, periodo);
                              }
                            }}
                            onDragEnd={() => setAulaArrastada(null)}
                            aria-label={`${nome}, ${periodo}ª aula${aula ? `: ${aula.disciplina.nome}, professor ${aula.professor.name}` : ''}`}
                          >
                            {aula ? (
                              <div className="horario-aula-conteudo">
                                <span className="d-block fw-semibold">{aula.disciplina.nome}</span>
                                <span className="d-block small text-muted">{aula.professor.name}</span>
                              </div>
                            ) : <span className="text-muted">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default HorariosEscolares;
