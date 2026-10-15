import { useState } from "react";
import { BarChart, Bar, ResponsiveContainer, YAxis, Tooltip } from "recharts";

/**
 * DesempenhoDisciplinasCard.jsx - Painel de Desempenho por Disciplina ou Frequência
 *
 * Papel Didático:
 * Atende aos requisitos 2.2 e 2.2.1:
 * - Alternador entre visualização por 'Disciplina' (notas) e por 'Frequência'.
 * - Exibe blocos Top 3 Melhores e Top 3 Piores com barras Recharts integradas.
 * - Utiliza Recharts (BarChart horizontal) em cada item para renderizar visualmente a barra de progresso.
 */

// Componente didático para a mini-barra Recharts horizontal
function MiniProgressBar({ valor, max = 10, cor = "#10b981", sufixo = "" }) {
  const chartData = [{ name: "progresso", valor, restante: Math.max(0, max - valor) }];

  return (
    <div style={{ width: "100%", height: "8px" }} className="mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            formatter={(val) => [`${val}${sufixo}`, "Valor"]}
            contentStyle={{ borderRadius: "8px", fontSize: "0.75rem", padding: "4px 8px" }}
          />
          <Bar dataKey="valor" stackId="a" fill={cor} radius={[4, 4, 4, 4]} />
          <Bar dataKey="restante" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DesempenhoDisciplinasCard({ dadosDisciplinas, dadosFrequencias }) {
  const [visaoAtiva, setVisaoAtiva] = useState("disciplina"); // 'disciplina' ou 'frequencia'

  // Dados padrão mockados para Disciplinas (Notas)
  const topMelhoresNotas = dadosDisciplinas?.melhores || [
    { posicao: 1, nome: "Língua Portuguesa", valor: 9.8, cor: "#10b981", corBadge: "#10b981" },
    { posicao: 2, nome: "História", valor: 9.5, cor: "#3b82f6", corBadge: "#3b82f6" },
    { posicao: 3, nome: "Biologia", valor: 9.2, cor: "#8b5cf6", corBadge: "#8b5cf6" },
  ];

  const topPioresNotas = dadosDisciplinas?.piores || [
    { posicao: 1, nome: "Matemática", valor: 5.6, cor: "#ef4444", corBadge: "#ef4444" },
    { posicao: 2, nome: "Inglês", valor: 6.3, cor: "#f59e0b", corBadge: "#f59e0b" },
    { posicao: 3, nome: "Química", valor: 6.8, cor: "#06b6d4", corBadge: "#06b6d4" },
  ];

  // Dados padrão mockados para Frequências
  const topMelhoresFreq = dadosFrequencias?.melhores || [
    { posicao: 1, nome: "Educação Física", valor: 100, cor: "#10b981", corBadge: "#10b981" },
    { posicao: 2, nome: "Artes", valor: 98, cor: "#3b82f6", corBadge: "#3b82f6" },
    { posicao: 3, nome: "Geografia", valor: 96, cor: "#8b5cf6", corBadge: "#8b5cf6" },
  ];

  const topPioresFreq = dadosFrequencias?.piores || [
    { posicao: 1, nome: "Filosofia", valor: 76, cor: "#ef4444", corBadge: "#ef4444" },
    { posicao: 2, nome: "Física", valor: 80, cor: "#f59e0b", corBadge: "#f59e0b" },
    { posicao: 3, nome: "Sociologia", valor: 84, cor: "#06b6d4", corBadge: "#06b6d4" },
  ];

  const isNotas = visaoAtiva === "disciplina";
  const listaMelhores = isNotas ? topMelhoresNotas : topMelhoresFreq;
  const listaPiores = isNotas ? topPioresNotas : topPioresFreq;
  const maxEscala = isNotas ? 10 : 100;
  const sufixo = isNotas ? "" : "%";

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
      {/* Cabeçalho do Card com Seletor Disciplina vs Frequência */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "#eff6ff", width: "42px", height: "42px" }}
          >
            <i className="bi bi-bar-chart-line-fill fs-5"></i>
          </div>
          <div>
            <h3 className="fs-5 fw-bold mb-0 text-dark">
              {isNotas ? "Desempenho por Disciplina" : "Desempenho por Frequência"}
            </h3>
            <p className="text-secondary small mb-0">
              {isNotas
                ? "Acompanhe suas melhores e piores notas nas disciplinas."
                : "Acompanhe seus índices de presença por componente curricular."}
            </p>
          </div>
        </div>

        {/* Botões de Alternância: Disciplina | Frequência */}
        <div className="btn-group p-1 bg-light rounded-pill border">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-semibold transition ${
              isNotas ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
            }`}
            onClick={() => setVisaoAtiva("disciplina")}
          >
            Disciplina
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-semibold transition ${
              !isNotas ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
            }`}
            onClick={() => setVisaoAtiva("frequencia")}
          >
            Frequência
          </button>
        </div>
      </div>

      {/* Seção 1: Top 3 - Melhores */}
      <div className="mb-4">
        <h4 className="fw-bold fs-6 text-dark mb-3">
          {isNotas ? "Top 3 - Melhores Notas" : "Top 3 - Melhores Frequências"}
        </h4>
        <div className="row g-3">
          {listaMelhores.map((item) => (
            <div key={`melhor-${item.posicao}`} className="col-12 col-md-4">
              <div
                className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span
                    className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "32px", height: "32px", backgroundColor: item.corBadge, fontSize: "0.85rem" }}
                  >
                    {item.posicao}
                  </span>
                  <div className="overflow-hidden">
                    <span className="d-block small text-secondary fw-semibold text-truncate">
                      {item.nome}
                    </span>
                    <span className="fw-bold fs-5 text-dark lh-1">
                      {String(item.valor).replace(".", ",")}{sufixo}
                    </span>
                  </div>
                </div>

                <MiniProgressBar valor={item.valor} max={maxEscala} cor={item.cor} sufixo={sufixo} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção 2: Top 3 - Piores / Atenção */}
      <div>
        <h4 className="fw-bold fs-6 text-dark mb-3">
          {isNotas ? "Top 3 - Piores Notas" : "Top 3 - Menores Frequências"}
        </h4>
        <div className="row g-3">
          {listaPiores.map((item) => (
            <div key={`pior-${item.posicao}`} className="col-12 col-md-4">
              <div
                className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span
                    className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "32px", height: "32px", backgroundColor: item.corBadge, fontSize: "0.85rem" }}
                  >
                    {item.posicao}
                  </span>
                  <div className="overflow-hidden">
                    <span className="d-block small text-secondary fw-semibold text-truncate">
                      {item.nome}
                    </span>
                    <span className="fw-bold fs-5 text-dark lh-1">
                      {String(item.valor).replace(".", ",")}{sufixo}
                    </span>
                  </div>
                </div>

                <MiniProgressBar valor={item.valor} max={maxEscala} cor={item.cor} sufixo={sufixo} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
