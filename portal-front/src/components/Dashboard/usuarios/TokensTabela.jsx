/**
 * TokensTabela.jsx - Tabela Administrativa de Tokens Sanctum (Módulo 6)
 *
 * Papel Didático:
 * Renderiza a listagem tabular e acessível dos tokens registrados no sistema:
 * 1. Confirma a existência do token pelo seu ID de registro (sem jamais exibir o hash/segredo);
 * 2. Exibe de onde o token surgiu (fluxo de autenticação, navegador/SO e endereço IP);
 * 3. Mostra a data/hora de criação, último uso e o limite de expiração (6 horas);
 * 4. Permite revogar/deletar manualmente um token individual ou todas as sessões de um usuário.
 */

const ROLE_LABELS = {
  aluno: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  padrao: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  professor: { label: "Professor", badge: "bg-success-subtle text-success" },
  bibliotecaria: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  bibliotecario: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  especialista: { label: "Especialista", badge: "bg-warning-subtle text-dark" },
  adm: { label: "Administrador", badge: "bg-danger-subtle text-danger" },
};

const ORIGEM_ESTILOS = {
  login_google: {
    icone: "bi-google",
    classe: "bg-danger-subtle text-danger border border-danger-subtle",
  },
  auto_cadastro: {
    icone: "bi-person-plus-fill",
    classe: "bg-info-subtle text-dark border border-info-subtle",
  },
  login_senha: {
    icone: "bi-key-fill",
    classe: "bg-primary-subtle text-primary border border-primary-subtle",
  },
};

const formatarDataHora = (valorIso) => {
  if (!valorIso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valorIso));
  } catch {
    return valorIso;
  }
};

export default function TokensTabela({
  tokens,
  meta,
  resumo,
  loading,
  pagina,
  revogandoId,
  revogandoUsuarioId,
  onRevogarToken,
  onRevogarDoUsuario,
  onPaginaChange,
}) {
  return (
    <>
      {/* Faixa informativa de política de ciclo de vida e segurança dos tokens */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 px-3 mb-2 rounded-3 bg-light border small">
        <div className="d-flex align-items-center gap-2 text-secondary">
          <i className="bi bi-shield-lock-fill text-primary fs-6" aria-hidden="true"></i>
          <span>
            <strong>Política de Segurança:</strong> O valor secreto do token é oculto (hash SHA-256).
            Cada token dura no máximo <strong>6 horas</strong>, é revogado no <strong>logout</strong> e
            os vencidos são removidos automaticamente a cada <strong>8 horas</strong>.
          </span>
        </div>
        {resumo && (
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1">
              {resumo.ativos ?? 0} ativo(s)
            </span>
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1">
              {resumo.expirados ?? 0} vencido(s)
            </span>
          </div>
        )}
      </div>

      {/* Container rolável acessível via teclado (tabIndex=0 e role=region) */}
      <div
        className="dashboard-table-scroll border"
        tabIndex={0}
        role="region"
        aria-label="Tabela de sessões e tokens Sanctum"
      >
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Registro / Usuário</th>
              <th scope="col">De Onde Surgiu (Origem)</th>
              <th scope="col">Dispositivo & IP</th>
              <th scope="col">Data de Criação</th>
              <th scope="col">Expiração (Máx. 6h)</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Carregando registros de tokens Sanctum...
                </td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  Nenhum token de sessão encontrado para os filtros informados.
                </td>
              </tr>
            ) : (
              tokens.map((t) => {
                const u = t.usuario;
                const roleInfo = ROLE_LABELS[u?.role] || {
                  label: u?.role || "Usuário",
                  badge: "bg-secondary-subtle text-dark",
                };
                const estiloOrigem = ORIGEM_ESTILOS[t.origem] || ORIGEM_ESTILOS.login_senha;
                const estaRevogando = revogandoId === t.id;
                const estaRevogandoUsuario = u?.id && revogandoUsuarioId === u.id;

                return (
                  <tr key={t.id} className={t.expirado ? "table-light opacity-75" : ""}>
                    {/* 1. Identificação do Registro (sem exibir a chave secreta) e Usuário Dono */}
                    <th scope="row" className="fw-semibold text-dark">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-dark-subtle text-dark font-monospace rounded-2 px-1.5 py-0.5">
                            Token #{t.id}
                          </span>
                          <span>{u?.name || "Usuário removido"}</span>
                          {u?.role && (
                            <span className={`badge rounded-pill px-2 py-0.5 ${roleInfo.badge}`}>
                              {roleInfo.label}
                            </span>
                          )}
                        </div>
                        <small className="text-muted fw-normal">
                          {u?.email || "Sem e-mail vinculado"} ·{" "}
                          <span className="font-monospace">•••••••• (oculto)</span>
                        </small>
                      </div>
                    </th>

                    {/* 2. De onde o token veio/surgiu */}
                    <td className="text-nowrap">
                      <div className="d-flex flex-column align-items-start gap-1">
                        <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${estiloOrigem.classe}`}>
                          <i className={`bi ${estiloOrigem.icone} me-1`} aria-hidden="true"></i>
                          {t.origem_label || "Login E-mail e Senha"}
                        </span>
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                          Canal: <code>{t.name || "portal-front"}</code>
                        </small>
                      </div>
                    </td>

                    {/* 3. Dispositivo / Navegador e IP */}
                    <td>
                      <div className="d-flex flex-column">
                        <span className="small fw-semibold text-dark text-nowrap">
                          <i className="bi bi-laptop me-1 text-secondary" aria-hidden="true"></i>
                          {t.dispositivo_resumo || "Dispositivo não identificado"}
                        </span>
                        <small className="text-muted text-nowrap">
                          IP: <code>{t.ip_address || "N/D"}</code>
                        </small>
                      </div>
                    </td>

                    {/* 4. Data de Criação e Último Uso */}
                    <td className="text-nowrap small">
                      <div className="d-flex flex-column">
                        <span className="fw-semibold text-dark">
                          {formatarDataHora(t.created_at)}
                        </span>
                        <small className="text-muted">
                          {t.criado_ha || "Recente"}
                          {t.ultimo_uso_ha ? ` • Uso: ${t.ultimo_uso_ha}` : ""}
                        </small>
                      </div>
                    </td>

                    {/* 5. Limite de Expiração (6h) */}
                    <td className="text-nowrap small">
                      <span className={t.expirado ? "text-danger fw-semibold" : "text-secondary"}>
                        <i className="bi bi-hourglass-split me-1" aria-hidden="true"></i>
                        {formatarDataHora(t.expires_at)}
                      </span>
                    </td>

                    {/* 6. Status do Token */}
                    <td className="text-nowrap">
                      <div className="d-flex flex-column align-items-start gap-1">
                        {t.expirado ? (
                          <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 small fw-semibold">
                            <i className="bi bi-clock-history me-1" aria-hidden="true"></i>
                            Vencido (+6h)
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                            <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
                            Ativo
                          </span>
                        )}
                        {t.sessao_atual && (
                          <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: "0.68rem" }}>
                            Sua Sessão Atual
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Ações de Exclusão Manual */}
                    <td className="text-end text-nowrap">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                          onClick={() => onRevogarToken(t)}
                          disabled={estaRevogando || estaRevogandoUsuario}
                          title="Deletar manualmente este token do banco de dados"
                        >
                          {estaRevogando ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <>
                              <i className="bi bi-trash3 me-1" aria-hidden="true"></i>
                              Deletar Token
                            </>
                          )}
                        </button>

                        {u?.id && !t.sessao_atual && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5"
                            onClick={() => onRevogarDoUsuario(u)}
                            disabled={estaRevogando || estaRevogandoUsuario}
                            title={`Encerrar todas as sessões de ${u.name}`}
                            aria-label={`Encerrar todas as sessões de ${u.name}`}
                          >
                            <i className="bi bi-person-slash" aria-hidden="true"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé de Paginação */}
      {meta && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 small text-muted">
          <span>
            Exibindo <strong>{tokens.length}</strong> de{" "}
            <strong>{meta.total ?? tokens.length}</strong> registro(s) de token · Página{" "}
            <strong>{meta.current_page ?? pagina}</strong> de{" "}
            <strong>{meta.last_page ?? 1}</strong>
          </span>
          <nav className="d-flex align-items-center gap-2" aria-label="Paginação de tokens">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
              disabled={loading || pagina <= 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              onClick={() =>
                onPaginaChange(Math.min(Number(meta.last_page || 1), pagina + 1))
              }
              disabled={loading || pagina >= Number(meta.last_page || 1)}
            >
              Próxima
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
