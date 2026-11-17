/**
 * TokensFiltros.jsx - Barra de Ações e Filtros de Tokens Sanctum (Módulo 6)
 *
 * Papel Didático:
 * Agrupa os controles de consulta e manutenção de sessões ativas/expiradas em linha única:
 * - Botão para acionar manualmente a limpeza imediata de tokens expirados (> 6h);
 * - Filtro por status (Ativos dentro das 6h vs Expirados aguardando rotina de 8h);
 * - Filtro por origem de emissão (Login E-mail/Senha, Login Google, Auto-cadastro);
 * - Busca textual por usuário, IP ou navegador e seletor de itens por página.
 */

const ORIGENS_OPCOES = [
  { value: "", label: "Todas as Origens" },
  { value: "login_senha", label: "Login E-mail e Senha" },
  { value: "login_google", label: "Login Institucional Google" },
  { value: "auto_cadastro", label: "Auto-cadastro no Portal" },
];

export default function TokensFiltros({
  filtroStatus,
  filtroOrigem,
  busca,
  porPagina,
  resumo,
  limpandoExpirados,
  onLimparExpirados,
  onStatusChange,
  onOrigemChange,
  onBuscaChange,
  onPorPaginaChange,
}) {
  const totalExpirados = resumo?.expirados ?? 0;

  return (
    <div className="usuarios-nav-filtros d-flex align-items-center gap-1.5">
      {/* Botão para acionar manualmente a faxina de tokens vencidos antes do ciclo automático de 8h */}
      <button
        type="button"
        id="btn-limpar-tokens-expirados"
        className="btn btn-sm btn-outline-danger rounded-pill px-2.5 fw-semibold d-inline-flex align-items-center gap-1 text-nowrap flex-shrink-0 shadow-xs"
        onClick={onLimparExpirados}
        disabled={limpandoExpirados}
        title="Remove imediatamente do banco todos os tokens que já ultrapassaram 6 horas (a rotina automática roda a cada 8h)"
      >
        {limpandoExpirados ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Limpando...</span>
          </>
        ) : (
          <>
            <i className="bi bi-trash3-fill" aria-hidden="true"></i>
            <span>
              Limpar Vencidos{totalExpirados > 0 ? ` (${totalExpirados})` : ""}
            </span>
          </>
        )}
      </button>

      {/* Filtro por Status de Validade */}
      <select
        id="filtro-status-tokens"
        className="form-select form-select-sm rounded-pill shadow-none w-auto flex-shrink-0"
        value={filtroStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filtrar tokens por status de validade"
      >
        <option value="">Todos os Status</option>
        <option value="ativo">Ativos (até 6h)</option>
        <option value="expirado">Vencidos (+6h)</option>
      </select>

      {/* Filtro por Origem de Emissão */}
      <select
        id="filtro-origem-tokens"
        className="form-select form-select-sm rounded-pill shadow-none w-auto flex-shrink-0"
        value={filtroOrigem}
        onChange={(e) => onOrigemChange(e.target.value)}
        aria-label="Filtrar tokens por origem"
      >
        {ORIGENS_OPCOES.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Busca por Usuário, E-mail, IP ou Navegador */}
      <div className="input-group flex-shrink-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted px-2">
          <i className="bi bi-search" aria-hidden="true"></i>
        </span>
        <input
          id="busca-tokens"
          type="search"
          className="form-control form-control-sm border-start-0 ps-0 shadow-none"
          placeholder="Usuário, IP ou navegador..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
        />
      </div>

      {/* Seletor de Paginação */}
      <select
        id="seletor-per-page-tokens"
        className="form-select form-select-sm rounded-pill shadow-none text-muted w-auto flex-shrink-0"
        value={porPagina}
        onChange={(e) => onPorPaginaChange(Number(e.target.value))}
        aria-label="Tokens por página"
      >
        <option value={15}>15 por pág.</option>
        <option value={25}>25 por pág.</option>
        <option value={50}>50 por pág.</option>
        <option value={100}>100 por pág.</option>
      </select>
    </div>
  );
}
