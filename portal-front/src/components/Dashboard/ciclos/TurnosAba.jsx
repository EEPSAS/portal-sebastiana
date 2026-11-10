/**
 * TurnosAba.jsx - Aba de Configuração dos Turnos Operacionais da Escola (Módulo 5.4)
 *
 * Papel Didático:
 * Renderiza a grade de turnos de funcionamento da instituição escolar:
 * - Apresenta cards interativos de cada turno (`<TurnoCard />`);
 * - Permite ativação/desativação e edição dos horários, módulos de aula e intervalos.
 */

import TurnoCard from "./TurnoCard";

export default function TurnosAba({
  turnos,
  turmas,
  turnoEmEdicaoId,
  salvandoTurnoId,
  podeGerenciar,
  onToggleTurno,
  onAlterarCampoTurno,
  onAdicionarPausa,
  onAlterarPausa,
  onRemoverPausa,
  onIniciarEdicao,
  onCancelarEdicao,
  onSalvarTurno,
}) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="h6 fw-bold text-dark mb-0">
          Turnos Operacionais da Escola
        </h3>
        <p className="text-secondary small mb-0">
          Configure a jornada de início e término, a duração dos módulos de aula e os intervalos oficiais de recreio e almoço.
        </p>
      </div>

      <div className="row g-2.5">
        {turnos.map((turno) => {
          const estaEditando = turnoEmEdicaoId === turno.id;
          const isSalvando = salvandoTurnoId === turno.id;

          return (
            <TurnoCard
              key={turno.id}
              turno={turno}
              turmas={turmas}
              estaEditando={estaEditando}
              isSalvando={isSalvando}
              podeGerenciar={podeGerenciar}
              onToggleTurno={onToggleTurno}
              onAlterarCampoTurno={onAlterarCampoTurno}
              onAdicionarPausa={onAdicionarPausa}
              onAlterarPausa={onAlterarPausa}
              onRemoverPausa={onRemoverPausa}
              onIniciarEdicao={onIniciarEdicao}
              onCancelarEdicao={onCancelarEdicao}
              onSalvarTurno={onSalvarTurno}
            />
          );
        })}
      </div>
    </div>
  );
}
