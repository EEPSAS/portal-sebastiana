/**
 * TurnoCard.jsx - Configuração de Turno Operacional Escolar (Módulo 5.4)
 *
 * Papel Didático:
 * Renderiza um Turno Escolar (Matutino, Vespertino, Noturno, Integral):
 * 1. Exibe horários de início, término, duração e quantidade de aulas;
 * 2. Gerencia pausas operacionais (intervalos/recreio e almoço);
 * 3. Permite alternância rápida de status (Ativo/Desativado) e edição inline com persistência na API.
 */

export default function TurnoCard({
  turno,
  turmas,
  estaEditando,
  isSalvando,
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
  const turmasDoTurno = turmas.filter(
    (t) => String(t.turno).toLowerCase() === String(turno.id || turno.nome).toLowerCase()
  );

  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div
        className={`card h-100 rounded-3 border shadow-xs p-2.5 bg-white transition-all ${
          turno.ativo ? "" : "opacity-75 bg-light"
        } ${estaEditando ? "border-primary shadow" : ""}`}
      >
        {/* Cabeçalho do Card */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center ${
                turno.ativo
                  ? "bg-primary-subtle text-primary"
                  : "bg-secondary-subtle text-muted"
              }`}
              style={{ width: "32px", height: "32px", fontSize: "1rem" }}
            >
              <i className={`bi ${turno.icone || "bi-clock"}`}></i>
            </div>
            <div>
              <h3 className="h6 fw-bold mb-0 text-dark" style={{ fontSize: "0.95rem" }}>
                {turno.nome}
              </h3>
              <span
                className={`badge rounded-pill ${
                  turno.ativo
                    ? "bg-success-subtle text-success"
                    : "bg-secondary-subtle text-secondary"
                }`}
                style={{ fontSize: "0.68rem" }}
              >
                {turno.ativo ? "Em Funcionamento" : "Desativado"}
              </span>
            </div>
          </div>

          {/* Switch de Ativação Rápida */}
          {podeGerenciar && (
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input cursor-pointer"
                type="checkbox"
                role="switch"
                checked={Boolean(turno.ativo)}
                onChange={() => onToggleTurno(turno.id)}
                title={`Alternar ativação do turno ${turno.nome}`}
              />
            </div>
          )}
        </div>

        <p
          className="text-secondary small mb-2 text-truncate"
          title={turno.descricao}
          style={{ fontSize: "0.78rem" }}
        >
          {turno.descricao}
        </p>

        {/* Configuração Operacional Bloqueada / Editável */}
        <div className={`p-2 rounded-3 border mb-2 transition-all ${estaEditando ? "bg-white border-primary-subtle" : "bg-light"}`}>
          {/* Linha 1: Início e Fim do Turno */}
          <div className="row g-1 mb-1.5 align-items-center">
            <div className="col-6">
              <label
                htmlFor={`turno-inicio-${turno.id}`}
                className="text-muted fw-semibold d-block mb-0 text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Início
              </label>
              <input
                id={`turno-inicio-${turno.id}`}
                type="time"
                className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                  estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                }`}
                style={{ fontSize: "0.78rem" }}
                value={turno.hora_inicio || turno.inicio || "07:00"}
                onChange={(e) =>
                  onAlterarCampoTurno(turno.id, "hora_inicio", e.target.value)
                }
                disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
              />
            </div>
            <div className="col-6">
              <label
                htmlFor={`turno-fim-${turno.id}`}
                className="text-muted fw-semibold d-block mb-0 text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Término
              </label>
              <input
                id={`turno-fim-${turno.id}`}
                type="time"
                className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                  estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                }`}
                style={{ fontSize: "0.78rem" }}
                value={turno.hora_fim || turno.fim || "12:15"}
                onChange={(e) =>
                  onAlterarCampoTurno(turno.id, "hora_fim", e.target.value)
                }
                disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
              />
            </div>
          </div>

          {/* Linha 2: Módulo Aula (min) e Qtd Aulas */}
          <div className="row g-1 mb-1.5 align-items-center">
            <div className="col-6">
              <label
                htmlFor={`turno-duracao-${turno.id}`}
                className="text-muted fw-semibold d-block mb-0 text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Módulo (min)
              </label>
              <input
                id={`turno-duracao-${turno.id}`}
                type="number"
                min="30"
                max="120"
                step="5"
                className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                  estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                }`}
                style={{ fontSize: "0.78rem" }}
                value={turno.duracao_aula_minutos || 50}
                onChange={(e) =>
                  onAlterarCampoTurno(
                    turno.id,
                    "duracao_aula_minutos",
                    parseInt(e.target.value, 10) || 0
                  )
                }
                disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
              />
            </div>
            <div className="col-6">
              <label
                htmlFor={`turno-qtd-${turno.id}`}
                className="text-muted fw-semibold d-block mb-0 text-uppercase"
                style={{ fontSize: "0.65rem" }}
              >
                Aulas/dia
              </label>
              <input
                id={`turno-qtd-${turno.id}`}
                type="number"
                min="1"
                max="12"
                className={`form-control form-control-sm text-center fw-semibold py-0.5 px-1 ${
                  estaEditando ? "border-primary bg-white" : "bg-light-subtle text-secondary"
                }`}
                style={{ fontSize: "0.78rem" }}
                value={turno.quantidade_aulas || 5}
                onChange={(e) =>
                  onAlterarCampoTurno(
                    turno.id,
                    "quantidade_aulas",
                    parseInt(e.target.value, 10) || 0
                  )
                }
                disabled={!estaEditando || !turno.ativo || isSalvando || !podeGerenciar}
              />
            </div>
          </div>

          {/* Linha 3: Pausas Operacionais (Intervalos e Almoço) */}
          <div className="mt-2 pt-2 border-top">
            <div className="d-flex align-items-center justify-content-between mb-1.5">
              <small
                className="text-muted fw-bold text-uppercase d-block"
                style={{ fontSize: "0.65rem", letterSpacing: "0.2px" }}
              >
                Pausas (Recreio e Almoço)
              </small>
              {estaEditando && podeGerenciar && (
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none text-primary fw-semibold"
                  style={{ fontSize: "0.7rem" }}
                  onClick={() => onAdicionarPausa(turno.id)}
                >
                  <i className="bi bi-plus-circle me-1"></i>Adicionar
                </button>
              )}
            </div>

            {/* Modo Leitura / Bloqueado */}
            {!estaEditando ? (
              (turno.pausas || []).length > 0 ? (
                <div className="d-flex flex-column gap-1">
                  {turno.pausas.map((pausa, pIdx) => (
                    <div
                      key={pIdx}
                      className={`d-flex align-items-center justify-content-between px-2 py-0.5 rounded border ${
                        pausa.tipo === "almoco"
                          ? "bg-warning-subtle border-warning-subtle text-warning-emphasis"
                          : "bg-white text-dark"
                      }`}
                      style={{ fontSize: "0.72rem" }}
                    >
                      <span className="d-flex align-items-center gap-1.5 fw-medium text-truncate">
                        <span>{pausa.tipo === "almoco" ? "🍽️" : "☕"}</span>
                        <span className="text-truncate">{pausa.rotulo || (pausa.tipo === "almoco" ? "Almoço" : "Intervalo")}</span>
                      </span>
                      <span className="fw-semibold text-nowrap ms-1">
                        {pausa.hora_inicio} - {pausa.hora_fim}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted small d-block py-1 text-center" style={{ fontSize: "0.7rem" }}>
                  Nenhuma pausa cadastrada
                </span>
              )
            ) : (
              /* Modo Edição */
              <div className="d-flex flex-column gap-1.5">
                {(turno.pausas || []).map((pausa, pIdx) => (
                  <div key={pIdx} className="p-1.5 rounded-2 bg-light border">
                    <div className="row g-1 align-items-center mb-1">
                      <div className="col-4">
                        <select
                          className="form-select form-select-sm py-0 px-1 fw-semibold"
                          style={{ fontSize: "0.72rem", height: "24px" }}
                          value={pausa.tipo || "intervalo"}
                          onChange={(e) => onAlterarPausa(turno.id, pIdx, "tipo", e.target.value)}
                        >
                          <option value="intervalo">☕ Intervalo</option>
                          <option value="almoco">🍽️ Almoço</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm py-0 px-1 fw-medium"
                          style={{ fontSize: "0.72rem", height: "24px" }}
                          placeholder="Rótulo (ex: Almoço)"
                          value={pausa.rotulo || ""}
                          onChange={(e) => onAlterarPausa(turno.id, pIdx, "rotulo", e.target.value)}
                        />
                      </div>
                      <div className="col-2 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-0 border-0"
                          style={{ width: "22px", height: "22px" }}
                          onClick={() => onRemoverPausa(turno.id, pIdx)}
                          title="Remover esta pausa"
                        >
                          <i className="bi bi-trash3" style={{ fontSize: "0.75rem" }}></i>
                        </button>
                      </div>
                    </div>
                    <div className="row g-1 align-items-center">
                      <div className="col-6">
                        <input
                          type="time"
                          className="form-control form-control-sm text-center py-0 px-1"
                          style={{ fontSize: "0.72rem", height: "22px" }}
                          value={pausa.hora_inicio || "09:30"}
                          onChange={(e) => onAlterarPausa(turno.id, pIdx, "hora_inicio", e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="time"
                          className="form-control form-control-sm text-center py-0 px-1"
                          style={{ fontSize: "0.72rem", height: "22px" }}
                          value={pausa.hora_fim || "09:45"}
                          onChange={(e) => onAlterarPausa(turno.id, pIdx, "hora_fim", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 rounded-pill py-0.5 mt-1 d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => onAdicionarPausa(turno.id)}
                >
                  <i className="bi bi-plus-circle"></i>
                  <span>Adicionar Pausa</span>
                </button>
              </div>
            )}
          </div>

          {/* Botão de Edição e Salvar com Bloqueio Automático */}
          {podeGerenciar && (
            <div className="mt-2">
              {!estaEditando ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary w-100 rounded-pill py-1 d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => onIniciarEdicao(turno.id)}
                  disabled={!turno.ativo || isSalvando}
                  title={`Habilitar edição das configurações do turno ${turno.nome}`}
                >
                  <i className="bi bi-pencil-square text-primary"></i>
                  <span>Editar Configuração</span>
                </button>
              ) : (
                <div className="d-flex gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary flex-grow-1 rounded-pill py-1 d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => onSalvarTurno(turno.id)}
                    disabled={isSalvando}
                    title="Salvar alterações e bloquear componente"
                  >
                    {isSalvando ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle"></i>
                        <span>Salvar</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                    style={{ fontSize: "0.75rem" }}
                    onClick={onCancelarEdicao}
                    disabled={isSalvando}
                    title="Cancelar alterações e bloquear"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Turmas Ativas */}
        <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
          <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
            Turmas Ativas:
          </span>
          <span className="badge rounded-pill bg-primary px-2 py-0.5" style={{ fontSize: "0.72rem" }}>
            {turmasDoTurno.length} {turmasDoTurno.length === 1 ? "turma" : "turmas"}
          </span>
        </div>
      </div>
    </div>
  );
}
