export const STATUS_ATIVOS = ["aprovado", "renovado", "atrasado"];

const formatarDataISO = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

/** Formata datas da API sem deslocá-las por causa do fuso horário local. */
export const formatarDataBiblioteca = (valor) => {
  if (!valor) return "Data não informada";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(ano, mes - 1, dia)
  );
};

/** Separa empréstimos ativos pelo prazo, considerando hoje e os três dias seguintes. */
export function classificarEmprestimosAtivos(
  emprestimos,
  hojeISO = formatarDataISO(new Date())
) {
  const limiteProximosDias = new Date(`${hojeISO}T00:00:00`);
  limiteProximosDias.setDate(limiteProximosDias.getDate() + 3);
  const limiteISO = formatarDataISO(limiteProximosDias);

  const ativos = emprestimos.filter((emprestimo) =>
    STATUS_ATIVOS.includes(emprestimo.status)
  );
  const vencidos = [];
  const vencemHoje = [];
  const vencemProximosDias = [];

  ativos.forEach((emprestimo) => {
    const prazo = emprestimo.data_prevista_devolucao?.slice(0, 10);

    if (emprestimo.status === "atrasado" || (prazo && prazo < hojeISO)) {
      vencidos.push(emprestimo);
    } else if (prazo === hojeISO) {
      vencemHoje.push(emprestimo);
    } else if (prazo && prazo > hojeISO && prazo <= limiteISO) {
      vencemProximosDias.push(emprestimo);
    }
  });

  const ordenarPorPrazo = (lista) =>
    lista.sort((a, b) =>
      String(a.data_prevista_devolucao || "9999-12-31").localeCompare(
        String(b.data_prevista_devolucao || "9999-12-31")
      )
    );

  return {
    vencidos: ordenarPorPrazo(vencidos),
    vencemHoje: ordenarPorPrazo(vencemHoje),
    vencemProximosDias: ordenarPorPrazo(vencemProximosDias),
  };
}
