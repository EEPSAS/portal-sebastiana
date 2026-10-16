import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Separa melhores e pontos de atenção sem repetir uma matéria nos dois grupos.
const obterDestaques = (disciplinas, chave) => {
  const ordenadas = disciplinas
    .filter((disciplina) => disciplina[chave] !== null)
    .sort((a, b) => b[chave] - a[chave]);
  const quantidade = Math.min(3, Math.ceil(ordenadas.length / 2));
  const melhores = ordenadas.slice(0, quantidade);
  const idsMelhores = new Set(melhores.map((disciplina) => disciplina.id));
  const atencao = [...ordenadas]
    .reverse()
    .filter((disciplina) => !idsMelhores.has(disciplina.id))
    .slice(0, 3);

  return [
    ...melhores.map((disciplina) => ({
      nome: disciplina.nome,
      valor: disciplina[chave],
      tipo: "Destaque",
    })),
    ...atencao.map((disciplina) => ({
      nome: disciplina.nome,
      valor: disciplina[chave],
      tipo: "Atenção",
    })),
  ];
};

const formatarValor = (valor, sufixo = "") =>
  `${Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}${sufixo}`;

const GraficoDesempenho = ({ titulo, descricao, dados, maximo, unidade }) => (
  <section className="boletim__card h-100" aria-label={titulo}>
    <div className="boletim__card-heading">
      <i className="bi bi-bar-chart-line-fill" aria-hidden="true" />
      <h2 className="h6 mb-0">{titulo}</h2>
    </div>
    {dados.length ? (
      <div className="boletim__chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 12, right: 12, left: -12, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={dados.length > 4 ? -18 : 0}
              textAnchor={dados.length > 4 ? "end" : "middle"}
              height={dados.length > 4 ? 54 : 36}
            />
            <YAxis
              domain={[0, maximo]}
              ticks={maximo === 10 ? [0, 2, 4, 6, 8, 10] : [0, 25, 50, 75, 100]}
              tick={{ fontSize: 12 }}
              width={42}
              tickFormatter={(valor) => `${valor}${unidade}`}
            />
            <Tooltip
              formatter={(valor, _, item) => [
                formatarValor(valor, unidade),
                item.payload.tipo,
              ]}
              labelFormatter={(nome) => `Disciplina: ${nome}`}
            />
            <Bar dataKey="valor" radius={[5, 5, 0, 0]}>
              {dados.map((item) => (
                <Cell
                  key={`${item.nome}-${item.tipo}`}
                  fill={item.tipo === "Destaque" ? "var(--dashboard-navy)" : "var(--dashboard-amber)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p className="boletim__empty mb-0">
        Ainda não há dados suficientes para montar este gráfico.
      </p>
    )}
    <p className="boletim__caption mb-0">{descricao}</p>
  </section>
);

export default function ResumoAba({ disciplinas }) {
  const dadosNotas = obterDestaques(disciplinas, "mediaFinal");
  const dadosFrequencia = obterDestaques(disciplinas, "frequenciaAnual");

  return (
    <div className="row g-3">
      <div className="col-12">
        <GraficoDesempenho
          titulo="Desempenho geral: melhores notas e pontos de atenção"
          descricao="Comparativo das três melhores médias finais com as disciplinas que merecem atenção."
          dados={dadosNotas}
          maximo={10}
          unidade=""
        />
      </div>
      <div className="col-12">
        <GraficoDesempenho
          titulo="Frequência geral: melhores índices e pontos de atenção"
          descricao="Frequência anual calculada a partir do total de aulas e faltas registrados."
          dados={dadosFrequencia}
          maximo={100}
          unidade="%"
        />
      </div>
    </div>
  );
}
