/**
 * HorariosEscolares.jsx - Grade Semanal Interativa de Horários Escolares com @dnd-kit
 *
 * Papel Didático:
 * Atende às Diretrizes 3.4b e 3.4c (28/10/2026) e à Revisão Operacional Multi-Turmas:
 * 1. Utiliza a biblioteca `@dnd-kit/core` e `@dnd-kit/utilities` (`DndContext`, `useDraggable`,
 *    `useDroppable`) para permitir o arrastar e soltar (drag and drop) das aulas na tabela semanal;
 * 2. Integra-se aos Turnos de Funcionamento reais (Matutino, Vespertino, Noturno, Integral)
 *    calculando dinamicamente os horários dos períodos e a linha separadora de intervalo/recreio;
 * 3. Suporta geração simultânea multi-turmas sem conflito docente (Por Turma, Por Turno e Global).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  gerarHorario,
  gerarHorariosTurno,
  gerarHorariosTodas,
  listarHorarios,
  moverAula,
} from '../../../services/horariosService';
import { listarTurnos } from '../../../services/turnosService';
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
 * Apresenta formato compacto com tipografia e espaçamento otimizados.
 */
const AulaDraggableCard = ({ aula, habilitado, cicloNome }) => {
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
      className={`horario-aula-conteudo rounded-2 p-1 ${
        habilitado ? 'horario-aula-draggable' : ''
      }`}
    >
      <span
        className="d-block fw-semibold text-dark text-truncate"
        style={{ fontSize: '0.8rem', lineHeight: '1.2' }}
        title={formatarDisciplinaCiclo(aula.disciplina, cicloNome)}
      >
        {formatarDisciplinaCiclo(aula.disciplina, cicloNome)}
      </span>
      <span
        className="d-block text-muted text-truncate"
        style={{ fontSize: '0.72rem', lineHeight: '1.2' }}
        title={aula.professor?.name}
      >
        {aula.professor?.name}
      </span>
      {aulasSemanais && (
        <span
          className="badge bg-primary-subtle text-primary rounded-pill mt-0.5 px-1.5 py-0.5"
          style={{ fontSize: '0.64rem' }}
        >
          {aulasSemanais} a/sem
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
  cicloNome,
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
        <AulaDraggableCard aula={aula} habilitado={habilitadoDrag} cicloNome={cicloNome} />
      ) : (
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
      )}
    </td>
  );
};

const HorariosEscolares = ({ onRegistrarAcoes }) => {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const podeEditar = ['especialista', 'adm'].includes(role);

  const [turmas, setTurmas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [mensagemGerando, setMensagemGerando] = useState('');
  const [editando, setEditando] = useState(false);
  const [salvandoAula, setSalvandoAula] = useState(false);
  const [aulaArrastada, setAulaArrastada] = useState(null);
  const [erro, setErro] = useState('');
  const [errosDetalhados, setErrosDetalhados] = useState([]);
  const [caixaErrosAberta, setCaixaErrosAberta] = useState(false);
  const [dropdownGerarAberto, setDropdownGerarAberto] = useState(false);
  const dropdownRef = useRef(null);
  const botaoDropdownRef = useRef(null);

  // Fecha o dropdown de geração de horários ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!dropdownGerarAberto) return;

    const handleClickFora = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !botaoDropdownRef.current?.contains(event.target)
      ) {
        setDropdownGerarAberto(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownGerarAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownGerarAberto]);

  // Sensores do @dnd-kit para ponteiro (mouse/touch) e teclado
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // Carregamento inicial integrado de horários e turnos operacionais
  useEffect(() => {
    let ativo = true;

    const carregarTudo = async () => {
      try {
        const [resultadoHorarios, resultadoTurnos] = await Promise.all([
          listarHorarios(),
          listarTurnos().catch(() => []),
        ]);
        if (ativo) {
          setTurmas(resultadoHorarios);
          if (resultadoHorarios.length > 0) {
            setTurmaSelecionadaId(String(resultadoHorarios[0]?.turma?.id_turma || ''));
          }
          if (Array.isArray(resultadoTurnos)) {
            setTurnos(resultadoTurnos);
          }
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

    carregarTudo();
    return () => {
      ativo = false;
    };
  }, []);

  const turmaSelecionada = turmas.find(
    ({ turma }) => String(turma.id_turma) === turmaSelecionadaId
  );
  const horario = turmaSelecionada?.horario;
  const cicloNomeTurma = turmaSelecionada?.turma?.ciclo_nome;
  const turnoTurmaNome = turmaSelecionada?.turma?.turno;

  // Localiza a configuração do turno da turma selecionada
  const turnoConfig = turnos.find(
    (t) => String(t.id).toLowerCase() === String(turnoTurmaNome).toLowerCase()
  );

  // Grade de horários com períodos e intervalo obtidos do turno correspondente
  const gradeHorarios = useMemo(() => {
    if (
      turnoConfig?.grade_horarios &&
      Array.isArray(turnoConfig.grade_horarios) &&
      turnoConfig.grade_horarios.length > 0
    ) {
      return turnoConfig.grade_horarios;
    }
    // Fallback padrão sequencial de 5 períodos de 50 minutos caso o turno não venha configurado
    return [
      { periodo: 1, hora_inicio: '07:00', hora_fim: '07:50', is_intervalo: false },
      { periodo: 2, hora_inicio: '07:50', hora_fim: '08:40', is_intervalo: false },
      { periodo: 3, hora_inicio: '08:40', hora_fim: '09:30', is_intervalo: false },
      { periodo: null, hora_inicio: '09:30', hora_fim: '09:56', is_intervalo: true },
      { periodo: 4, hora_inicio: '09:56', hora_fim: '10:46', is_intervalo: false },
      { periodo: 5, hora_inicio: '10:46', hora_fim: '11:36', is_intervalo: false },
    ];
  }, [turnoConfig]);

  const aulasPorPosicao = useMemo(
    () =>
      new Map(
        (horario?.aulas || []).map((aula) => [`${aula.dia_semana}-${aula.aula_numero}`, aula])
      ),
    [horario]
  );

  const atualizarHorarioSelecionado = (horarioAtualizado) => {
    setTurmas((atuais) =>
      atuais.map((item) =>
        String(item.turma.id_turma) === turmaSelecionadaId
          ? { ...item, horario: horarioAtualizado }
          : item
      )
    );
  };

  /**
   * Imprime a grade semanal oficial em formato A4 Paisagem (Landscape)
   * através de um iframe isolado com regras de impressão e cabeçalho institucional.
   */
  const handleImprimirHorario = useCallback(() => {
    if (!turmaSelecionada || !horario) return;

    const iframeAntigo = document.getElementById('iframe-impressao-horario-oficial');
    if (iframeAntigo) {
      iframeAntigo.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'iframe-impressao-horario-oficial';
    iframe.setAttribute('title', 'Impressão de Grade Horária Escolar Oficial');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const nomeTurma = turmaSelecionada.turma?.nome_identificador || 'Turma Escolar';
    const cicloNome = turmaSelecionada.turma?.ciclo_nome || 'Ensino Médio';
    const turnoNome = turmaSelecionada.turma?.turno || 'Turno Integral';
    const anoLetivo = turmaSelecionada.turma?.ano_letivo || new Date().getFullYear();
    const dataHoraEmissao = new Date().toLocaleString('pt-BR');

    // Constrói as linhas da tabela semanal com suporte a aulas e intervalos/almoço
    const linhasTabelaHtml = gradeHorarios
      .map((item) => {
        if (item.is_intervalo) {
          const ehAlmoco = item.tipo === 'almoco';
          const iconeTexto = ehAlmoco ? '🍽️' : '☕';
          const rotulo = item.rotulo || (ehAlmoco ? 'Almoço' : 'Intervalo / Recreio');
          return `
            <tr class="linha-pausa ${ehAlmoco ? 'pausa-almoco' : 'pausa-intervalo'}">
              <td colspan="6" class="celula-pausa">
                ${iconeTexto} ${item.hora_inicio} - ${item.hora_fim} • ${rotulo}
              </td>
            </tr>
          `;
        }

        const periodo = item.periodo ?? item.aula_numero;
        const celulasDiasHtml = DIAS.map(({ numero: dia }) => {
          const aula = aulasPorPosicao.get(`${dia}-${periodo}`);
          if (!aula) {
            return '<td class="celula-aula celula-vazia">—</td>';
          }
          const discNome = formatarDisciplinaCiclo(aula.disciplina, cicloNome);
          const profNome = aula.professor?.name || 'Professor a definir';
          const aulasSem = aula.disciplina?.aulas_semanais
            ? `${aula.disciplina.aulas_semanais} a/sem`
            : '';
          return `
            <td class="celula-aula">
              <div class="disc-nome">${discNome}</div>
              <div class="prof-nome">${profNome}</div>
              ${aulasSem ? `<div class="aulas-badge">${aulasSem}</div>` : ''}
            </td>
          `;
        }).join('');

        return `
          <tr>
            <th scope="row" class="celula-periodo">
              <div class="num-aula">${periodo}ª aula</div>
              <div class="horario-faixa">${item.hora_inicio} - ${item.hora_fim}</div>
            </th>
            ${celulasDiasHtml}
          </tr>
        `;
      })
      .join('');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Horário Escolar - ${nomeTurma}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      line-height: 1.25;
    }
    .print-header {
      text-align: center;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .print-header h1 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 2px 0;
      color: #0f172a;
      letter-spacing: 0.3px;
    }
    .print-header h2 {
      font-size: 9.5pt;
      font-weight: 600;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      color: #2563eb;
    }
    .print-metadados {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-size: 8.5pt;
      font-weight: 500;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px 8px;
    }
    .print-metadados strong {
      color: #0f172a;
    }
    table.print-tabela {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #0f172a;
      table-layout: fixed;
    }
    table.print-tabela thead th {
      background-color: #f1f5f9;
      border: 1px solid #0f172a;
      padding: 6px 4px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      text-align: center;
      color: #0f172a;
    }
    table.print-tabela thead th:first-child {
      width: 85px;
    }
    .celula-periodo {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 4px;
      text-align: center;
      vertical-align: middle;
      width: 85px;
    }
    .num-aula {
      font-weight: 700;
      font-size: 8.5pt;
      color: #0f172a;
    }
    .horario-faixa {
      font-size: 7pt;
      color: #64748b;
    }
    .celula-aula {
      border: 1px solid #cbd5e1;
      padding: 4px 5px;
      text-align: center;
      vertical-align: middle;
      height: 46px;
    }
    .celula-vazia {
      color: #94a3b8;
      font-size: 9pt;
    }
    .disc-nome {
      font-weight: 700;
      font-size: 7.8pt;
      color: #0f172a;
      line-height: 1.15;
      margin-bottom: 2px;
    }
    .prof-nome {
      font-size: 7.2pt;
      color: #475569;
      line-height: 1.1;
    }
    .aulas-badge {
      display: inline-block;
      margin-top: 2px;
      font-size: 6.5pt;
      font-weight: 600;
      color: #1e40af;
      background: #dbeafe;
      border-radius: 9999px;
      padding: 1px 5px;
    }
    .linha-pausa {
      border: 1px solid #0f172a;
    }
    .pausa-intervalo {
      background-color: #f8fafc;
    }
    .pausa-almoco {
      background-color: #fef3c7;
    }
    .celula-pausa {
      border: 1px solid #cbd5e1;
      text-align: center;
      padding: 3px 6px;
      font-weight: 700;
      font-size: 7.8pt;
      color: #334155;
      letter-spacing: 0.3px;
    }
    .pausa-almoco .celula-pausa {
      color: #92400e;
    }
    .print-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #cbd5e1;
      font-size: 7pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>Escola Estadual Professora Sebastiana de Almeida e Silva</h1>
    <h2>Grade Curricular Semanal de Horários</h2>
    <div class="print-metadados">
      <span><strong>Turma:</strong> ${nomeTurma}</span>
      <span><strong>Ciclo:</strong> ${cicloNome}</span>
      <span><strong>Turno:</strong> ${turnoNome}</span>
      <span><strong>Ano Letivo:</strong> ${anoLetivo}</span>
      <span><strong>Status:</strong> Concluído</span>
    </div>
  </div>

  <table class="print-tabela">
    <thead>
      <tr>
        <th scope="col">Aula</th>
        <th>Segunda-feira</th>
        <th>Terça-feira</th>
        <th>Quarta-feira</th>
        <th>Quinta-feira</th>
        <th>Sexta-feira</th>
      </tr>
    </thead>
    <tbody>
      ${linhasTabelaHtml}
    </tbody>
  </table>

  <div class="print-footer">
    <span>Emitido em: ${dataHoraEmissao} • Documento Oficial de Consulta da Instituição</span>
    <span>Portal Escolar Sebastiana • EEPSAS</span>
  </div>
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }, [turmaSelecionada, horario, gradeHorarios, aulasPorPosicao]);

  // Handler de Geração: Turma individual, Por Turno (multi-turmas) ou Global (todas)
  const handleGerar = useCallback(async (modo = 'turma') => {
    if (!turmaSelecionada) return;

    setErro('');
    setErrosDetalhados([]);
    setCaixaErrosAberta(false);
    setDropdownGerarAberto(false);
    setGerando(true);

    const anoLetivo = Number(turmaSelecionada.turma.ano_letivo) || new Date().getFullYear();
    const turnoAlvo = turmaSelecionada.turma.turno || 'Matutino';

    try {
      if (modo === 'todas') {
        setMensagemGerando('Otimizando todas as turmas da instituição...');
        const resultadoTodas = await gerarHorariosTodas(anoLetivo);
        if (Array.isArray(resultadoTodas) && resultadoTodas.length > 0) {
          setTurmas(resultadoTodas);
        } else {
          const atualizados = await listarHorarios();
          setTurmas(atualizados);
        }
      } else if (modo === 'turno') {
        setMensagemGerando(`Otimizando turmas do turno ${turnoAlvo}...`);
        const resultadoTurno = await gerarHorariosTurno(turnoAlvo, anoLetivo);
        if (Array.isArray(resultadoTurno) && resultadoTurno.length > 0) {
          setTurmas(resultadoTurno);
        } else {
          const atualizados = await listarHorarios();
          setTurmas(atualizados);
        }
      } else {
        setMensagemGerando(`Montando grade de ${turmaSelecionada.turma.nome_identificador}...`);
        const resultadoTurma = await gerarHorario(turmaSelecionadaId);
        setTurmas((atuais) =>
          atuais.map((item) =>
            String(item.turma.id_turma) === turmaSelecionadaId
              ? { ...item, horario: resultadoTurma }
              : item
          )
        );
      }
    } catch (error) {
      setErro(error.message);
      if (Array.isArray(error.errorList) && error.errorList.length > 0) {
        setErrosDetalhados(error.errorList);
        setCaixaErrosAberta(true);
      } else {
        setErrosDetalhados([]);
      }
    } finally {
      setGerando(false);
      setMensagemGerando('');
    }
  }, [turmaSelecionada, turmaSelecionadaId]);

  // Registro das ações na barra superior do PainelModulo
  useEffect(() => {
    if (!onRegistrarAcoes) return;

    const acoes = turmas.length > 0 && (
      <div className="horarios-nav-acoes d-flex align-items-center gap-2">
        <label htmlFor="horario-turma" className="form-label small mb-0 fw-semibold text-secondary">
          Turma
        </label>
        <select
          id="horario-turma"
          className="form-select form-select-sm horario-turma-seletor"
          value={turmaSelecionadaId}
          onChange={(event) => {
            setTurmaSelecionadaId(event.target.value);
            setErro('');
            setErrosDetalhados([]);
            setCaixaErrosAberta(false);
            setAulaArrastada(null);
            setEditando(false);
            setDropdownGerarAberto(false);
          }}
          disabled={carregando || gerando}
        >
          {turmas.map(({ turma }) => (
            <option key={turma.id_turma} value={turma.id_turma}>
              {turma.nome_identificador} — {turma.ano_letivo}
              {turma.turno ? ` • ${turma.turno}` : ''}
              {turma.ciclo_nome ? ` (${turma.ciclo_nome})` : ''}
            </option>
          ))}
        </select>

        {horario && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1.5 text-nowrap"
            onClick={handleImprimirHorario}
            disabled={carregando || gerando}
            title="Imprimir grade horária oficial da turma em PDF"
          >
            <i className="bi bi-printer me-1" aria-hidden="true" />
            <span>Imprimir</span>
          </button>
        )}

        {podeEditar && horario && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold text-nowrap"
            onClick={() => setEditando((atual) => !atual)}
            disabled={gerando || salvandoAula || carregando}
            aria-pressed={editando}
          >
            {editando ? 'Concluir edição' : 'Editar'}
          </button>
        )}

        {/* Grupo de Ações de Geração Multi-Turmas com Dropdown */}
        {podeEditar && (
          <div className="btn-group btn-group-sm position-relative text-nowrap flex-nowrap" role="group">
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-start-pill px-3 fw-semibold text-nowrap d-inline-flex align-items-center"
              onClick={() => handleGerar('turma')}
              disabled={gerando || salvandoAula || carregando || editando || !turmaSelecionada}
              title="Gerar grade da turma selecionada"
            >
              {gerando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1.5" aria-hidden="true" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-shuffle me-1.5" aria-hidden="true" />
                  <span>Gerar</span>
                </>
              )}
            </button>
            <button
              ref={botaoDropdownRef}
              type="button"
              className="btn btn-sm btn-primary dropdown-toggle dropdown-toggle-split rounded-end-pill px-2 d-inline-flex align-items-center justify-content-center"
              onClick={() => setDropdownGerarAberto((aberto) => !aberto)}
              aria-expanded={dropdownGerarAberto}
              disabled={gerando || salvandoAula || carregando || editando}
              title="Mais opções de geração de horários"
            >
              <span className="visually-hidden">Abrir opções de geração</span>
            </button>

            {dropdownGerarAberto && (
              <ul
                ref={dropdownRef}
                className="dropdown-menu dropdown-menu-end shadow-sm show mt-1"
                style={{ minWidth: '245px', right: 0, left: 'auto', zIndex: 1050 }}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 small py-2"
                    onClick={() => handleGerar('turma')}
                  >
                    <i className="bi bi-person-workspace text-primary fs-6"></i>
                    <div>
                      <div className="fw-semibold">Gerar Esta Turma</div>
                      <small className="text-muted">Apenas {turmaSelecionada?.turma?.nome_identificador}</small>
                    </div>
                  </button>
                </li>
                {turnoTurmaNome && (
                  <li>
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2 small py-2"
                      onClick={() => handleGerar('turno')}
                    >
                      <i className="bi bi-sun text-warning fs-6"></i>
                      <div>
                        <div className="fw-semibold">Gerar Turno ({turnoTurmaNome})</div>
                        <small className="text-muted">Todas do turno sem conflito docente</small>
                      </div>
                    </button>
                  </li>
                )}
                <li>
                  <hr className="dropdown-divider my-1" />
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center gap-2 small py-2 text-primary"
                    onClick={() => handleGerar('todas')}
                  >
                    <i className="bi bi-grid-3x3-gap-fill fs-6"></i>
                    <div>
                      <div className="fw-semibold">Gerar Todas as Turmas</div>
                      <small className="text-muted">Grade global simultânea da escola</small>
                    </div>
                  </button>
                </li>
              </ul>
            )}
          </div>
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
    dropdownGerarAberto,
    turnoTurmaNome,
    handleGerar,
    handleImprimirHorario,
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
    <section className="horarios-escolares" aria-label="Grade Semanal de Horários Escolares">
      {erro && (
        <div className="alert alert-danger py-2 mb-3 shadow-sm" role="alert">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5 text-danger" aria-hidden="true"></i>
              <span className="fw-medium">{erro}</span>
            </div>
            {errosDetalhados.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5 d-inline-flex align-items-center gap-1 fw-semibold"
                onClick={() => setCaixaErrosAberta((aberta) => !aberta)}
                aria-expanded={caixaErrosAberta}
                aria-controls="horario-erros-detalhes"
                style={{ fontSize: '0.8rem' }}
              >
                <i className={`bi ${caixaErrosAberta ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                <span>
                  {caixaErrosAberta
                    ? 'Ocultar detalhes'
                    : `Ver todos os erros (${errosDetalhados.length})`}
                </span>
              </button>
            )}
          </div>

          {errosDetalhados.length > 0 && caixaErrosAberta && (
            <div
              id="horario-erros-detalhes"
              className="mt-2.5 pt-2 border-top border-danger-subtle bg-white rounded-3 p-2.5 text-dark"
              style={{ maxHeight: '220px', overflowY: 'auto' }}
            >
              <div className="small fw-bold text-danger mb-1.5 d-flex align-items-center gap-1">
                <i className="bi bi-list-check"></i>
                <span>Lista completa de pendências e inconsistências da turma:</span>
              </div>
              <ul className="mb-0 ps-3 small text-secondary">
                {errosDetalhados.map((itemErro, idx) => (
                  <li key={idx} className="mb-1 text-dark">
                    {itemErro}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {carregando ? (
        <div className="text-muted small py-3" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          Carregando horários e turnos operacionais...
        </div>
      ) : turmas.length === 0 ? (
        <p className="alert alert-light border mb-0">
          Não há turmas vinculadas ao seu perfil para consultar horários.
        </p>
      ) : !horario && gerando ? (
        <div className="text-muted small py-3" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          {mensagemGerando || 'Em montagem — calculando combinações sem conflito de professores...'}
        </div>
      ) : !horario ? (
        <p className="alert alert-light border mb-0">
          Ainda não há horário concluído para esta turma.
          {podeEditar && ' Selecione Gerar para montar a grade semanal.'}
        </p>
      ) : (
        <>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span className="fw-semibold text-dark">{turmaSelecionada.turma.nome_identificador}</span>
            {turmaSelecionada.turma.ciclo_nome && (
              <span className="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1">
                Ciclo: {turmaSelecionada.turma.ciclo_nome}
              </span>
            )}
            {turmaSelecionada.turma.turno && (
              <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2.5 py-1">
                Turno: {turmaSelecionada.turma.turno}
              </span>
            )}
            <span className="badge text-bg-light border">{horario.ano_letivo}</span>
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

          {/* Grade Semanal Compacta com suporte a Módulos e Intervalo (@dnd-kit) */}
          <DndContext sensors={sensors} onDragEnd={handleDndKitDragEnd}>
            <div
              className="dashboard-table-scroll border rounded-3 overflow-hidden shadow-sm"
              tabIndex={0}
              role="region"
              aria-label="Grade semanal de horários da turma"
            >
              <table className="table table-bordered align-middle text-center horario-semanal mb-0">
                <caption className="visually-hidden">Horário semanal da turma selecionada</caption>
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '95px' }}>
                      Aula
                    </th>
                    {DIAS.map(({ numero, nome }) => (
                      <th scope="col" key={numero}>
                        {nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradeHorarios.map((item, index) => {
                    if (item.is_intervalo) {
                      const ehAlmoco = item.tipo === 'almoco';
                      return (
                        <tr
                          key={`intervalo-${index}`}
                          className={ehAlmoco ? 'table-warning border-top border-bottom' : 'table-light'}
                        >
                          <td
                            colSpan={6}
                            className={`text-center ${
                              ehAlmoco
                                ? 'py-1.5 bg-warning-subtle text-warning-emphasis fw-bold'
                                : 'py-1 bg-light-subtle text-muted fw-semibold'
                            } small border-top border-bottom`}
                            style={{ fontSize: ehAlmoco ? '0.82rem' : '0.78rem', letterSpacing: '0.2px' }}
                          >
                            <i
                              className={`bi ${ehAlmoco ? 'bi-egg-fried text-warning-emphasis' : 'bi-cup-hot-fill text-warning'} me-1.5`}
                              aria-hidden="true"
                            ></i>
                            {item.hora_inicio} - {item.hora_fim} • {item.rotulo || (ehAlmoco ? 'Almoço' : 'Intervalo / Recreio')}
                          </td>
                        </tr>
                      );
                    }

                    const periodo = item.periodo ?? item.aula_numero;
                    return (
                      <tr key={`aula-${periodo}`}>
                        <th
                          scope="row"
                          className="align-middle py-1 px-2 text-nowrap bg-light-subtle"
                          style={{ width: '95px' }}
                        >
                          <div className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
                            {periodo}ª aula
                          </div>
                          <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>
                            {item.hora_inicio} - {item.hora_fim}
                          </small>
                        </th>
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
                              cicloNome={cicloNomeTurma}
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
