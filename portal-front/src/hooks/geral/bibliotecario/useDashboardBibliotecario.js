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
 * Carrega o histórico global autorizado pela API e prepara os recortes do painel.
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
  const contagemDoMes = emprestimos.reduce((contagem, emprestimo) => {
    const dataRetirada = emprestimo.data_emprestimo?.slice(0, 7);
    const livro = emprestimo.livro;
    if (dataRetirada !== mesAtual || !livro) return contagem;

    const chave = livro.id_livro || livro.id || livro.titulo;
    const registro = contagem.get(chave) || {
      livro,
      total: 0,
    };
    registro.total += 1;
    contagem.set(chave, registro);
    return contagem;
  }, new Map());

  const destaqueDoMes = [...contagemDoMes.values()].sort(
    (a, b) => b.total - a.total || a.livro.titulo.localeCompare(b.livro.titulo)
  )[0] || null;

  return {
    quantidadeAtiva: emprestimos.filter((emprestimo) =>
      STATUS_ATIVOS.includes(emprestimo.status)
    ).length,
    devolucoesEmAtraso: vencidos,
    devolucoesHoje: vencemHoje,
    devolucoesProximosDias: vencemProximosDias,
    devolucoesRecentes: devolvidos,
    destaqueDoMes,
    mesAtual: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(agora),
    formatarData: formatarDataBiblioteca,
    loading,
    error,
  };
}
