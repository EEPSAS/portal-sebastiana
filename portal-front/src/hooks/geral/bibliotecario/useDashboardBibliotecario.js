import { useEffect, useState } from "react";
import { listarEmprestimos } from "../../../services/biblioteca/bibliotecaService";
import {
  classificarEmprestimosAtivos,
  formatarDataBiblioteca,
  STATUS_ATIVOS,
} from "./dashboardBibliotecarioUtils.js";

const desempacotarLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

/**
 * Carrega o histórico global autorizado pela API e consolida os indicadores reais da Biblioteca,
 * incluindo o Destaque do Mês e o Top 3 de obras mais emprestadas no histórico do acervo.
 */
export function useDashboardBibliotecario() {
  const [emprestimos, setEmprestimos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const carregarEmprestimos = async () => {
      try {
        setLoading(true);
        setError("");
        const resposta = await listarEmprestimos({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setEmprestimos(desempacotarLista(resposta));
        }
      } catch (erro) {
        if (erro.name !== "AbortError" && !controller.signal.aborted) {
          setError(erro.message || "Não foi possível carregar os empréstimos.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    carregarEmprestimos();
    return () => controller.abort();
  }, []);

  const { vencidos, vencemHoje, vencemProximosDias } =
    classificarEmprestimosAtivos(emprestimos);

  const devolvidos = emprestimos
    .filter((emprestimo) => emprestimo.status === "devolvido")
    .sort((a, b) =>
      String(b.data_devolucao_real || "").localeCompare(
        String(a.data_devolucao_real || "")
      )
    )
    .slice(0, 5);

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}`;

  // Consolida simultaneamente o destaque mensal e o Top 3 histórico sobre os empréstimos reais
  const contagemDoMes = new Map();
  const contagemHistorica = new Map();

  for (const emprestimo of emprestimos) {
    const livro = emprestimo.livro;
    if (!livro?.titulo) continue;

    const chave = livro.id_livro || livro.id || livro.titulo;

    // 1. Acúmulo histórico para o Top 3 de livros mais emprestados
    const itemHistorico = contagemHistorica.get(chave) || {
      livro_id: chave,
      titulo: livro.titulo,
      autor: livro.autor || "Autor não informado",
      capa_url: livro.capa_url || livro.capa || null,
      total_emprestimos: 0,
    };
    itemHistorico.total_emprestimos += 1;
    contagemHistorica.set(chave, itemHistorico);

    // 2. Acúmulo restrito ao mês corrente para o Destaque do Mês
    const dataRetirada = emprestimo.data_emprestimo?.slice(0, 7);
    if (dataRetirada === mesAtual) {
      const registroMes = contagemDoMes.get(chave) || {
        livro,
        total: 0,
      };
      registroMes.total += 1;
      contagemDoMes.set(chave, registroMes);
    }
  }

  const destaqueDoMes =
    [...contagemDoMes.values()].sort(
      (a, b) => b.total - a.total || a.livro.titulo.localeCompare(b.livro.titulo, "pt-BR")
    )[0] || null;

  const topLivros = [...contagemHistorica.values()]
    .sort(
      (a, b) =>
        b.total_emprestimos - a.total_emprestimos ||
        a.titulo.localeCompare(b.titulo, "pt-BR")
    )
    .slice(0, 3);

  return {
    quantidadeAtiva: emprestimos.filter((emprestimo) =>
      STATUS_ATIVOS.includes(emprestimo.status)
    ).length,
    devolucoesEmAtraso: vencidos,
    devolucoesHoje: vencemHoje,
    devolucoesProximosDias: vencemProximosDias,
    devolucoesRecentes: devolvidos,
    destaqueDoMes,
    topLivros,
    mesAtual: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(agora),
    formatarData: formatarDataBiblioteca,
    loading,
    error,
  };
}
