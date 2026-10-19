/**
 * useBiblioteca.js - Hook Customizado de Gestão de Dados da Biblioteca Escolar
 *
 * Papel Didático:
 * Centraliza o estado reativo da biblioteca escolar, integrando o front-end
 * diretamente com a API RESTful do Laravel (`/api/livros`, `/api/emprestimos`)
 * e gerenciando estados assíncronos (carregando, erro e notificações).
 */

import { useEffect, useRef, useState } from 'react';
import {
  hasPortalSession,
  listarLivros,
  cadastrarLivro,
  importarLivrosCSV,
  editarLivro,
  excluirLivro,
  solicitarEmprestimo,
  meusEmprestimos,
} from '../../services/biblioteca/bibliotecaService';

export const useBiblioteca = (termoBusca = '') => {
  // Estado do catálogo de livros físicos e empréstimos
  const [livros, setLivros] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [videoaulas, setVideoaulas] = useState([]);

  // Estados assíncronos obrigatórios (Carregando, Erro e Feedback)
  const [carregandoLivros, setCarregandoLivros] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const [triggerRecarregar, setTriggerRecarregar] = useState(0);

  // Referência para limpar o temporizador anterior caso vários avisos sejam disparados em sequência
  const timeoutAvisoRef = useRef(null);

  /**
   * Dispara aviso flutuante temporário (toast) para feedback imediato ao usuário.
   * Sem uso de useCallback para manter o código direto e alinhado às diretrizes pedagógicas.
   */
  const dispararAviso = (mensagem) => {
    if (timeoutAvisoRef.current) {
      clearTimeout(timeoutAvisoRef.current);
    }
    setNotificacao(mensagem);
    timeoutAvisoRef.current = setTimeout(() => {
      setNotificacao(null);
    }, 3500);
  };

  // Efeito de inicialização, pré-carregamento (5 últimos livros) e busca dinâmica no acervo
  useEffect(() => {
    const controller = new AbortController();

    // Carrega o catálogo público de livros (5 últimos no pré-carregamento ou filtrados por busca)
    const buscarDados = async () => {
      try {
        const buscaLimpa = termoBusca.trim();
        const filtros = buscaLimpa ? { q: buscaLimpa } : { limit: 5 };

        const livrosPromessa = listarLivros(filtros, { signal: controller.signal });
        const emprestimosPromessa = hasPortalSession()
          ? meusEmprestimos({ signal: controller.signal }).catch(() => [])
          : Promise.resolve([]);

        const [resultadoLivros, resultadoEmprestimos] = await Promise.all([
          livrosPromessa,
          emprestimosPromessa,
        ]);

        const listaLivros = Array.isArray(resultadoLivros)
          ? resultadoLivros
          : resultadoLivros?.data ?? [];

        const listaEmprestimos = Array.isArray(resultadoEmprestimos)
          ? resultadoEmprestimos
          : resultadoEmprestimos?.data ?? [];

        // No pré-carregamento (sem busca ativa), garante no máximo 5 livros na lista
        setLivros(buscaLimpa ? listaLivros : listaLivros.slice(0, 5));
        setEmprestimos(listaEmprestimos);
        setErroCarregamento('');
      } catch (error) {
        if (error?.name === 'AbortError') return;

        setErroCarregamento(
          'Não foi possível conectar à API do acervo escolar. Verifique se o servidor local está em execução.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregandoLivros(false);
        }
      }
    };

    buscarDados();

    return () => controller.abort();
  }, [triggerRecarregar, termoBusca]);

  const tentarCarregarBiblioteca = () => {
    setCarregandoLivros(true);
    setErroCarregamento('');
    setTriggerRecarregar((prev) => prev + 1);
  };

  // ================= Operações de Livros Físicos =================

  /**
   * Salva um exemplar no acervo (criação ou atualização).
   */
  const salvarLivro = async (dadosLivro) => {
    try {
      if (dadosLivro.id) {
        const atualizado = await editarLivro(dadosLivro.id, dadosLivro);
        const livroFormatado = atualizado?.data ?? atualizado;
        setLivros((prev) =>
          prev.map((l) => (l.id === dadosLivro.id ? { ...l, ...livroFormatado } : l))
        );
        dispararAviso('Livro atualizado no catálogo!');
      } else {
        const criado = await cadastrarLivro(dadosLivro);
        const novoLivro = criado?.data ?? criado;
        // Mantém no máximo 5 livros no pré-carregamento ao inserir novo exemplar no topo
        setLivros((prev) => [novoLivro, ...prev].slice(0, termoBusca.trim() ? undefined : 5));
        dispararAviso('Livro cadastrado com sucesso!');
      }
      return true;
    } catch (error) {
      dispararAviso(error.message || 'Erro ao salvar o livro.');
      return false;
    }
  };

  /**
   * Importa livros em massa via arquivo CSV e atualiza o pré-carregamento dos 5 últimos livros.
   */
  const importarCsvLivros = async (arquivoCsv) => {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoCsv);

      const resposta = await importarLivrosCSV(formData);
      dispararAviso(resposta?.message || 'Livros importados via CSV com sucesso!');
      setTriggerRecarregar((prev) => prev + 1);
      return true;
    } catch (error) {
      dispararAviso(error.message || 'Falha ao importar o arquivo CSV de livros.');
      return false;
    }
  };

  /**
   * Remove um exemplar físico do acervo.
   */
  const removerLivro = async (id) => {
    try {
      await excluirLivro(id);
      setLivros((prev) => prev.filter((item) => item.id !== id));
      dispararAviso('Exemplar removido do acervo escolar.');
      setTriggerRecarregar((prev) => prev + 1);
      return true;
    } catch (error) {
      dispararAviso(error.message || 'Falha ao excluir exemplar.');
      return false;
    }
  };

  /**
   * Solicita o empréstimo de um livro físico para o usuário logado.
   */
  const solicitarEmprestimoLivro = async (livroId, observacoes = '') => {
    try {
      const resposta = await solicitarEmprestimo({
        livro_id: livroId,
        observacoes,
      });
      const novoEmprestimo = resposta?.data ?? resposta;
      setEmprestimos((prev) => [novoEmprestimo, ...prev]);

      // Atualiza a disponibilidade local para feedback instantâneo na tela
      setLivros((prev) =>
        prev.map((l) => {
          if (l.id === livroId) {
            const novaQtd = Math.max(0, (l.quantidade_disponivel ?? 1) - 1);
            return {
              ...l,
              quantidade_disponivel: novaQtd,
              disponivel: novaQtd > 0,
            };
          }
          return l;
        })
      );

      dispararAviso('Empréstimo solicitado com sucesso! Retire seu exemplar na biblioteca.');
      return true;
    } catch (error) {
      dispararAviso(error.message || 'Não foi possível solicitar este empréstimo.');
      return false;
    }
  };

  // ================= Operações de Videoaulas =================

  const adicionarVideoaula = (videoaula) => {
    if (videoaulas.some((video) => video.url === videoaula.url)) {
      dispararAviso('Esta videoaula já foi adicionada à sua lista.');
      return false;
    }
    setVideoaulas((prev) => [videoaula, ...prev]);
    dispararAviso('Videoaula salva com sucesso!');
    return true;
  };

  const removerVideoaula = (id) => {
    setVideoaulas((prev) => prev.filter((item) => item.id !== id));
    dispararAviso('Videoaula removida da lista.');
  };

  return {
    livros,
    emprestimos,
    videoaulas,
    carregandoBiblioteca: carregandoLivros,
    erroCarregamento,
    notificacao,
    tentarCarregarBiblioteca,
    dispararAviso,
    salvarLivro,
    importarCsvLivros,
    removerLivro,
    solicitarEmprestimoLivro,
    adicionarVideoaula,
    removerVideoaula,
  };
};

export default useBiblioteca;
