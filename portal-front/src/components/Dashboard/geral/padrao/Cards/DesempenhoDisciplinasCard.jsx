import { useState } from "react";
import { BarChart, Bar, ResponsiveContainer, YAxis, Tooltip } from "recharts";

/**
 * DesempenhoDisciplinasCard.jsx - Painel de Desempenho por Disciplina ou Frequência
 *
 * Papel Didático:
 * Renderiza os rankings Top 3 Melhores e Top 3 Piores calculados no backend sobre as disciplinas
 * reais da turma/ciclo do estudante, exibindo estado vazio orientativo quando ainda não há lançamentos.
 */

// Componente didático para a mini-barra Recharts horizontal
function MiniProgressBar({ valor, max = 10, cor = "var(--dashboard-navy)", sufixo = "" }) {
  const chartData = [{ name: "progresso", valor, restante: Math.max(0, max - valor) }];

  return (
    <div style={{ width: "100%", height: "8px" }} className="mt-1" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            formatter={(val) => [`${val}${sufixo}`, "Valor"]}
            contentStyle={{
              borderRadius: "8px",
              fontSize: "0.75rem",
              padding: "4px 8px",
              backgroundColor: "var(--dashboard-white)",
              color: "var(--dashboard-navy)",
              borderColor: "var(--dashboard-gray-border)",
            }}
          />
          <Bar dataKey="valor" stackId="a" fill={cor} radius={[4, 4, 4, 4]} />
          <Bar dataKey="restante" stackId="a" fill="var(--dashboard-gray-border)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DesempenhoDisciplinasCard({ dadosDisciplinas, dadosFrequencias }) {
  const [visaoAtiva, setVisaoAtiva] = useState("disciplina"); // 'disciplina' ou 'frequencia'

  // Listas estritamente reais vindas da API (sem arrays fictícios de fallback)
  const topMelhoresNotas = dadosDisciplinas?.melhores ?? [];
  const topPioresNotas = dadosDisciplinas?.piores ?? [];
  const topMelhoresFreq = dadosFrequencias?.melhores ?? [];
  const topPioresFreq = dadosFrequencias?.piores ?? [];

  const isNotas = visaoAtiva === "disciplina";
  const listaMelhores = isNotas ? topMelhoresNotas : topMelhoresFreq;
  const listaPiores = isNotas ? topPioresNotas : topPioresFreq;
  const maxEscala = isNotas ? 10 : 100;
  const sufixo = isNotas ? "" : "%";
  const semLancamentosNaAba = listaMelhores.length === 0 && listaPiores.length === 0;

  return (
    <div className="card border-0 shadow-sm rounded-3 p-2 px-md-3 bg-white h-100 w-100">
      {/* Cabeçalho do Card com Seletor Disciplina vs Frequência */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "42px", height: "42px" }}
            aria-hidden="true"
          >
            <i className="bi bi-bar-chart-line-fill fs-5"></i>
          </div>
          <div>
            <h3 className="fs-5 fw-bold mb-0 text-dark">
              {isNotas ? "Desempenho por Disciplina" : "Desempenho por Frequência"}
            </h3>
            <p className="text-secondary small mb-0">
              {isNotas
                ? "Acompanhe suas melhores e piores notas lançadas no período."
                : "Acompanhe seus índices reais de presença por componente curricular."}
            </p>
          </div>
        </div>

        {/* Botões de Alternância com aria-pressed comunicando o estado do controle */}
        <div
          className="btn-group p-1 bg-light rounded-pill border"
          role="group"
          aria-label="Alternar ranking entre notas e frequência"
        >
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-semibold transition ${
              isNotas ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
            }`}
            aria-pressed={isNotas}
            onClick={() => setVisaoAtiva("disciplina")}
          >
            Disciplina
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-semibold transition ${
              !isNotas ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
            }`}
            aria-pressed={!isNotas}
            onClick={() => setVisaoAtiva("frequencia")}
          >
            Frequência
          </button>
        </div>
      </div>

      {semLancamentosNaAba ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3 flex-grow-1">
          <i className="bi bi-journal-check text-secondary fs-2 mb-2" aria-hidden="true"></i>
          <p className="fw-semibold text-dark mb-1">
            {isNotas
              ? "Ainda não há notas registradas neste período"
              : "Ainda não há registros de frequência neste período"}
          </p>
          <p className="text-secondary small mb-0">
            Assim que o diário escolar da sua turma for atualizado, o ranking das disciplinas aparecerá automaticamente aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Seção 1: Top 3 - Melhores */}
          <div className="mb-3">
            <h4 className="fw-bold fs-6 text-dark mb-2">
              {isNotas ? "Top 3 - Melhores Notas" : "Top 3 - Melhores Frequências"}
            </h4>
            <div className="row g-3">
              {listaMelhores.map((item) => (
                <div key={`melhor-${item.posicao}-${item.nome}`} className="col-12 col-md-4">
                  <div
                    className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: "var(--dashboard-gray-soft)",
                      border: "1px solid var(--dashboard-gray-soft)",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <span
                        className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "var(--dashboard-navy)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {item.posicao}
                      </span>
                      <div className="overflow-hidden">
                        <span className="d-block small text-secondary fw-semibold text-truncate">
                          {item.nome}
                        </span>
                        <span className="fw-bold fs-5 text-dark lh-1">
                          {String(item.valor).replace(".", ",")}
                          {sufixo}
                        </span>
                      </div>
                    </div>

                    <MiniProgressBar
                      valor={item.valor}
                      max={maxEscala}
                      cor="var(--dashboard-navy)"
                      sufixo={sufixo}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Top 3 - Menores Índices / Atenção */}
          <div>
            <h4 className="fw-bold fs-6 text-dark mb-2">
              {isNotas ? "Top 3 - Menores Notas" : "Top 3 - Menores Frequências"}
            </h4>
            <div className="row g-3">
              {listaPiores.map((item) => (
                <div key={`pior-${item.posicao}-${item.nome}`} className="col-12 col-md-4">
                  <div
                    className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                    style={{
                      backgroundColor: "var(--dashboard-gray-soft)",
                      border: "1px solid var(--dashboard-gray-soft)",
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <span
                        className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "var(--dashboard-pink)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {item.posicao}
                      </span>
                      <div className="overflow-hidden">
                        <span className="d-block small text-secondary fw-semibold text-truncate">
                          {item.nome}
                        </span>
                        <span className="fw-bold fs-5 text-dark lh-1">
                          {String(item.valor).replace(".", ",")}
                          {sufixo}
                        </span>
                      </div>
                    </div>

                    <MiniProgressBar
                      valor={item.valor}
                      max={maxEscala}
                      cor="var(--dashboard-pink)"
                      sufixo={sufixo}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
