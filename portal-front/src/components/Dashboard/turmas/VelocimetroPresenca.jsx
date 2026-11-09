import { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

/**
 * VelocimetroPresenca.jsx - Manômetro / Velocímetro Semicircular de Absenteísmo (Recharts)
 *
 * Papel Didático:
 * 1. Utiliza PieChart semicircular do Recharts (startAngle=180 -> esquerda, endAngle=0 -> direita)
 *    para representar a média de faltas da turma em uma escala de 0% a 25% (teto legal LDB).
 * 2. Progressão cromática exata ao longo do arco (20 segmentos de 5% do mostrador):
 *    - 0% a 40% do gráfico: Verde (frequência excelente, 0% de faltas na extrema esquerda);
 *    - 40% a 50% do gráfico: Transição esverdeada / lima;
 *    - 50% a 65% do gráfico (da metade pra frente): Amarelo de atenção;
 *    - 65% a 75% do gráfico: Transição alaranjada;
 *    - 75% a 100% do gráfico: Vermelho crítico (>= ~19-20% de faltas).
 * 3. Ponteiro animado por transição SVG/CSS ou requestAnimationFrame, subindo de 0%
 *    até a marca real de faltas com easing orgânico.
 */

// 20 segmentos iguais (5% do arco cada) formando o degradê contínuo de risco de faltas
const SEGMENTOS_ARCO = [
  // 0% a 40% do arco (8 fatias): Verde saudável
  { id: "s1", valor: 5, cor: "#15803d" },
  { id: "s2", valor: 5, cor: "#16a34a" },
  { id: "s3", valor: 5, cor: "#16a34a" },
  { id: "s4", valor: 5, cor: "#22c55e" },
  { id: "s5", valor: 5, cor: "#22c55e" },
  { id: "s6", valor: 5, cor: "#22c55e" },
  { id: "s7", valor: 5, cor: "#34d399" },
  { id: "s8", valor: 5, cor: "#4ade80" },
  // 40% a 50% do arco (2 fatias): Vai esverdeando / clareando rumo à metade
  { id: "s9", valor: 5, cor: "#84cc16" },
  { id: "s10", valor: 5, cor: "#a3e635" },
  // 50% a 65% do arco (3 fatias - da metade pra frente): Amarelo
  { id: "s11", valor: 5, cor: "#facc15" },
  { id: "s12", valor: 5, cor: "#eab308" },
  { id: "s13", valor: 5, cor: "#f59e0b" },
  // 65% a 75% do arco (2 fatias): Vai laranjando
  { id: "s14", valor: 5, cor: "#fb923c" },
  { id: "s15", valor: 5, cor: "#f97316" },
  // 75% a 100% do arco (5 fatias): Vermelhando até crítico
  { id: "s16", valor: 5, cor: "#ef4444" },
  { id: "s17", valor: 5, cor: "#dc2626" },
  { id: "s18", valor: 5, cor: "#dc2626" },
  { id: "s19", valor: 5, cor: "#b91c1c" },
  { id: "s20", valor: 5, cor: "#991b1b" },
];

const TETO_ESCALA_FALTAS = 25; // 25% de faltas preenche 100% do mostrador (limite legal LDB)

export default function VelocimetroPresenca({ taxaFaltas = 0, className = "" }) {
  const taxaAlvo = Math.max(0, Math.min(100, Number(taxaFaltas) || 0));
  const [taxaAnimada, setTaxaAnimada] = useState(0);

  // Animação fluida da agulha subindo do 0% até a marca real da turma
  useEffect(() => {
    let frameId;
    const duracaoMs = 850;
    const inicio = performance.now();
    const valorInicial = 0;

    const animar = (agora) => {
      const decorrido = agora - inicio;
      const progresso = Math.min(1, decorrido / duracaoMs);
      // Easing suave (easeOutCubic)
      const ease = 1 - Math.pow(1 - progresso, 3);
      const valorAtual = valorInicial + (taxaAlvo - valorInicial) * ease;

      setTaxaAnimada(valorAtual);

      if (progresso < 1) {
        frameId = requestAnimationFrame(animar);
      }
    };

    frameId = requestAnimationFrame(animar);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [taxaAlvo]);

  const taxa = taxaAnimada;

  // Proporção no arco de 0 (0% faltas -> extrema esquerda) até 1 (25%+ faltas -> extrema direita)
  const proporcaoArco = Math.min(1, taxa / TETO_ESCALA_FALTAS);

  // Ângulo polar: 180° = esquerda (0% faltas = ótimo) | 90° = meio (12.5% faltas) | 0° = direita (25%+ faltas)
  const anguloGraus = 180 - proporcaoArco * 180;
  const rad = (anguloGraus * Math.PI) / 180;

  // Coordenadas geométricas idênticas ao centro do PieChart para alinhamento exato
  const cx = 110;
  const cy = 100;
  const comprimentoAgulha = 60;

  // Matemática correta: cos(180°) = -1 => cx + (-60) = esquerda (Verde!)
  const agulhaX = cx + comprimentoAgulha * Math.cos(rad);
  const agulhaY = cy - comprimentoAgulha * Math.sin(rad);

  // Classificação semântica baseada na taxa alvo oficial da turma
  const proporcaoAlvo = Math.min(1, taxaAlvo / TETO_ESCALA_FALTAS);
  let corDestaque = "#16a34a";
  let statusLabel = "Frequência Ótima";
  let badgeClass = "bg-success-subtle text-success border border-success-subtle";

  if (proporcaoAlvo >= 0.75) {
    corDestaque = "#dc2626";
    statusLabel = "Crítico (≥ 20% faltas)";
    badgeClass = "bg-danger-subtle text-danger border border-danger-subtle";
  } else if (proporcaoAlvo >= 0.65) {
    corDestaque = "#ea580c";
    statusLabel = "Alerta Elevado";
    badgeClass = "bg-warning-subtle text-danger-emphasis border border-warning-subtle";
  } else if (proporcaoAlvo >= 0.5) {
    corDestaque = "#ca8a04";
    statusLabel = "Atenção (Média de Faltas)";
    badgeClass = "bg-warning-subtle text-dark border border-warning-subtle";
  }

  return (
    <div className={`velocimetro-container text-center ${className}`.trim()}>
      <div className="small fw-bold text-secondary mb-1 d-flex align-items-center justify-content-center gap-1">
        <i className="bi bi-speedometer2 text-primary"></i>
        <span>Média de Faltas</span>
      </div>

      {/* Mostrador Semicircular Recharts + Agulha Sincronizada */}
      <div
        className="position-relative d-inline-block mx-auto"
        style={{ width: 220, height: 118 }}
        role="img"
        aria-label={`Velocímetro de faltas da turma: ${taxa.toFixed(1)}%`}
      >
        <PieChart width={220} height={118}>
          <Pie
            data={SEGMENTOS_ARCO}
            cx={cx}
            cy={cy}
            startAngle={180}
            endAngle={0}
            innerRadius={52}
            outerRadius={74}
            paddingAngle={0}
            dataKey="valor"
            stroke="none"
            isAnimationActive={false}
          >
            {SEGMENTOS_ARCO.map((seg) => (
              <Cell key={seg.id} fill={seg.cor} />
            ))}
          </Pie>
        </PieChart>

        {/* Camada do ponteiro e rótulos da escala sobre o mesmo pivô (cx=110, cy=100) */}
        <svg
          viewBox="0 0 220 118"
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ pointerEvents: "none" }}
        >
          {/* Marcações de referência: 0% (esquerda verde), 12.5% (meio amarelo), 25%+ (direita vermelho) */}
          <text x="28" y="114" fontSize="10" fill="#15803d" fontWeight="700" textAnchor="middle">
            0%
          </text>
          <text x="110" y="18" fontSize="9.5" fill="#ca8a04" fontWeight="700" textAnchor="middle">
            12.5%
          </text>
          <text x="192" y="114" fontSize="10" fill="#dc2626" fontWeight="700" textAnchor="middle">
            25%+
          </text>

          {/* Haste da agulha indicadora */}
          <line
            x1={cx}
            y1={cy}
            x2={agulhaX}
            y2={agulhaY}
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Eixo central do manômetro */}
          <circle cx={cx} cy={cy} r="7" fill="#0f172a" />
          <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
        </svg>
      </div>

      {/* Porcentagem em destaque (mesmo peso visual do Donut superior) */}
      <div className="mt-1">
        <span
          className="d-block fw-bolder fs-3"
          style={{ color: corDestaque, lineHeight: 1.1 }}
        >
          {taxa.toFixed(1)}%
        </span>
        <small className="text-muted fw-semibold d-block mb-2" style={{ fontSize: "0.74rem" }}>
          Absenteísmo da Turma
        </small>
        <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${badgeClass}`} style={{ fontSize: "0.72rem" }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
