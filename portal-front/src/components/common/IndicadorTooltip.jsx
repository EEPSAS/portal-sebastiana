import { useId, useState, useEffect, useRef } from "react";
import "./IndicadorTooltip.css";

/**
 * IndicadorTooltip.jsx - Balão Informativo Explicativo para Indicadores Escolares
 *
 * Papel Didático:
 * Encapsula o ícone de um indicador (KPI), exibindo um balão explicativo Dark Navy
 * com as regras de cálculo e diretrizes pedagógicas ao passar o mouse (desktop),
 * focar via teclado (acessibilidade) ou tocar na tela (dispositivos móveis).
 */
export default function IndicadorTooltip({
  titulo,
  texto,
  children,
  posicao = "top",
}) {
  const [ativo, setAtivo] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef(null);

  // Fecha o balão ao clicar fora em telas de toque (mobile/tablet)
  useEffect(() => {
    if (!ativo) return;

    function handleClickFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAtivo(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAtivo(false);
      }
    }

    document.addEventListener("click", handleClickFora);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickFora);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ativo]);

  // Se não houver texto descritivo informado, apenas renderiza os filhos sem tooltip
  if (!texto) {
    return children;
  }

  const handleToggle = (e) => {
    // Permite alternar via toque ou clique sem disparar links/botões pais
    e.stopPropagation();
    setAtivo((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`indicador-tooltip-container indicador-tooltip-container--${posicao} ${
        ativo ? "is-ativo" : ""
      }`}
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={ativo}
      aria-describedby={tooltipId}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle(e);
        }
      }}
    >
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className="indicador-tooltip-balao"
        aria-hidden={!ativo}
      >
        {titulo && <span className="indicador-tooltip-titulo">{titulo}</span>}
        <span className="indicador-tooltip-texto">{texto}</span>
      </div>
    </div>
  );
}
