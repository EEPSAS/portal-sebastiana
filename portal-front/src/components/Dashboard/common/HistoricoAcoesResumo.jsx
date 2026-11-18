/**
 * HistoricoAcoesResumo.jsx - Bloco Reutilizável de Auditoria e Histórico Recente
 *
 * Papel Didático:
 * Exibe em uma faixa compacta quem executou a última ação sobre uma entidade
 * e permite expandir sob demanda uma timeline com até as 5 últimas modificações.
 * Por regra de RBAC, permanece oculto para perfis de consulta (Aluno e Professor),
 * renderizando exclusivamente para Especialista Pedagógico e Administrador.
 */

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import "./HistoricoAcoesResumo.css";

/**
 * Formata uma data ISO da API para o padrão brasileiro legível com hora (`DD/MM/AAAA às HH:mm`).
 */
function formatarDataHoraPtBr(isoString) {
  if (!isoString) return "";
  try {
    const data = new Date(isoString);
    if (Number.isNaN(data.getTime())) return "";
    const dia = data.toLocaleDateString("pt-BR");
    const hora = data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dia} às ${hora}`;
  } catch {
    return "";
  }
}

export default function HistoricoAcoesResumo({
  ultimaAcao = null,
  ultimasAcoes = [],
  rotuloEntidade = "registro",
  className = "",
  compacto = false,
}) {
  const { user } = useAuth();
  const [expandido, setExpandido] = useState(false);

  // Blindagem de UI: apenas Especialista e Administrador visualizam a auditoria interna
  const roleEfetiva = String(user?.role || "").toLowerCase();
  const podeVisualizarAuditoria =
    roleEfetiva === "especialista" || roleEfetiva === "adm";

  if (!podeVisualizarAuditoria) {
    return null;
  }

  // Normaliza a lista de até 5 registros recentes evitando duplicidade quando só `ultimaAcao` vier preenchida
  const lista =
    Array.isArray(ultimasAcoes) && ultimasAcoes.length > 0
      ? ultimasAcoes.slice(0, 5)
      : ultimaAcao
        ? [ultimaAcao]
        : [];

  const acaoPrincipal = ultimaAcao || lista[0] || null;

  if (!acaoPrincipal) {
    return (
      <div
        className={`historico-acoes-box ${compacto ? "historico-acoes-box--compacto" : ""} text-muted d-flex align-items-center gap-2 ${className}`}
      >
        <i className="bi bi-clock-history text-secondary" aria-hidden="true"></i>
        <span>
          Nenhuma ação registrada no histórico recente{" "}
          {rotuloEntidade ? `deste(a) ${rotuloEntidade}` : "deste item"}.
        </span>
      </div>
    );
  }

  const cargoPrincipal =
    acaoPrincipal.executado_por_role_label ||
    acaoPrincipal.executado_por_role ||
    "Sistema";
  const dataPrincipal =
    formatarDataHoraPtBr(acaoPrincipal.created_at) ||
    acaoPrincipal.tempo_atras ||
    "";

  return (
    <div
      className={`historico-acoes-box ${compacto ? "historico-acoes-box--compacto" : ""} ${className}`}
    >
      {/* Linha principal com a última modificação em destaque e botão de expansão */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <div className="d-flex align-items-start gap-2 min-w-0 flex-grow-1">
          <i
            className="bi bi-clock-history text-primary mt-0.5 flex-shrink-0"
            aria-hidden="true"
          ></i>
          <div className="min-w-0">
            <div className="text-dark lh-sm">
              <span className="fw-bold text-primary">Última ação:</span>{" "}
              <span>{acaoPrincipal.descricao}</span>
            </div>
            <div className="text-muted mt-1 d-flex flex-wrap align-items-center gap-1.5">
              <span>
                por{" "}
                <strong className="text-dark">
                  {acaoPrincipal.executado_por_nome || "Sistema"}
                </strong>
              </span>
              <span className="badge rounded-pill historico-acoes-badge-cargo px-2 py-0.5">
                {cargoPrincipal}
              </span>
              {dataPrincipal && (
                <span className="text-secondary">• {dataPrincipal}</span>
              )}
            </div>
          </div>
        </div>

        {lista.length > 0 && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold text-primary historico-acoes-toggle-btn flex-shrink-0"
            onClick={() => setExpandido((prev) => !prev)}
            aria-expanded={expandido}
          >
            {expandido
              ? "Ocultar histórico"
              : `Ver histórico (${lista.length})`}{" "}
            <i
              className={`bi ${expandido ? "bi-chevron-up" : "bi-chevron-down"}`}
              aria-hidden="true"
            ></i>
          </button>
        )}
      </div>

      {/* Timeline expandida sob demanda com até as 5 últimas modificações */}
      {expandido && lista.length > 0 && (
        <div className="historico-acoes-timeline" role="region" aria-label="Histórico das últimas modificações">
          {lista.map((item, idx) => {
            const cargoItem =
              item.executado_por_role_label ||
              item.executado_por_role ||
              "Sistema";
            const dataItem =
              formatarDataHoraPtBr(item.created_at) || item.tempo_atras || "";

            return (
              <div
                key={item.id_registro_acao ?? `${item.acao}-${idx}`}
                className="historico-acoes-timeline-item"
              >
                <div className="text-dark fw-medium lh-sm">
                  {item.descricao}
                </div>
                <div className="text-muted d-flex flex-wrap align-items-center gap-1 mt-0.5">
                  <strong className="text-secondary">
                    {item.executado_por_nome || "Sistema"}
                  </strong>
                  <span>({cargoItem})</span>
                  {dataItem && <span>• {dataItem}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
