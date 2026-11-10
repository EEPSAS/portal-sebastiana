/**
 * CicloCard.jsx - Card Expansível de Ciclo Curricular e Matriz de Disciplinas (Módulo 5.4)
 *
 * Papel Didático:
 * Renderiza um Ciclo individual com:
 * 1. Cabeçalho com cor temática, nome, ID, descrição e botão de expandir/recolher;
 * 2. Badges de quantidade de disciplinas e turmas ativas;
 * 3. Ações gerenciais para Especialista/Administrador (Editar e Excluir Ciclo);
 * 4. Barra de ações (quando aberto) para adicionar nova disciplina ou vincular existente via select;
 * 5. Grid de cards das disciplinas vinculadas àquele ciclo.
 */

import { formatarDisciplinaCiclo } from "../../../utils/formatters";

export default function CicloCard({
  ciclo,
  paleta,
  isAberto,
  turmas,
  todasDisciplinas,
  podeGerenciar,
  excluindoCicloId,
  disciplinaSelecionada,
  vinculandoPorCicloId,
  desvinculandoChave,
  onToggleColapsar,
  onAbrirEditarCiclo,
  onExcluirCiclo,
  onAbrirAdicionarDisciplinaAoCiclo,
  onSelecionarDisciplinaParaVincular,
  onVincularDisciplinaExistente,
  onAbrirEditarDisciplina,
  onDesvincularDisciplina,
  onVerDetalhesDisciplina,
}) {
  const turmasDoCiclo = turmas.filter(
    (t) => String(t.ciclo_id) === String(ciclo.id_ciclo)
  );
  const disciplinasDoCiclo = ciclo.disciplinas || [];

  // Filtra todas as disciplinas disponíveis no catálogo que AINDA NÃO pertencem a este ciclo
  const disciplinasDisponiveisParaVincular = todasDisciplinas.filter(
    (d) =>
      !disciplinasDoCiclo.some(
        (cd) => Number(cd.id_disciplina) === Number(d.id_disciplina)
      )
  );

  return (
    <div
      className="card border rounded-3 shadow-xs bg-white overflow-hidden mb-2.5"
      style={{
        borderLeft: `5px solid ${paleta.primária}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Cabeçalho do Ciclo Slim com Destaque Visual e Botão de Expandir/Recolher */}
      <div
        className="card-header border-bottom p-2 p-md-2.5"
        style={{ backgroundColor: paleta.bgHeader }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
              style={{
                width: "36px",
                height: "36px",
                fontSize: "1.05rem",
                backgroundColor: paleta.primária,
              }}
            >
              <i className="bi bi-layers-fill"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h3 className="h6 fw-bold text-dark mb-0">{ciclo.nome}</h3>
                <span
                  className="badge rounded-pill py-0.5 px-2"
                  style={{
                    fontSize: "0.72rem",
                    backgroundColor: paleta.badgeBg,
                    color: paleta.badgeText,
                    border: `1px solid ${paleta.border}`,
                  }}
                >
                  ID #{ciclo.id_ciclo}
                </span>

                {/* Botão Prominente de Colapsar/Expandir Ciclo */}
                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold d-inline-flex align-items-center gap-1 shadow-xs transition-all ciclo-collapse-btn"
                  onClick={() => onToggleColapsar(ciclo.id_ciclo)}
                  aria-expanded={isAberto}
                  aria-controls={`ciclo-conteudo-${ciclo.id_ciclo}`}
                  title={isAberto ? "Recolher ciclo" : "Abrir e visualizar disciplinas deste ciclo"}
                  style={{
                    backgroundColor: isAberto ? paleta.primária : "#ffffff",
                    color: isAberto ? "#ffffff" : paleta.badgeText,
                    border: `1.5px solid ${paleta.primária}`,
                    fontSize: "0.75rem",
                  }}
                >
                  <i
                    className={`bi ${isAberto ? "bi-chevron-up" : "bi-chevron-down"} fw-bold`}
                    style={{ fontSize: "0.8rem" }}
                    aria-hidden="true"
                  ></i>
                  <span>{isAberto ? "Recolher Ciclo" : `Abrir (${disciplinasDoCiclo.length} Matérias)`}</span>
                </button>
              </div>
              {ciclo.descricao ? (
                <p className="text-secondary small mb-0 mt-0.5" style={{ fontSize: "0.78rem" }}>
                  {ciclo.descricao}
                </p>
              ) : (
                <p className="text-muted small fst-italic mb-0 mt-0.5" style={{ fontSize: "0.78rem" }}>
                  Sem descrição cadastrada.
                </p>
              )}
            </div>
          </div>

          {/* Estatísticas e Ações do Ciclo */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className="badge rounded-pill px-2.5 py-1 fw-semibold"
              style={{
                fontSize: "0.75rem",
                backgroundColor: paleta.badgeBg,
                color: paleta.badgeText,
                border: `1px solid ${paleta.border}`,
              }}
            >
              <i className="bi bi-journal-bookmark-fill me-1"></i>
              {disciplinasDoCiclo.length} disciplina(s)
            </span>
            <span
              className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-semibold"
              style={{ fontSize: "0.75rem" }}
            >
              <i className="bi bi-people-fill me-1"></i>
              {turmasDoCiclo.length} turma(s)
            </span>

            {podeGerenciar && (
              <div className="btn-group btn-group-sm ms-md-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-start-pill px-2.5 py-1"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => onAbrirEditarCiclo(ciclo)}
                  title="Editar nome e descrição do Ciclo"
                >
                  <i className="bi bi-pencil me-1"></i> Editar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger rounded-end-pill px-2.5 py-1"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => onExcluirCiclo(ciclo)}
                  disabled={excluindoCicloId === ciclo.id_ciclo}
                  title="Excluir Ciclo"
                >
                  {excluindoCicloId === ciclo.id_ciclo ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-trash me-1"></i> Excluir
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Turmas vinculadas ao ciclo */}
        {turmasDoCiclo.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-top d-flex align-items-center gap-2 flex-wrap">
            <small className="text-muted fw-bold" style={{ fontSize: "0.7rem" }}>
              TURMAS:
            </small>
            {turmasDoCiclo.map((t) => (
              <span
                key={t.id_turma}
                className="badge bg-white text-dark border py-0.5 px-2 fw-normal"
                style={{ fontSize: "0.72rem" }}
              >
                {t.nome_identificador}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Corpo do Ciclo: Barra de Ações & Grid de Disciplinas (Visível APENAS quando Aberto) */}
      {isAberto && (
        <div id={`ciclo-conteudo-${ciclo.id_ciclo}`}>
          {/* Barra de Ações: Adicionar Nova Disciplina & Select de Vínculo de Disciplina Existente */}
          {podeGerenciar && (
            <div className="py-1.5 px-2.5 bg-light bg-opacity-50 border-bottom">
              <div className="row px-2 g-2 align-items-center justify-content-between">
                {/* Botão: Cadastrar Nova Disciplina diretamente neste Ciclo */}
                <div className="col-12 col-md-auto">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1 shadow-xs"
                    onClick={() => onAbrirAdicionarDisciplinaAoCiclo(ciclo.id_ciclo)}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Adicionar Nova Disciplina</span>
                  </button>
                </div>

                {/* Select de Disciplinas Disponíveis para Vínculo */}
                <div className="col-12 col-md-auto">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <label
                      htmlFor={`select-vincular-ciclo-${ciclo.id_ciclo}`}
                      className="small text-muted fw-semibold text-nowrap mb-0"
                      style={{ fontSize: "0.78rem" }}
                    >
                      <i className="bi bi-link-45deg me-1"></i>
                      Vincular disciplina existente:
                    </label>

                    {disciplinasDisponiveisParaVincular.length > 0 ? (
                      <div className="input-group input-group-sm" style={{ minWidth: "240px" }}>
                        <select
                          id={`select-vincular-ciclo-${ciclo.id_ciclo}`}
                          className="form-select form-select-sm"
                          value={disciplinaSelecionada || ""}
                          onChange={(e) =>
                            onSelecionarDisciplinaParaVincular(ciclo.id_ciclo, e.target.value)
                          }
                          disabled={vinculandoPorCicloId === ciclo.id_ciclo}
                        >
                          <option value="">Selecione uma disciplina...</option>
                          {disciplinasDisponiveisParaVincular.map((d) => (
                            <option key={d.id_disciplina} value={d.id_disciplina}>
                              {d.nome} ({d.aulas_semanais || 4} a/sem)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-success fw-semibold"
                          onClick={() => onVincularDisciplinaExistente(ciclo.id_ciclo)}
                          disabled={
                            !disciplinaSelecionada ||
                            vinculandoPorCicloId === ciclo.id_ciclo
                          }
                          title="Vincular disciplina selecionada a este ciclo"
                        >
                          {vinculandoPorCicloId === ciclo.id_ciclo ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            "Vincular"
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary small fw-normal">
                        Todas as disciplinas já vinculadas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid de Disciplinas Pertencentes ao Ciclo */}
          <div className="p-2 p-md-2.5">
            {disciplinasDoCiclo.length === 0 ? (
              <div className="text-center py-3 text-muted small bg-light rounded-3 border border-dashed">
                <i className="bi bi-journal-bookmark fs-4 d-block text-muted mb-1"></i>
                Nenhuma disciplina vinculada a este ciclo até o momento.
                <div className="mt-1">
                  Utilize o botão <strong>&ldquo;Adicionar Nova Disciplina&rdquo;</strong> ou selecione uma matéria existente no menu ao lado.
                </div>
              </div>
            ) : (
              <div className="row g-2">
                {disciplinasDoCiclo.map((disc) => {
                  const aulasSem =
                    disc.aulas_semanais ||
                    Math.max(1, Math.round((disc.carga_horaria_anual || 160) / 40));
                  const totalAulas =
                    disc.total_aulas_anuais ||
                    disc.carga_horaria_anual ||
                    aulasSem * 40;

                  const chaveDesvinculo = `${ciclo.id_ciclo}-${disc.id_disciplina}`;
                  const estáDesvinculando = desvinculandoChave === chaveDesvinculo;

                  return (
                    <div className="col-12 col-md-6 col-xl-4" key={disc.id_disciplina}>
                      <div
                        className="card h-100 border rounded-3 bg-white shadow-none d-flex flex-column justify-content-between"
                        style={{ padding: "1.15rem 1.25rem" }}
                      >
                        <div>
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5">
                            <h4
                              className="h6 fw-bold text-dark mb-0 text-truncate"
                              title={formatarDisciplinaCiclo(disc, ciclo)}
                            >
                              {formatarDisciplinaCiclo(disc, ciclo)}
                            </h4>
                            <span
                              className="badge bg-primary-subtle text-primary rounded-pill text-nowrap"
                              style={{ fontSize: "0.68rem" }}
                            >
                              {aulasSem} a/sem • {totalAulas} a/ano
                            </span>
                          </div>

                          {/* Professores Vinculados */}
                          <div className="small text-secondary mb-1.5" style={{ fontSize: "0.78rem" }}>
                            <i className="bi bi-person-badge me-1 text-primary"></i>
                            <strong>Docente(s):</strong>{" "}
                            {Array.isArray(disc.professores) && disc.professores.length > 0 ? (
                              disc.professores.map((p) => p.name).join(", ")
                            ) : (
                              <span className="text-muted fst-italic">
                                Nenhum docente vinculado
                              </span>
                            )}
                          </div>

                          {/* Ementa breve */}
                          {disc.ementa && (
                            <p
                              className="text-muted small mb-0"
                              style={{
                                fontSize: "0.76rem",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              <strong>Ementa:</strong> {disc.ementa}
                            </p>
                          )}
                        </div>

                        {/* Ações na Disciplina dentro do Ciclo */}
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none px-0 fw-semibold text-primary"
                            style={{ fontSize: "0.78rem" }}
                            onClick={() => onVerDetalhesDisciplina(disc)}
                          >
                            <i className="bi bi-eye me-1"></i> Plano Pedagógico
                          </button>

                          {podeGerenciar && (
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-primary rounded-start-pill py-0 px-2"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => onAbrirEditarDisciplina(disc)}
                                title="Editar disciplina"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger rounded-end-pill py-0 px-2"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => onDesvincularDisciplina(ciclo, disc)}
                                disabled={estáDesvinculando}
                                title="Desvincular disciplina deste ciclo"
                              >
                                {estáDesvinculando ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-link-45deg"></i>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
