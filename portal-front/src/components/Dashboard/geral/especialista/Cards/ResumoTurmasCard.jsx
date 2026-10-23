import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

/**
 * ResumoTurmasCard.jsx - Painel Gráfico de Médias e Frequências por Turma (Recharts)
 *
 * Papel Didático:
 * Renderiza dois gráficos de barras horizontais lado a lado em proporção simétrica (50% / 50%):
 * 1. Card Esquerdo: Média de Notas por Turma (escala 0 a 10), com barras azul marinho profundo (#164483);
 * 2. Card Direito: Taxa de Presença (Frequência) por Turma (escala 0% a 100%).
 * Inclui badges de contextualização no cabeçalho e labels de valor posicionados à direita das barras.
 */
export default function GeralMediumCards({
  medias = [],
  frequencias = [],
  loading = false,
  error = null,
}) {
  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando gráficos das turmas...</span>
        </div>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error) {
    return (
      <div className="alert alert-danger rounded-3 my-3" role="alert">
        Erro ao carregar o resumo gráfico das turmas: {error}
      </div>
    );
  }

  // Prepara os dados de médias (arredondado com 1 casa decimal)
  const dadosMedias = medias.map((item) => ({
    id: item.id,
    turma: item.turma,
    nota: item.nota !== null && item.nota !== undefined ? Number(item.nota) : 0,
    notaFormatada:
      item.nota !== null && item.nota !== undefined
        ? Number(item.nota).toFixed(1).replace(".", ",")
        : "0,0",
  }));

  // Prepara os dados de frequência (percentual inteiro)
  const dadosFrequencias = frequencias.map((item) => ({
    id: item.id,
    turma: item.turma,
    percentual:
      item.percentual !== null && item.percentual !== undefined
        ? Number(item.percentual)
        : 0,
    percentualFormatado: `${
      item.percentual !== null && item.percentual !== undefined
        ? Math.round(Number(item.percentual))
        : 0
    }%`,
  }));

  // Altura proporcional dinâmica para comportar as barras confortavelmente
  const alturaGraficoMedias = Math.max(220, dadosMedias.length * 62);
  const alturaGraficoFrequencias = Math.max(220, dadosFrequencias.length * 62);

  return (
    <div className="row g-4 my-2">
      {/* Card 1: Média de Notas por Turma (col-lg-6 = 50%) */}
      <div className="col-12 col-lg-6">
        <div className="geral-chart-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="geral-chart-title mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-bell text-primary fs-5"></i>
              <span>Média de Notas por Turma</span>
            </h5>
            <span className="geral-chart-badge">Escala 0 a 10</span>
          </div>

          {/* 3. Estado Assíncrono: Vazio */}
          {dadosMedias.length === 0 ? (
            <p className="text-muted small mb-0 py-4 text-center">
              Nenhuma turma encontrada no momento.
            </p>
          ) : (
            <div style={{ width: "100%", height: `${alturaGraficoMedias}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosMedias}
                  margin={{ top: 12, right: 38, left: 10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4edf7" />
                  <XAxis
                    type="number"
                    domain={[0, 10]}
                    tickCount={6}
                    stroke="#9cb1ce"
                    tick={{ fontSize: 11, fill: "#4a5d7c" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="turma"
                    width={140}
                    stroke="#9cb1ce"
                    tick={{ fontSize: 11, fill: "#1c3d70" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)} pts`, "Média Geral"]}
                    contentStyle={{ borderRadius: "10px", borderColor: "#d9e5f5" }}
                  />
                  {/* Barra azul marinho elegante com extremidades arredondadas e valor ao final */}
                  <Bar
                    dataKey="nota"
                    name="Média da Turma"
                    fill="#174584"
                    radius={[10, 10, 10, 10]}
                    barSize={20}
                  >
                    <LabelList
                      dataKey="notaFormatada"
                      position="right"
                      fill="#0f2b5c"
                      fontSize={13}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Frequência por Turma (col-lg-6 = 50%) */}
      <div className="col-12 col-lg-6">
        <div className="geral-chart-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="geral-chart-title mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-primary fs-5"></i>
              <span>Frequência por Turma</span>
            </h5>
            <span className="geral-chart-badge">Meta mín. 75%</span>
          </div>

          {/* 3. Estado Assíncrono: Vazio */}
          {dadosFrequencias.length === 0 ? (
            <p className="text-muted small mb-0 py-4 text-center">
              Sem dados de frequência no momento.
            </p>
          ) : (
            <div style={{ width: "100%", height: `${alturaGraficoFrequencias}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosFrequencias}
                  margin={{ top: 12, right: 42, left: 10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4edf7" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(val) => `${val}%`}
                    stroke="#9cb1ce"
                    tick={{ fontSize: 11, fill: "#4a5d7c" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="turma"
                    width={140}
                    stroke="#9cb1ce"
                    tick={{ fontSize: 11, fill: "#1c3d70" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Taxa de Presença"]}
                    contentStyle={{ borderRadius: "10px", borderColor: "#d9e5f5" }}
                  />
                  {/* Barra horizontal Recharts com rótulo percentual destacado à direita */}
                  <Bar
                    dataKey="percentual"
                    name="Presença"
                    fill="#174584"
                    radius={[10, 10, 10, 10]}
                    barSize={20}
                  >
                    <LabelList
                      dataKey="percentualFormatado"
                      position="right"
                      fill="#0f2b5c"
                      fontSize={13}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}