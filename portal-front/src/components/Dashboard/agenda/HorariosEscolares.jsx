/**
 * HorariosEscolares.jsx - Grade Semanal Interativa de Horários Escolares com @dnd-kit
 *
 * Papel Didático:
 * Atende às Diretrizes 3.4b e 3.4c (28/10/2026):
 * 1. Utiliza a biblioteca `@dnd-kit/core` e `@dnd-kit/utilities` (`DndContext`, `useDraggable`,
 *    `useDroppable`) para permitir o arrastar e soltar (drag and drop) das aulas na tabela semanal;
 * 2. Exibe as informações correlatas da matriz de Disciplinas e Ciclos (nome da disciplina,
 *    quantidade de aulas semanais previstas vs alocadas na grade, carga horária anual de 40 semanas
 *    e ciclo da turma).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../../hooks/useAuth';
import { gerarHorario, listarHorarios, moverAula } from '../../../services/horariosService';
import { formatarDisciplinaCiclo } from '../../../utils/formatters';
import './HorariosEscolares.css';

const DIAS = [
  { numero: 1, nome: 'Segunda-feira' },
  { numero: 2, nome: 'Terça-feira' },
  { numero: 3, nome: 'Quarta-feira' },
  { numero: 4, nome: 'Quinta-feira' },
  { numero: 5, nome: 'Sexta-feira' },
];

/**
 * Componente Draggable (@dnd-kit) para o card da aula dentro da célula do horário.
 */
const AulaDraggableCard = ({ aula, habilitado }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `aula-${aula.id}`,
    data: { aula },
    disabled: !habilitado,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const aulasSemanais = aula.disciplina?.aulas_semanais;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(habilitado ? listeners : {})}
      {...(habilitado ? attributes : {})}
      className={`horario-aula-conteudo rounded-3 p-1 ${
        habilitado ? 'horario-aula-draggable' : ''
      }`}
    >
      <span className="d-block fw-semibold text-dark">{formatarDisciplinaCiclo(aula.disciplina)}</span>
      <span className="d-block small text-muted">{aula.professor?.name}</span>
      {aulasSemanais && (
        <span
          className="badge bg-primary-subtle text-primary rounded-pill mt-1"
          style={{ fontSize: '0.68rem' }}
        >
          {aulasSemanais} aula(s)/sem
        </span>
      )}
    </div>
  );
};

/**
 * Célula Droppable (@dnd-kit) correspondente a (dia_semana, aula_numero).
 */
const CelulaHorarioDroppable = ({
  dia,
  nomeDia,
  periodo,
  aula,
  editando,
  podeEditar,
  salvandoAula,
  onNativeDragStart,
  onNativeDrop,
  onNativeDragEnd,
}) => {
  const droppableId = `slot-${dia}-${periodo}`;
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { dia, periodo },
    disabled: !editando || !podeEditar || salvandoAula,
  });

  const habilitadoDrag = Boolean(podeEditar && editando && aula && !salvandoAula);

  return (
    <td
      ref={setNodeRef}
      className={`${editando ? 'horario-celula-editavel' : ''} ${
        isOver ? 'horario-celula-over table-primary' : ''
      }`.trim()}
      draggable={habilitadoDrag}
      onDragStart={() => {
        if (editando) onNativeDragStart(aula || null);
      }}
      onDragOver={(event) => {
        if (editando) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (editando) onNativeDrop(dia, periodo);
      }}
      onDragEnd={onNativeDragEnd}
      aria-label={`${nomeDia}, ${periodo}ª aula${
        aula ? `: ${aula.disciplina?.nome}, professor ${aula.professor?.name}` : ''
      }`}
    >
      {aula ? (
        <AulaDraggableCard aula={aula} habilitado={habilitadoDrag} />
      ) : (
        <span className="text-muted">—</span>
      )}
    </td>
  );
};

const HorariosEscolares = ({ onRegistrarAcoes }) => {
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

  // Sensores do @dnd-kit para ponteiro (mouse/touch) e teclado
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

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
    ({ turma }) => String(turma.id_turma) === turmaSelecionadaId
  );
  const horario = turmaSelecionada?.horario;
  const aulasPorPosicao = new Map(
    (horario?.aulas || []).map((aula) => [`${aula.dia_semana}-${aula.aula_numero}`, aula])
  );

  // Resumo correlato de disciplinas da grade (Qtd de aulas alocadas vs previstas e carga anual)
  const resumoDisciplinasGrade = useMemo(() => {
    const mapa = new Map();
    (horario?.aulas || []).forEach((aula) => {
      const disc = aula.disciplina;
      if (!disc?.id_disciplina) return;
      const atual = mapa.get(disc.id_disciplina) || {
        id_disciplina: disc.id_disciplina,
        nome: disc.nome,
        aulas_semanais: disc.aulas_semanais || 0,
        carga_horaria_anual: disc.carga_horaria_anual || (disc.aulas_semanais || 0) * 40,
        alocadas: 0,
      };
      atual.alocadas += 1;
      mapa.set(disc.id_disciplina, atual);
    });
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [horario]);

  const atualizarHorarioSelecionado = (horarioAtualizado) => {
    setTurmas((atuais) =>
      atuais.map((item) =>
        String(item.turma.id_turma) === turmaSelecionadaId
          ? { ...item, horario: horarioAtualizado }
          : item
      )
    );
  };

  useEffect(() => {
    if (!onRegistrarAcoes) return;

    const acoes = turmas.length > 0 && (
      <div className="horarios-nav-acoes d-flex align-items-center gap-2">
        <label htmlFor="horario-turma" className="form-label small mb-0">
          Turma
        </label>
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
          disabled={carregando}
        >
          {turmas.map(({ turma }) => (
            <option key={turma.id_turma} value={turma.id_turma}>
              {turma.nome_identificador} — {turma.ano_letivo}
              {turma.ciclo_nome ? ` (${turma.ciclo_nome})` : ''}
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
            onClick={async () => {
              if (!turmaSelecionada) return;

              setErro('');
              setGerando(true);
              try {
                const resultado = await gerarHorario(turmaSelecionadaId);
                setTurmas((atuais) =>
                  atuais.map((item) =>
                    String(item.turma.id_turma) === turmaSelecionadaId
                      ? { ...item, horario: resultado }
                      : item
                  )
                );
              } catch (error) {
                setErro(error.message);
              } finally {
                setGerando(false);
              }
            }}
            disabled={gerando || salvandoAula || carregando || editando || !turmaSelecionada}
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
    );

    onRegistrarAcoes(acoes || null);
  }, [
    onRegistrarAcoes,
    turmas,
    turmaSelecionadaId,
    carregando,
    podeEditar,
    horario,
    turmaSelecionada,
    gerando,
    salvandoAula,
    editando,
  ]);

  useEffect(
    () => () => {
      onRegistrarAcoes?.(null);
    },
    [onRegistrarAcoes]
  );

  const handleMoverAula = async (aula, dia, periodo) => {
    if (!horario || !aula || salvandoAula) return;
    if (Number(aula.dia_semana) === Number(dia) && Number(aula.aula_numero) === Number(periodo)) {
      return;
    }

    setErro('');
    setSalvandoAula(true);
    try {
      const resultado = await moverAula(horario.id, aula.id, {
        destino_dia_semana: Number(dia),
        destino_aula_numero: Number(periodo),
      });
      atualizarHorarioSelecionado(resultado);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoAula(false);
      setAulaArrastada(null);
    }
  };

  // Handler oficial do @dnd-kit ao soltar uma aula sobre outra célula da grade
  const handleDndKitDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;

    const aulaOrigem = active.data?.current?.aula;
    const destino = over.data?.current;
    if (aulaOrigem && destino?.dia && destino?.periodo) {
      handleMoverAula(aulaOrigem, destino.dia, destino.periodo);
    }
  };

  return (
    <section className="horarios-escolares mt-2" aria-labelledby="horarios-escolares-titulo">
      <div className="mb-3">
        <div>
          <h3 id="horarios-escolares-titulo" className="h5 fw-bold mb-1">
            Horários das Turmas
          </h3>
          <p className="text-muted small mb-0">
            Grade semanal integrada às Disciplinas do Ciclo e carga horária semanal (arraste e solte com dnd-kit).
          </p>
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger py-2" role="alert">
          {erro}
        </div>
      )}

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
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="fw-semibold">{turmaSelecionada.turma.nome_identificador}</span>
            {turmaSelecionada.turma.ciclo_nome && (
              <span className="badge bg-primary-subtle text-primary rounded-pill">
                Ciclo: {turmaSelecionada.turma.ciclo_nome}
              </span>
            )}
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

          {/* Resumo Correlato de Disciplinas e Carga Semanal (Diretriz 3.4c) */}
          {resumoDisciplinasGrade.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3 p-2 rounded-3 bg-light border">
              {resumoDisciplinasGrade.map((disc) => (
                <span
                  key={disc.id_disciplina}
                  className="badge bg-white text-dark border rounded-pill px-3 py-1 fw-normal"
                >
                  <strong className="text-primary">{formatarDisciplinaCiclo(disc)}:</strong> {disc.alocadas} aula(s)/sem
                  {disc.carga_horaria_anual ? ` (${disc.carga_horaria_anual}h/ano)` : ''}
                </span>
              ))}
            </div>
          )}

          {/* Grade Semanal envolvida com DndContext (@dnd-kit/core) */}
          <DndContext sensors={sensors} onDragEnd={handleDndKitDragEnd}>
            <div
              className="dashboard-table-scroll border"
              tabIndex={0}
              role="region"
              aria-labelledby="horarios-escolares-titulo"
            >
              <table className="table table-bordered align-middle text-center horario-semanal mb-0">
                <caption className="visually-hidden">Horário semanal da turma selecionada</caption>
                <thead className="table-light">
                  <tr>
                    <th scope="col">Aula</th>
                    {DIAS.map(({ numero, nome }) => (
                      <th scope="col" key={numero}>
                        {nome}
                      </th>
                    ))}
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
                            <CelulaHorarioDroppable
                              key={dia}
                              dia={dia}
                              nomeDia={nome}
                              periodo={periodo}
                              aula={aula}
                              editando={editando}
                              podeEditar={podeEditar}
                              salvandoAula={salvandoAula}
                              onNativeDragStart={(aulaItem) => setAulaArrastada(aulaItem)}
                              onNativeDrop={(destDia, destPeriodo) => {
                                if (aulaArrastada) {
                                  handleMoverAula(aulaArrastada, destDia, destPeriodo);
                                }
                              }}
                              onNativeDragEnd={() => setAulaArrastada(null)}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DndContext>
        </>
      )}
    </section>
  );
};

export default HorariosEscolares;
