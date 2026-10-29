/**
 * planosService.js - Camada de Serviço de Planos de Estudos
 *
 * Papel Didático:
 * Centraliza as requisições HTTP RESTful para a gestão de trilhas de estudo:
 * - Listagem com contadores reais por tipo (incluindo planos compartilhados com a turma do aluno);
 * - Criação de novos planos;
 * - Consulta de plano completo com seus itens;
 * - Adição de conteúdos (com proteção contra duplicidade);
 * - Remoção de conteúdos preservando a fonte original;
 * - Consulta de turmas lecionadas pelo professor (1º, 2º e 3º ano) e compartilhamento de planos com turmas.
 */

import { api } from '../api';

export const planosService = {
  /**
   * Lista todos os planos de estudos do usuário autenticado (e planos compartilhados com sua turma se for aluno).
   */
  async listar(signal) {
    const res = await api('/planos-estudos', { signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao carregar planos de estudo.');
    }
    return res.json();
  },

  /**
   * Cria um novo plano de estudos.
   */
  async criar(dados) {
    const res = await api('/planos-estudos', {
      method: 'POST',
      body: dados,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar plano de estudos.');
    }
    return res.json();
  },

  /**
   * Obtém os detalhes completos de um plano de estudos com todos os seus itens associados.
   */
  async obterPorId(id, signal) {
    const res = await api(`/planos-estudos/${id}`, { signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao carregar detalhes do plano de estudos.');
    }
    return res.json();
  },

  /**
   * Exclui um plano de estudos (e itens em cascata).
   */
  async excluir(id) {
    const res = await api(`/planos-estudos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao excluir plano de estudos.');
    }
    return res.json();
  },

  /**
   * Adiciona um conteúdo didático (livro, videoaula ou conteúdo web) ao plano especificado.
   */
  async adicionarItem(planoId, itemDados) {
    const res = await api(`/planos-estudos/${planoId}/itens`, {
      method: 'POST',
      body: itemDados,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Se houver erro de validação (ex: duplicidade), extrai a mensagem detalhada
      const mensagemValidacao = data.errors?.conteudo?.[0] || data.message || 'Erro ao adicionar item ao plano.';
      throw new Error(mensagemValidacao);
    }
    return data;
  },

  /**
   * Remove um item associado a um plano de estudos sem excluir o conteúdo da Biblioteca.
   */
  async removerItem(planoId, itemId) {
    const res = await api(`/planos-estudos/${planoId}/itens/${itemId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao remover item do plano.');
    }
    return res.json();
  },

  /**
   * Lista as turmas vinculadas ao professor autenticado (1º, 2º ou 3º ano),
   * permitindo filtragem por termo de busca textual e por disciplina_id.
   */
  async listarTurmasLecionadas(filtro = '', signal) {
    const params = new URLSearchParams();
    if (typeof filtro === 'string') {
      if (filtro.trim()) params.set('q', filtro.trim());
    } else if (typeof filtro === 'object' && filtro !== null) {
      if (filtro.q?.trim()) params.set('q', filtro.q.trim());
      if (filtro.disciplina_id) params.set('disciplina_id', filtro.disciplina_id);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api(`/me/turmas-lecionadas${query}`, { signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao carregar as turmas vinculadas ao professor.');
    }
    return res.json();
  },

  /**
   * Compartilha (sincroniza) um plano de estudos criado pelo professor com as turmas selecionadas.
   */
  async compartilhar(planoId, turmaIds) {
    const res = await api(`/planos-estudos/${planoId}/compartilhar`, {
      method: 'POST',
      body: { turma_ids: turmaIds },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const mensagemErro = data.errors?.turma_ids?.[0] || data.message || 'Erro ao compartilhar plano com as turmas.';
      throw new Error(mensagemErro);
    }
    return data;
  },
};
