/**
 * DisciplinasGrid.jsx - Grid de Catálogo de Disciplinas (Módulo 5.5)
 *
 * Papel Didático:
 * Renderiza o conjunto de disciplinas cadastradas tratando os 3 estados visuais obrigatórios:
 * 1. Carregando (spinner com legenda);
 * 2. Vazio (com CTA para cadastrar primeira disciplina caso Especialista/Adm);
 * 3. Sucesso (grid responsivo com cards de disciplinas).
 */

import DisciplinaCard from "./DisciplinaCard";

export default function DisciplinasGrid({
  disciplinasFiltradas,
  loading,
  busca,
  filtroCiclo,
  podeGerenciar,
  excluindoId,
  onAbrirNovaDisciplina,
  onVerDetalhes,
  onEditar,
  onExcluir,
}) {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted small mt-2">Carregando catálogo de disciplinas...</p>
      </div>
    );
  }

  if (disciplinasFiltradas.length === 0) {
    return (
      <div className="text-center py-5 border rounded-4 bg-light">
        <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
        <h3 className="h5 fw-bold text-dark">Nenhuma disciplina encontrada</h3>
        <p className="text-muted small mb-3">
          {busca || filtroCiclo
            ? "Tente ajustar ou limpar os filtros para localizar as disciplinas."
            : "Cadastre as disciplinas da matriz curricular da escola."}
        </p>
        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 fw-semibold"
            onClick={onAbrirNovaDisciplina}
          >
            <i className="bi bi-plus-lg me-1"></i> Cadastrar Primeira Disciplina
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="row g-2">
      {disciplinasFiltradas.map((disc) => (
        <DisciplinaCard
          key={disc.id_disciplina}
          disc={disc}
          podeGerenciar={podeGerenciar}
          excluindoId={excluindoId}
          onVerDetalhes={onVerDetalhes}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
      ))}
    </div>
  );
}
