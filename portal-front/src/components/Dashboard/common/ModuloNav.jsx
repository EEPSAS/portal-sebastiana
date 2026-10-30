/**
 * ModuloNav.jsx - Barra de Navegação Horizontal Unificada de Módulos
 *
 * Papel Didático:
 * Padroniza a navegação entre as telas ou abas de um módulo (ex: Acadêmico, Agenda, Conteúdo).
 *
 * Conceito Visual (Híbrido Solicitado):
 * 1. Minimalismo de sublinhado fino sobre a funcionalidade ativa (como em Turmas);
 * 2. Presença do ícone oficial à esquerda de cada item (como no menu Aside);
 * 3. Textos rigorosamente idênticos aos exibidos no Aside (garantindo coerência de UX).
 */

import { Link, useLocation } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { obterContextoModulo, isChildActive } from "../../../utils/dashboardNav";

export default function ModuloNav({
  abas: abasProps,
  abaAtivaId: abaAtivaIdProp,
  onSelecionarAba,
  className = "",
}) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "aluno";

  const contexto = obterContextoModulo(location.pathname, location.search, role);
  const listaAbas = abasProps ?? contexto.abas;

  // Se o módulo não possui múltiplas abas filhas, não renderiza nada
  if (!listaAbas || listaAbas.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`modulo-nav d-flex gap-3 gap-md-4 border-bottom pb-1 flex-wrap ${className}`.trim()}
      aria-label="Navegação do módulo"
    >
      {listaAbas.map((aba) => {
        const ativa = abaAtivaIdProp
          ? abaAtivaIdProp === aba.id
          : isChildActive(aba, location.pathname, location.search);

        const rotulo = aba.labelExibicao || aba.label;

        // Se houver callback customizado de seleção de aba
        if (onSelecionarAba) {
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => onSelecionarAba(aba.id)}
              className={`modulo-nav-item btn btn-link p-0 text-decoration-none d-flex align-items-center ${
                ativa ? "is-active fw-bold" : "text-muted fw-semibold"
              }`}
            >
              {aba.icon && <i className={`bi ${aba.icon} me-2 fs-6`}></i>}
              <span>{rotulo}</span>
            </button>
          );
        }

        // Navegação declarativa padrão via Link do React Router
        return (
          <Link
            key={aba.id}
            to={aba.path}
            className={`modulo-nav-item text-decoration-none d-flex align-items-center ${
              ativa ? "is-active fw-bold" : "text-muted fw-semibold"
            }`}
          >
            {aba.icon && <i className={`bi ${aba.icon} me-2 fs-6`}></i>}
            <span>{rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
