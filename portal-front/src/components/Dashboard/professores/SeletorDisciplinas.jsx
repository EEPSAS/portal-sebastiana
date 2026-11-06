/**
 * SeletorDisciplinas.jsx - Seleção múltipla de disciplinas com filtro por Ciclo e Nome
 *
 * Papel Didático:
 * Substitui a antiga nuvem de botões com TODAS as disciplinas na aprovação do professor.
 * O Especialista filtra por ciclo e/ou nome, marca as caixas desejadas e vê um resumo
 * das escolhas (que permanece visível mesmo quando o filtro esconde a disciplina marcada).
 * Os filtros são estado local: cada card de professor filtra de forma independente.
 */

import { useMemo, useState } from "react";
import {
  filtrarDisciplinas,
  formatarDisciplinaCiclo,
  listarCiclosDasDisciplinas,
} from "../../../utils/formatters";
import FiltroDisciplinas from "./FiltroDisciplinas";

const SeletorDisciplinas = ({ disciplinas, selecionadas, onToggle, idPrefixo }) => {
  // Estado dos filtros (por card): ciclo escolhido e termo digitado
  const [ciclo, setCiclo] = useState("");
  const [termo, setTermo] = useState("");

  // Opções de ciclo derivadas do catálogo (recalculadas só quando o catálogo muda)
  const ciclos = useMemo(() => listarCiclosDasDisciplinas(disciplinas), [disciplinas]);

  // Lista visível respeitando os filtros atuais
  const visiveis = useMemo(
    () => filtrarDisciplinas(disciplinas, { ciclo, termo }),
    [disciplinas, ciclo, termo]
  );

  // Disciplinas já marcadas (para o resumo em chips), independentes do filtro
  const marcadas = disciplinas.filter((d) => selecionadas.includes(d.id_disciplina));

  return (
    <div>
      <FiltroDisciplinas
        idPrefixo={idPrefixo}
        ciclos={ciclos}
        ciclo={ciclo}
        termo={termo}
        onCicloChange={setCiclo}
        onTermoChange={setTermo}
      />

      {/* Lista com caixas de seleção, rolável para não alongar o card */}
      <div
        className="border rounded-3 bg-white"
        style={{ maxHeight: "180px", overflowY: "auto" }}
        role="group"
        aria-label="Disciplinas disponíveis"
      >
        {visiveis.length === 0 ? (
          <p className="text-muted small text-center py-3 mb-0">
            Nenhuma disciplina encontrada com os filtros atuais.
          </p>
        ) : (
          visiveis.map((disc) => {
            const idCampo = `${idPrefixo}-disc-${disc.id_disciplina}`;
            const marcado = selecionadas.includes(disc.id_disciplina);

            return (
              <div
                key={disc.id_disciplina}
                className={`form-check px-3 py-2 m-0 border-bottom ${marcado ? "bg-primary-subtle" : ""}`}
              >
                <input
                  id={idCampo}
                  type="checkbox"
                  className="form-check-input ms-0 me-2"
                  checked={marcado}
                  onChange={() => onToggle(disc.id_disciplina)}
                />
                <label htmlFor={idCampo} className="form-check-label small w-75">
                  {formatarDisciplinaCiclo(disc)}
                </label>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo das disciplinas escolhidas, com remoção rápida */}
      {marcadas.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mt-2">
          {marcadas.map((disc) => (
            <span
              key={disc.id_disciplina}
              className="badge bg-primary rounded-pill d-inline-flex align-items-center gap-1 fw-semibold"
            >
              {formatarDisciplinaCiclo(disc)}
              <button
                type="button"
                className="btn-close btn-close-white ms-1"
                style={{ fontSize: "0.5rem" }}
                aria-label={`Remover ${formatarDisciplinaCiclo(disc)}`}
                onClick={() => onToggle(disc.id_disciplina)}
              ></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeletorDisciplinas;

