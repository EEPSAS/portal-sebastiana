/**
 * PlanoDetalheHeader.jsx - Cabeçalho e Contadores da Trilha de Aprendizagem (Módulo 3.4)
 *
 * Papel Didático:
 * Renderiza os metadados do Plano de Estudos e os 3 indicadores de contagem:
 * - Badges da disciplina associada, tema curricular e identificação de compartilhamento por professor;
 * - Cards estatísticos com contagem de Livros, Videoaulas e Conteúdos Web vinculados.
 */

import { formatarDisciplinaCiclo } from "../../../../utils/formatters";

export default function PlanoDetalheHeader({
  plano,
  totalLivros,
  totalVideos,
  totalWeb,
}) {
  return (
    <>
      {/* Badges de Identificação e Metadados */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill">
          {plano.disciplina_relacionada
            ? formatarDisciplinaCiclo(plano.disciplina_relacionada)
            : plano.disciplina}
        </span>
        {plano.conteudo && (
          <span className="badge bg-secondary-subtle text-secondary-emphasis border px-3 py-1 rounded-pill">
            🏷️ {plano.conteudo}
          </span>
        )}
        {plano.compartilhado_por_professor && (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-1 rounded-pill">
            🎓 Compartilhado por Prof. {plano.autor_nome || 'Docente'}
          </span>
        )}
      </div>

      {/* Resumo de Contadores */}
      <div className="row g-3 mb-5">
        <div className="col-12 col-md-4">
          <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
            <span className="fs-2">📘</span>
            <div>
              <h3 className="h6 fw-bold mb-0 text-dark">
                {totalLivros} Livro{totalLivros !== 1 ? 's' : ''}
              </h3>
              <small className="text-muted">Do acervo físico e digital</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
            <span className="fs-2">📺</span>
            <div>
              <h3 className="h6 fw-bold mb-0 text-dark">
                {totalVideos} Videoaula{totalVideos !== 1 ? 's' : ''}
              </h3>
              <small className="text-muted">Do YouTube educacional</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
            <span className="fs-2">📄</span>
            <div>
              <h3 className="h6 fw-bold mb-0 text-dark">
                {totalWeb} Conteúdo{totalWeb !== 1 ? 's' : ''} Web
              </h3>
              <small className="text-muted">Artigos e conteúdos didáticos da Web</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
