export default function MediumCard({ 
  itensVisiveis // Agora deve receber todas as matérias de uma vez
}) {
  // 1. Calcular o total de pontos
  const totalPontos = itensVisiveis.reduce((acc, item) => acc + item.pontos, 0);

  // 2. Lógica matemática para construir as fatias do SVG
  let startAngle = -Math.PI / 2; // Iniciar do topo (12 horas)

  const fatias = itensVisiveis.map((item) => {
    const proporcao = totalPontos > 0 ? item.pontos / totalPontos : 0;
    const sliceAngle = proporcao * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Centro e Raio do SVG
    const cx = 100;
    const cy = 100;
    const r = 100;

    // Coordenadas dos arcos
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    // Desenho do Path (círculo completo caso seja 100%, ou fatias)
    const pathData = proporcao === 1 
      ? `M ${cx}, ${cy - r} A ${r},${r} 0 1,1 ${cx}, ${cy + r} A ${r},${r} 0 1,1 ${cx}, ${cy - r}`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    // Posição para desenhar o texto (pontuação) dentro da fatia
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = r * 0.65; // Distância do centro até o texto
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);

    startAngle = endAngle;

    return { ...item, pathData, labelX, labelY, proporcao };
  });

  return (
    <div
      className="card border-0 shadow-sm rounded-4 p-4 pb-4 mt-4 position-relative w-100 h-100"
      style={{
        background: '#f7f7f7',
        minHeight: '0',
        border: '2px solid rgba(214, 0, 110, 0.35)',
        boxShadow: '0 0 0 1px rgba(214, 0, 110, 0.05)',
      }}
    >
      <h5 className="fw-bold mb-4 text-dark text-center" style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>
        Boletim Detalhado (Total de Pontos Acumulados)
      </h5>

      {/* Container Flex para emular a imagem: Gráfico à esquerda, Legenda à direita */}
      <div className="d-flex flex-row align-items-center justify-content-center gap-5 w-100 h-100 flex-wrap">
        
        {/* Gráfico SVG */}
        <div style={{ width: '280px', height: '280px' }}>
          <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
            {fatias.map((fatia) => (
              <g key={fatia.id}>
                <path 
                  d={fatia.pathData} 
                  fill={fatia.cor} 
                  stroke="#ffffff" // Borda branca entre as fatias
                  strokeWidth="2"
                />
                {/* Renderiza o texto do número natural apenas se a fatia for grande o suficiente */}
                {fatia.proporcao > 0.05 && (
                  <text 
                    x={fatia.labelX} 
                    y={fatia.labelY} 
                    fill="#ffffff" 
                    fontSize="14" 
                    fontWeight="bold"
                    textAnchor="middle" 
                    alignmentBaseline="middle"
                  >
                    {fatia.pontos}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legenda (Matéria e Cor) */}
        <div className="d-flex flex-column gap-2">
          {itensVisiveis.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: item.cor,
                  borderRadius: '50%' // Bolinha igual à referência
                }}
              />
              <span className="text-dark fw-medium" style={{ fontSize: '0.95rem' }}>
                {item.materia}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}