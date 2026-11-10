/**
 * CiclosAba.jsx - Aba Principal de Ciclos Curriculares e Matriz (Módulo 5.4)
 *
 * Papel Didático:
 * Apresenta a visualização de Disciplinas agrupadas por Ciclo Escolar:
 * 1. Alerta de disciplinas do catálogo que ainda não foram vinculadas a nenhum ciclo;
 * 2. Estado vazio com CTA para criar o primeiro ciclo;
 * 3. Renderização da lista de cards de ciclos (`<CicloCard />`) com controle de expansão e cores semânticas.
 */

import CicloCard from "./CicloCard";

// Paleta de cores semânticas para identificação e distinção visual dos ciclos
const CORES_CICLOS = [
  { primária: "#10b981", bgHeader: "#f0fdf4", border: "#86efac", badgeBg: "#dcfce7", badgeText: "#166534" }, // 1º (Esmeralda)
  { primária: "#2563eb", bgHeader: "#eff6ff", border: "#93c5fd", badgeBg: "#dbeafe", badgeText: "#1e40af" }, // 2º (Azul Real)
  { primária: "#d97706", bgHeader: "#fffbeb", border: "#fde68a", badgeBg: "#fef3c7", badgeText: "#92400e" }, // 3º (Âmbar)
  { primária: "#7c3aed", bgHeader: "#f5f3ff", border: "#c4b5fd", badgeBg: "#ede9fe", badgeText: "#5b21b6" }, // 4º (Violeta)
  { primária: "#db2777", bgHeader: "#fdf2f8", border: "#f9a8d4", badgeBg: "#fce7f3", badgeText: "#9d174d" }, // 5º (Rosa)
  { primária: "#0891b2", bgHeader: "#ecfeff", border: "#67e8f9", badgeBg: "#cffafe", badgeText: "#155e75" }, // 6º (Ciano)
];

export default function CiclosAba({
  ciclos,
  turmas,
  todasDisciplinas,
  disciplinasSemCiclo,
  ciclosAbertos,
  podeGerenciar,
  excluindoCicloId,
  disciplinaSelecionadaParaVincular,
  vinculandoPorCicloId,
  desvinculandoChave,
  onToggleColapsarCiclo,
  onAbrirCriarCiclo,
  onAbrirEditarCiclo,
  onExcluirCiclo,
  onAbrirAdicionarDisciplinaAoCiclo,
  onSelecionarDisciplinaParaVincular,
  onVincularDisciplinaExistente,
  onAbrirEditarDisciplina,
  onDesvincularDisciplina,
  onVerDetalhesDisciplina,
}) {
  return (
    <div className="d-flex flex-column gap-2.5">
      {/* Disciplinas Não Vinculadas (se houver) */}
      {disciplinasSemCiclo.length > 0 && (
        <div className="p-3 rounded-4 border border-warning bg-warning-subtle bg-opacity-25 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-warning-subtle">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
              <h3 className="h6 fw-bold text-dark mb-0">
                Disciplinas Não Vinculadas a Nenhum Ciclo
              </h3>
            </div>
            <span className="badge bg-warning text-dark rounded-pill">
              {disciplinasSemCiclo.length} disciplina(s)
            </span>
          </div>
          <p className="text-muted small mb-3">
            Estas matérias constam no catálogo escolar mas ainda não foram associadas a nenhum ciclo curricular:
          </p>
          <div className="row g-2">
            {disciplinasSemCiclo.map((disc) => (
              <div className="col-12 col-md-6 col-xl-4" key={disc.id_disciplina}>
                <div className="card h-100 border rounded-3 p-2 bg-white shadow-none d-flex flex-column justify-content-between">
                  <div>
                    <strong className="d-block text-dark small">{disc.nome}</strong>
                    <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                      {disc.aulas_semanais || 4} aulas/sem • {disc.carga_horaria_anual || 160} aulas/ano
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-top d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill py-0 px-2"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => onAbrirEditarDisciplina(disc)}
                    >
                      <i className="bi bi-pencil me-1"></i> Vincular a Ciclos
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista dos Ciclos com suas Disciplinas */}
      {ciclos.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 border p-4">
          <i className="bi bi-layers fs-1 text-muted d-block mb-2"></i>
          <h4 className="h6 fw-bold text-dark">Nenhum ciclo curricular cadastrado</h4>
          <p className="text-muted small mb-3">
            Cadastre o primeiro ciclo (ex: 1º Ano Regular, 2º Ano, etc.) para organizar turmas e a matriz de disciplinas.
          </p>
          {podeGerenciar && (
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 fw-semibold"
              onClick={onAbrirCriarCiclo}
            >
              <i className="bi bi-plus-lg me-1"></i> Cadastrar Primeiro Ciclo
            </button>
          )}
        </div>
      ) : (
        ciclos.map((ciclo, index) => {
          const paleta = CORES_CICLOS[(ciclo.id_ciclo ?? index) % CORES_CICLOS.length];
          const isAberto = Boolean(ciclosAbertos[ciclo.id_ciclo]);
          const valorSelecionado = disciplinaSelecionadaParaVincular[ciclo.id_ciclo] || "";

          return (
            <CicloCard
              key={ciclo.id_ciclo}
              ciclo={ciclo}
              paleta={paleta}
              isAberto={isAberto}
              turmas={turmas}
              todasDisciplinas={todasDisciplinas}
              podeGerenciar={podeGerenciar}
              excluindoCicloId={excluindoCicloId}
              disciplinaSelecionada={valorSelecionado}
              vinculandoPorCicloId={vinculandoPorCicloId}
              desvinculandoChave={desvinculandoChave}
              onToggleColapsar={onToggleColapsarCiclo}
              onAbrirEditarCiclo={onAbrirEditarCiclo}
              onExcluirCiclo={onExcluirCiclo}
              onAbrirAdicionarDisciplinaAoCiclo={onAbrirAdicionarDisciplinaAoCiclo}
              onSelecionarDisciplinaParaVincular={onSelecionarDisciplinaParaVincular}
              onVincularDisciplinaExistente={onVincularDisciplinaExistente}
              onAbrirEditarDisciplina={onAbrirEditarDisciplina}
              onDesvincularDisciplina={onDesvincularDisciplina}
              onVerDetalhesDisciplina={onVerDetalhesDisciplina}
            />
          );
        })
      )}
    </div>
  );
}
