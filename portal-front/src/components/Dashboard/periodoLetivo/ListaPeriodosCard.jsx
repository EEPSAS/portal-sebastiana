/**
 * ListaPeriodosCard.jsx - Painel de Cards dos Anos e Períodos Letivos
 *
 * Papel Didático:
 * Renderiza os períodos letivos cadastrados com visão clara de:
 * 1. Indicador visual de período "Vigente / Ativo" vs "Inativo";
 * 2. Distribuição das etapas avaliativas (Bimestres/Trimestres) com pesos em pontos e datas;
 * 3. Botões de ação para Especialistas/Adm (Ativação, Sincronização de Agenda, Edição e Exclusão).
 */
export default function ListaPeriodosCard({
  periodos = [],
  podeGerenciar = false,
  onEditar,
  onAtivar,
  onSincronizarAgenda,
  onExcluir,
  acaoEmProgressoId = null,
}) {
  const formatarData = (dataStr) => {
    if (!dataStr) return "—";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="row g-4">
      {periodos.map((periodo) => {
        const isProcessando = acaoEmProgressoId === periodo.id_periodo_letivo;
        const totalDivisoes = periodo.divisoes?.length || 0;

        return (
          <div key={periodo.id_periodo_letivo} className="col-12 col-xl-6">
            <div
              className={`card h-100 rounded-4 shadow-sm border transition ${
                periodo.ativo ? "border-primary border-2" : "border-light-subtle"
              }`}
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Cabeçalho do Card */}
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-3 fw-bold text-dark">{periodo.ano}</span>
                    {periodo.ativo ? (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 fw-semibold">
                        <i className="bi bi-check-circle-fill me-1"></i> Período Vigente
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1">
                        Inativo
                      </span>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">
                    {periodo.tipo_divisao_label || periodo.tipo_divisao} •{" "}
                    <strong>{periodo.total_pontos} pontos totais</strong>
                  </small>
                </div>

                {/* Intervalo do Ano Letivo */}
                <div className="text-end">
                  <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                    <i className="bi bi-calendar3 me-1 text-primary"></i>
                    {formatarData(periodo.data_inicio)} a {formatarData(periodo.data_fim)}
                  </span>
                </div>
              </div>

              {/* Corpo do Card: Cronograma e Pesos das Etapas */}
              <div className="card-body px-4 py-3">
                <h6 className="text-secondary small fw-bold text-uppercase mb-3" style={{ letterSpacing: "0.5px" }}>
                  Etapas Avaliativas ({totalDivisoes})
                </h6>

                <div className="d-flex flex-column gap-2">
                  {periodo.divisoes?.map((div) => {
                    const percentual = periodo.total_pontos > 0
                      ? Math.round((div.pontos / periodo.total_pontos) * 100)
                      : 0;

                    return (
                      <div
                        key={div.id_divisao || div.numero}
                        className={`p-3 rounded-3 border transition ${
                          div.is_atual
                            ? "bg-primary-subtle border-primary"
                            : "bg-light border-light-subtle"
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <strong className="text-dark">{div.nome}</strong>
                            {div.is_atual && (
                              <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: "0.65rem" }}>
                                Em Curso
                              </span>
                            )}
                          </div>
                          <div className="text-end">
                            <span className="fw-bold text-primary fs-6">{div.pontos} pts</span>
                            <small className="text-muted ms-1">({percentual}%)</small>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-muted small">
                          <span>
                            <i className="bi bi-calendar-event me-1"></i>
                            {formatarData(div.data_inicio)} até {formatarData(div.data_fim)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rodapé de Ações (Especialista e Administrador) */}
              {podeGerenciar && (
                <div className="card-footer bg-transparent border-top px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    {!periodo.ativo && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => onAtivar(periodo)}
                        disabled={isProcessando}
                        title="Definir este ano como o período letivo ativo da escola"
                      >
                        <i className="bi bi-check2-circle me-1"></i>
                        Definir como Vigente
                      </button>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border rounded-pill px-3"
                      onClick={() => onSincronizarAgenda(periodo)}
                      disabled={isProcessando}
                      title="Sincronizar marcos escolares deste ano com o calendário da Agenda"
                    >
                      <i className="bi bi-calendar-check me-1 text-primary"></i>
                      Sincronizar Agenda
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-light border rounded-pill px-3"
                      onClick={() => onEditar(periodo)}
                      disabled={isProcessando}
                      title="Editar período letivo"
                    >
                      <i className="bi bi-pencil-square me-1"></i>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o Período Letivo de ${periodo.ano}?`)) {
                          onExcluir(periodo);
                        }
                      }}
                      disabled={isProcessando || periodo.ativo}
                      title={periodo.ativo ? "Desative o período antes de excluí-lo" : "Excluir período letivo"}
                    >
                      <i className="bi bi-trash3 me-1"></i>
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
