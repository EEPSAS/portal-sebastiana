import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/**
 * FrequenciaGeralCard.jsx - Indicador de Frequência do Estudante com Recharts
 *
 * Papel Didático:
 * Constrói o indicador circular de frequência geral escolar utilizando Recharts (PieChart em formato Donut).
 * Demonstra como utilizar proporções angulares (94% preenchido em branco, 6% restante translúcido)
 * mantendo alinhamento visual com o gradiente magenta da paleta escolar.
 */
export default function FrequenciaGeralCard({
  porcentagem = 94,
  classificacao = "Ótima",
  bgColor = "var(--dashboard-pink)"
}) {
  // Prepara os dados para o gráfico de Rosca (Donut) do Recharts
  const data = [
    { name: "Frequência", value: porcentagem },
    { name: "Restante", value: Math.max(0, 100 - porcentagem) }
  ];

  // Cores: fatia ativa em branco puro, fatia restante translúcida
  const COLORS = ["var(--dashboard-white)", "rgba(var(--dashboard-white-rgb), 0.28)"];

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 text-white p-2 px-md-3 d-flex flex-row align-items-center"
        style={{
          backgroundColor: bgColor,
        }}
      >
        {/* Gráfico Circular Recharts */}
        <div style={{ width: "95px", height: "95px", position: "relative" }} className="flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={40}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Textos informativos de frequência */}
        <div className="ms-3 d-flex flex-column justify-content-center">
          <span className="fw-semibold text-white-50 text-uppercase small" style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}>
            Frequência Geral
          </span>
          <span className="fw-bold fs-1 lh-1 my-1 text-white">
            {porcentagem}%
          </span>
          <span className="text-white-50 small fw-medium">
            {classificacao}
          </span>
        </div>
      </div>
    </div>
  );
}
