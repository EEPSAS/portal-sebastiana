/**
 * UsuariosFiltros.jsx - Barra de Ações e Filtros de Usuários (Módulo 6)
 *
 * Papel Didático:
 * Agrupa os controles de consulta de usuários:
 * - Botão de criação de novo usuário;
 * - Filtro por status de confirmação (Ativo, Pendente, Inativo);
 * - Filtro por papel (Aluno, Professor, Bibliotecária, Especialista, Administrador);
 * - Campo de busca por nome e seletor de itens por página.
 */

const ROLES_OPCOES = [
  { value: "", label: "Todas as Roles" },
  { value: "aluno", label: "Aluno" },
  { value: "professor", label: "Professor" },
  { value: "bibliotecaria", label: "Bibliotecária" },
  { value: "especialista", label: "Especialista" },
  { value: "adm", label: "Administrador" },
];

export default function UsuariosFiltros({
  filtroStatus,
  filtroRole,
  buscaNome,
  porPagina,
  onNovoUsuario,
  onStatusChange,
  onRoleChange,
  onBuscaChange,
  onPorPaginaChange,
}) {
  return (
    <div className="usuarios-nav-filtros d-flex flex-wrap align-items-center gap-2">
      <button
        type="button"
        id="btn-novo-usuario"
        className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
        onClick={onNovoUsuario}
      >
        <i className="bi bi-person-plus-fill"></i>
        <span>Novo Usuário</span>
      </button>

      <div style={{ minWidth: "150px" }}>
        <select
          id="filtro-status-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none"
          value={filtroStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os Status</option>
          <option value="confirmado">Confirmados / Ativos</option>
          <option value="pendente">Aguardando Aprovação</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      <div style={{ minWidth: "140px" }}>
        <select
          id="filtro-role-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none"
          value={filtroRole}
          onChange={(e) => onRoleChange(e.target.value)}
          aria-label="Filtrar por papel"
        >
          {ROLES_OPCOES.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group" style={{ minWidth: "180px", maxWidth: "240px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search"></i>
        </span>
        <input
          id="busca-nome-usuarios"
          type="search"
          className="form-control form-control-sm border-start-0 ps-0 shadow-none"
          placeholder="Buscar usuário..."
          value={buscaNome}
          onChange={(e) => onBuscaChange(e.target.value)}
        />
      </div>

      <div style={{ minWidth: "115px" }}>
        <select
          id="seletor-per-page-usuarios"
          className="form-select form-select-sm rounded-pill shadow-none text-muted"
          value={porPagina}
          onChange={(e) => onPorPaginaChange(Number(e.target.value))}
          aria-label="Itens por página"
        >
          <option value={15}>15 por pág.</option>
          <option value={25}>25 por pág.</option>
          <option value={50}>50 por pág.</option>
          <option value={100}>100 por pág.</option>
        </select>
      </div>
    </div>
  );
}
