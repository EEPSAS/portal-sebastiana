/**
 * UsuariosTabela.jsx - Tabela Administrativa de Usuários (Módulo 6)
 *
 * Papel Didático:
 * Renderiza a listagem tabular, ordenável e acessível de usuários cadastrados:
 * 1. Tratamento dos 3 estados: Carregando, Vazio e Dados;
 * 2. Células informativas: Nome, email, turma, autorizador do vínculo, data, role e status centralizado;
 * 3. Linhas alternadas na paleta institucional e cabeçalhos ordenáveis (sortable-table);
 * 4. Botões de ação rápida para Edição e Exclusão e rodapé com navegação paginada.
 */

import { useMemo, useState } from "react";

const ROLE_LABELS = {
  aluno: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  padrao: { label: "Aluno", badge: "bg-primary-subtle text-primary" },
  professor: { label: "Professor", badge: "bg-success-subtle text-success" },
  bibliotecaria: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  bibliotecario: { label: "Bibliotecária", badge: "bg-info-subtle text-dark" },
  especialista: { label: "Especialista", badge: "bg-warning-subtle text-dark" },
  adm: { label: "Administrador", badge: "bg-danger-subtle text-danger" },
};

const collatorPtBr = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

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

const obterTimestamp = (valorIso) => {
  if (!valorIso) return 0;
  const ts = Date.parse(valorIso);
  return Number.isNaN(ts) ? 0 : ts;
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
  const [ordenacao, setOrdenacao] = useState({
    coluna: "data",
    direcao: "descending",
  });

  const handleOrdenar = (coluna) => {
    setOrdenacao((atual) => ({
      coluna,
      direcao:
        atual.coluna === coluna && atual.direcao === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const usuariosOrdenados = useMemo(() => {
    if (!Array.isArray(usuarios) || usuarios.length <= 1) return usuarios || [];
    const fator = ordenacao.direcao === "ascending" ? 1 : -1;

    return [...usuarios].sort((a, b) => {
      switch (ordenacao.coluna) {
        case "nome":
          return fator * collatorPtBr.compare(a.name || "", b.name || "");
        case "status": {
          const statusA = a.ativo === false ? "inativo" : a.status_confirmacao || "confirmado";
          const statusB = b.ativo === false ? "inativo" : b.status_confirmacao || "confirmado";
          return fator * collatorPtBr.compare(statusA, statusB);
        }
        case "autorizador": {
          const autA = a.autorizado_por_nome || a.vinculado_por?.name || "";
          const autB = b.autorizado_por_nome || b.vinculado_por?.name || "";
          return fator * collatorPtBr.compare(autA, autB);
        }
        case "data": {
          const dataA = obterTimestamp(a.data_vinculo || a.confirmado_em || a.created_at);
          const dataB = obterTimestamp(b.data_vinculo || b.confirmado_em || b.created_at);
          return fator * (dataA - dataB);
        }
        case "role":
          return fator * collatorPtBr.compare(a.role || "", b.role || "");
        default:
          return 0;
      }
    });
  }, [usuarios, ordenacao]);

  const renderIconeOrdenacao = (coluna) => {
    if (ordenacao.coluna !== coluna) {
      return <i className="bi bi-arrow-down-up table-sort-icon" aria-hidden="true"></i>;
    }
    return ordenacao.direcao === "ascending" ? (
      <i className="bi bi-sort-up table-sort-icon" aria-hidden="true"></i>
    ) : (
      <i className="bi bi-sort-down table-sort-icon" aria-hidden="true"></i>
    );
  };

  const obterAriaSort = (coluna) =>
    ordenacao.coluna === coluna ? ordenacao.direcao : undefined;

  return (
    <>
      <div role="status" className="visually-hidden">
        {`Tabela de usuários ordenada por ${ordenacao.coluna} em ordem ${
          ordenacao.direcao === "ascending" ? "crescente" : "decrescente"
        }`}
      </div>

      <div
        className="dashboard-table-scroll border"
        tabIndex={0}
        role="region"
        aria-label="Tabela de controle de usuários"
      >
        <table className="table table-hover dashboard-table-zebra align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" aria-sort={obterAriaSort("nome")}>
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleOrdenar("nome")}
                >
                  <span>Nome do Usuário</span>
                  {renderIconeOrdenacao("nome")}
                </button>
              </th>
              <th scope="col" className="text-center" aria-sort={obterAriaSort("status")}>
                <button
                  type="button"
                  className="table-sort-btn table-sort-btn--center"
                  onClick={() => handleOrdenar("status")}
                >
                  <span>Status</span>
                  {renderIconeOrdenacao("status")}
                </button>
              </th>
              <th scope="col" aria-sort={obterAriaSort("autorizador")}>
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleOrdenar("autorizador")}
                >
                  <span>Autorizado / Vinculado por</span>
                  {renderIconeOrdenacao("autorizador")}
                </button>
              </th>
              <th scope="col" aria-sort={obterAriaSort("data")}>
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleOrdenar("data")}
                >
                  <span>Data de Vínculo no Sistema</span>
                  {renderIconeOrdenacao("data")}
                </button>
              </th>
              <th scope="col" aria-sort={obterAriaSort("role")}>
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleOrdenar("role")}
                >
                  <span>Role do Usuário</span>
                  {renderIconeOrdenacao("role")}
                </button>
              </th>
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
            ) : usuariosOrdenados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  Nenhum usuário encontrado para os filtros informados.
                </td>
              </tr>
            ) : (
              usuariosOrdenados.map((u) => {
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
                  <tr key={u.id} className={inativo ? "opacity-75" : ""}>
                    <th scope="row" className="fw-semibold text-dark">
                      <div className="d-flex flex-column">
                        <div className="d-flex align-items-center gap-2">
                          <span>{u.name}</span>
                        </div>
                        <small className="text-muted fw-normal">{u.email}</small>
                        {u.turma && (
                          <small className="text-primary mt-0">
                            <i className="bi bi-mortarboard me-1" aria-hidden="true"></i>
                            {u.turma}
                          </small>
                        )}
                        {u.comentario_admin && (
                          <small className="text-muted fst-italic mt-1">
                            <i className="bi bi-chat-left-text me-1" aria-hidden="true"></i>
                            {u.comentario_admin}
                          </small>
                        )}
                      </div>
                    </th>
                    <td className="text-center text-nowrap">
                      {inativo ? (
                        <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 small fw-semibold">
                          <i className="bi bi-slash-circle me-1" aria-hidden="true"></i>
                          Inativo
                        </span>
                      ) : u.status_confirmacao === "pendente" ? (
                        <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 small fw-semibold">
                          <i className="bi bi-hourglass-split me-1" aria-hidden="true"></i>
                          Aguardando Aprovação
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                          <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
                          Confirmado
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="small fw-semibold text-secondary">
                        <i className="bi bi-person-check me-1" aria-hidden="true"></i>
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
                          <i className="bi bi-pencil-square me-1" aria-hidden="true"></i>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                          onClick={() => onExcluirUsuario(u)}
                          title="Desabilitar acesso ou excluir definitivamente do banco de dados"
                        >
                          <i className="bi bi-person-x-fill me-1" aria-hidden="true"></i>
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

      {/* Paginação fixa na base do painel */}
      {meta && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-2 pt-1 small text-muted flex-shrink-0">
          <span>
            Exibindo <strong>{usuariosOrdenados.length}</strong> de{" "}
            <strong>{meta.total ?? usuariosOrdenados.length}</strong> usuário(s) · Página{" "}
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
