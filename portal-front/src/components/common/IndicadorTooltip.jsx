import { useId, useState, useEffect, useRef, useCallback } from "react";
import "./IndicadorTooltip.css";

/**
 * IndicadorTooltip.jsx - Balão Informativo Explicativo para Indicadores Escolares
 *
 * Papel Didático:
 * Encapsula o ícone de um indicador (KPI), exibindo um balão explicativo Dark Navy
 * com as regras de cálculo e diretrizes pedagógicas ao passar o mouse (desktop),
 * focar via teclado (acessibilidade) ou tocar na tela (dispositivos móveis).
 *
 * Inteligência de Posicionamento:
 * Calcula a proximidade das bordas do viewport para sempre projetar o balão
 * 'para dentro' da tela, evitando cortes na barra lateral esquerda ou na margem direita.
 */
export default function IndicadorTooltip({
  titulo,
  texto,
  children,
  posicao = "top",
  alinhamentoFixo = null,
}) {
  const [ativo, setAtivo] = useState(false);
  const [alinhamento, setAlinhamento] = useState("start");
  const tooltipId = useId();
  const containerRef = useRef(null);

  // Calcula se o balão deve expandir para a direita (start) ou esquerda (end)
  const ajustarAlinhamento = useCallback(() => {
    if (alinhamentoFixo) {
      setAlinhamento(alinhamentoFixo);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const larguraEstimada = 260;
    const margemSegura = 20;

    // Se estiver a menos de 260px da borda direita da janela, alinha à direita (end)
    if (window.innerWidth - rect.right < larguraEstimada + margemSegura) {
      setAlinhamento("end");
    } else {
      // Por padrão em todos os cards, como os ícones ficam à esquerda,
      // alinhar 'start' garante que o balão se projete para a direita (para dentro do card e da tela)
      setAlinhamento("start");
    }
  }, [alinhamentoFixo]);

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
    ajustarAlinhamento();
    setAtivo((prev) => !prev);
  };

  const handleMouseEnter = () => {
    ajustarAlinhamento();
  };

  return (
    <div
      ref={containerRef}
      className={`indicador-tooltip-container indicador-tooltip-container--${posicao} indicador-tooltip-container--align-${alinhamento} ${
        ativo ? "is-ativo" : ""
      }`}
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={ativo}
      aria-describedby={tooltipId}
      onClick={handleToggle}
      onMouseEnter={handleMouseEnter}
      onFocus={ajustarAlinhamento}
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
