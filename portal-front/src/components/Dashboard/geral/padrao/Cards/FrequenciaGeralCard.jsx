import { Link } from "react-router";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import IndicadorTooltip from "../../../../common/IndicadorTooltip";
import { DESCRICOES_INDICADORES } from "../../../../common/descricoesIndicadores";

/**
 * FrequenciaGeralCard.jsx - Indicador de Frequência do Estudante com Recharts
 *
 * Papel Didático:
 * Constrói o indicador circular de frequência escolar em formato Donut a partir do percentual
 * real apurado sobre as chamadas/diário da turma, sem assumir valor fictício padrão.
 */
export default function FrequenciaGeralCard({
  porcentagem = 0,
  classificacao = "Sem registros",
  bgColor = "var(--dashboard-pink)",
}) {
  const valorSeguro = Math.max(0, Math.min(100, Number(porcentagem) || 0));

  // Prepara os dados para o gráfico de Rosca (Donut) do Recharts
  const data = [
    { name: "Frequência", value: valorSeguro },
    { name: "Restante", value: Math.max(0, 100 - valorSeguro) },
  ];

  // Cores: fatia ativa em branco puro, fatia restante translúcida
  const COLORS = ["var(--dashboard-white)", "rgba(var(--dashboard-white-rgb), 0.28)"];

  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="student-overview__metric-card card h-100 w-100 border-0 shadow-sm rounded-3 text-white p-2 px-md-3 d-flex flex-row align-items-center justify-content-between"
        style={{
          backgroundColor: bgColor,
        }}
      >
        <div className="d-flex align-items-center min-w-0">
          {/* Gráfico Circular Recharts com balão explicativo Dark Navy projetando para dentro */}
          <IndicadorTooltip
            titulo={DESCRICOES_INDICADORES.aluno_frequencia.titulo}
            texto={DESCRICOES_INDICADORES.aluno_frequencia.texto}
          >
            <div
              style={{ width: "86px", height: "86px", position: "relative" }}
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={36}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </IndicadorTooltip>

          {/* Textos informativos de frequência */}
          <div className="ms-2 ms-md-3 d-flex flex-column justify-content-center min-w-0">
            <span
              className="fw-semibold text-white-50 text-uppercase small text-truncate"
              style={{ fontSize: "0.78rem", letterSpacing: "0.5px" }}
            >
              Frequência Geral
            </span>
            <span className="fw-bold fs-2 lh-1 my-1 text-white">{valorSeguro}%</span>
            <span className="text-white-50 small fw-medium text-truncate">{classificacao}</span>
          </div>
        </div>

        {/* Botão de aprofundamento para o Boletim na extrema direita */}
        <Link
          to="/dashboard/boletim"
          className="geral-kpi-arrow-btn geral-kpi-arrow-btn--light ms-2 flex-shrink-0"
          aria-label="Abrir Frequência Detalhada no Boletim"
          title="Abrir Frequência Detalhada no Boletim"
        >
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    </div>
  );
}
