/**
 * FiltroDisciplinas.jsx - Barra de filtros (Ciclo + Nome) para listas de disciplinas
 *
 * Papel Didático:
 * Componente "burro" (controlado): não guarda estado próprio, apenas exibe os valores
 * recebidos por props e avisa o pai quando o usuário muda o ciclo ou digita um termo.
 * Reaproveitado na aprovação de professores e no modal de vínculo de disciplinas.
 */

import { FILTRO_SEM_CICLO } from "../../../utils/formatters";

const FiltroDisciplinas = ({ ciclos, ciclo, termo, onCicloChange, onTermoChange, idPrefixo }) => (
  <div className="row g-2 mb-2">
    <div className="col-12 col-sm-5">
      <select
        id={`${idPrefixo}-filtro-ciclo`}
        className="form-select form-select-sm rounded-3"
        value={ciclo}
        onChange={(e) => onCicloChange(e.target.value)}
        aria-label="Filtrar disciplinas por ciclo"
      >
        <option value="">Todos os ciclos</option>
        {ciclos.map((c) => (
          <option key={c.id_ciclo} value={c.id_ciclo}>
            {c.nome}
          </option>
        ))}
        <option value={FILTRO_SEM_CICLO}>Sem ciclo</option>
      </select>
    </div>

    <div className="col-12 col-sm-7">
      <div className="input-group input-group-sm">
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search" aria-hidden="true"></i>
        </span>
        <input
          id={`${idPrefixo}-filtro-nome`}
          type="search"
          className="form-control border-start-0 ps-0 shadow-none"
          placeholder="Buscar disciplina pelo nome..."
          value={termo}
          onChange={(e) => onTermoChange(e.target.value)}
          aria-label="Buscar disciplina pelo nome"
        />
      </div>
    </div>
  </div>
);

export default FiltroDisciplinas;

