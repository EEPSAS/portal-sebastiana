/**
 * UsuariosTabela.jsx - Tabela Administrativa de Usuários (Módulo 6)
 *
 * Papel Didático:
 * Renderiza a listagem tabular e acessível de usuários cadastrados:
 * 1. Tratamento dos 3 estados: Carregando, Vazio e Dados;
 * 2. Células informativas: Nome, email, turma, autorizador do vínculo, data, role e status;
 * 3. Botões de ação rápida para Edição e Exclusão;
 * 4. Rodapé com navegação paginada vinculada à API.
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

const formatarDataVinculo = (valorIso) => {
  if (!valorIso) return "Aguardando vínculo";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valorIso));
  } catch {
    return valorIso;
  }
};

export default function UsuariosTabela({
  usuarios,
  meta,
  loading,
  pagina,
  onEditarUsuario,
  onExcluirUsuario,
  onPaginaChange,
}) {
  return (
    <>
      <div
        className="dashboard-table-scroll border"
        tabIndex={0}
        role="region"
        aria-labelledby="titulo-controle-usuarios"
      >
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Nome do Usuário</th>
              <th scope="col">Status</th>
              <th scope="col">Autorizado / Vinculado por</th>
              <th scope="col">Data de Vínculo no Sistema</th>
              <th scope="col">Role do Usuário</th>
              <th scope="col" className="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Carregando usuários...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  Nenhum usuário encontrado para os filtros informados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const roleInfo = ROLE_LABELS[u.role] || {
                  label: u.role,
                  badge: "bg-secondary-subtle text-dark",
                };
                const autorizadorNome =
                  u.autorizado_por_nome ||
                  u.vinculado_por?.name ||
                  u.vinculo_ativo?.autorizador_nome ||
                  (u.status_confirmacao === "confirmado" ? "Sistema / Automático" : "Pendente de Aprovação");
                const inativo = u.ativo === false || u.status_confirmacao === "inativo";

                return (
                  <tr key={u.id} className={inativo ? "table-light opacity-75" : ""}>
                    <th scope="row" className="fw-semibold text-dark">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2">
                          <span>{u.name}</span>
                        </div>
                        <small className="text-muted fw-normal">{u.email}</small>
                        {u.turma && (
                          <small className="text-primary mt-0">
                            <i className="bi bi-mortarboard me-1"></i>
                            {u.turma}
                          </small>
                        )}
                        {u.comentario_admin && (
                          <small className="text-muted fst-italic mt-1">
                            <i className="bi bi-chat-left-text me-1"></i>
                            {u.comentario_admin}
                          </small>
                        )}
                      </div>
                    </th>
                    <td>
                      {inativo ? (
                        <span className="badge bg-secondary text-white rounded-pill px-2 py-1 small fw-semibold">
                          <i className="bi bi-slash-circle me-1"></i>
                          Inativo
                        </span>
                      ) : u.status_confirmacao === "pendente" ? (
                        <span className="badge bg-warning text-dark rounded-pill px-2 py-1 small fw-semibold">
                          <i className="bi bi-hourglass-split me-1"></i>
                          Aguardando Aprovação
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 small fw-semibold">
                          <i className="bi bi-check-circle me-1"></i>
                          Confirmado
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="small fw-semibold text-secondary">
                        <i className="bi bi-person-check me-1"></i>
                        {autorizadorNome}
                      </span>
                    </td>
                    <td className="text-nowrap small">
                      {formatarDataVinculo(u.data_vinculo || u.confirmado_em || u.vinculo_ativo?.vinculado_em || u.created_at)}
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-3 py-1 ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                          onClick={() => onEditarUsuario(u)}
                          title="Editar cadastro e permissões do usuário"
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                          onClick={() => onExcluirUsuario(u)}
                          title="Desabilitar acesso ou excluir definitivamente do banco de dados"
                        >
                          <i className="bi bi-person-x-fill me-1"></i>
                          Excluir Usuário
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {meta && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 small text-muted">
          <span>
            Exibindo <strong>{usuarios.length}</strong> de{" "}
            <strong>{meta.total ?? usuarios.length}</strong> usuário(s) · Página{" "}
            <strong>{meta.current_page ?? pagina}</strong> de{" "}
            <strong>{meta.last_page ?? 1}</strong>
          </span>
          <nav className="d-flex align-items-center gap-2" aria-label="Paginação de usuários">
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
