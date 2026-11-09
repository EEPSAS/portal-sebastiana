/**
 * index.js - Catálogo Central e Mecanismo de Busca da Wiki
 *
 * Papel Didático:
 * Atua como o Repositório de Conteúdo da base de conhecimento do Portal Sebastiana.
 * Fornece métodos declarativos para indexar, filtrar e buscar tópicos por termo,
 * categoria e papel (Role-Based Relevance).
 */

import { CATEGORIAS_WIKI, obterCategoriaPorId } from "./categorias";
import { artigoPrimeirosPassos } from "./artigos/primeirosPassos";
import { artigoBoletimEscolar } from "./artigos/boletimEscolar";
import { artigoImportacaoCsv } from "./artigos/importacaoCsv";
import { artigoTurmasMatriculas } from "./artigos/turmasMatriculas";
import { artigoBibliotecaAcervo } from "./artigos/bibliotecaAcervo";
import { artigoAgendaHorarios } from "./artigos/agendaHorarios";
import { artigoNoticiasPodcast } from "./artigos/noticiasPodcast";
import { artigoGestaoUsuarios } from "./artigos/gestaoUsuarios";
import { artigoDonaNanaMentora } from "./artigos/donaNanaMentora";
import { artigoSobreEscolaEepsas } from "./artigos/sobreEscolaEepsas";

/**
 * Lista imutável consolidada com todos os artigos da Wiki.
 */
export const TODOS_ARTIGOS = [
  artigoPrimeirosPassos,
  artigoBoletimEscolar,
  artigoImportacaoCsv,
  artigoTurmasMatriculas,
  artigoBibliotecaAcervo,
  artigoAgendaHorarios,
  artigoNoticiasPodcast,
  artigoGestaoUsuarios,
  artigoDonaNanaMentora,
  artigoSobreEscolaEepsas,
];

/**
 * Retorna todos os artigos cadastrados.
 */
export const listarTodosArtigos = () => {
  return [...TODOS_ARTIGOS];
};

/**
 * Busca um artigo pelo seu ID único.
 */
export const obterArtigoPorId = (artigoId) => {
  return TODOS_ARTIGOS.find((artigo) => artigo.id === artigoId) || null;
};

/**
 * Retorna todos os artigos associados a uma categoria específica.
 */
export const obterArtigosPorCategoria = (categoriaId) => {
  if (!categoriaId) return listarTodosArtigos();
  return TODOS_ARTIGOS.filter((artigo) => artigo.categoriaId === categoriaId);
};

/**
 * Retorna artigos recomendados com prioridade para o papel logado (Role-Based Relevance).
 */
export const obterArtigosRecomendadosParaRole = (role = "aluno") => {
  const roleNormalizada = role?.toLowerCase() || "aluno";

  return [...TODOS_ARTIGOS].sort((a, b) => {
    const aRelevante = a.perfisRecomendados.includes(roleNormalizada) || a.perfisRecomendados.includes("todos");
    const bRelevante = b.perfisRecomendados.includes(roleNormalizada) || b.perfisRecomendados.includes("todos");

    if (aRelevante && !bRelevante) return -1;
    if (!aRelevante && bRelevante) return 1;
    return 0;
  });
};

/**
 * Realiza uma busca textual e facetada em tempo real sobre a base da Wiki.
 *
 * @param {Object} params
 * @param {string} [params.termo] - Palavra-chave ou texto de pesquisa.
 * @param {string} [params.categoriaId] - Filtro opcional por categoria.
 * @param {string} [params.role] - Papel ativo para priorização.
 */
export const buscarArtigos = ({ termo = "", categoriaId = null, role = null }) => {
  let resultado = listarTodosArtigos();

  // 1. Filtro por Categoria
  if (categoriaId) {
    resultado = resultado.filter((artigo) => artigo.categoriaId === categoriaId);
  }

  // 2. Filtro Textual
  const termoLimpo = termo.trim().toLowerCase();
  if (termoLimpo) {
    resultado = resultado.filter((artigo) => {
      const bateTitulo = artigo.titulo.toLowerCase().includes(termoLimpo);
      const bateResumo = artigo.resumo.toLowerCase().includes(termoLimpo);
      const bateTag = artigo.tags?.some((t) => t.toLowerCase().includes(termoLimpo));

      // Busca também no texto das seções
      const bateConteudo = artigo.secoes?.some((s) => {
        if (s.texto && s.texto.toLowerCase().includes(termoLimpo)) return true;
        if (s.itens && s.itens.some((it) => it.toLowerCase().includes(termoLimpo))) return true;
        return false;
      });

      return bateTitulo || bateResumo || bateTag || bateConteudo;
    });
  }

  // 3. Ordenação por relevância do papel se fornecido
  if (role) {
    const roleNormalizada = role.toLowerCase();
    resultado = [...resultado].sort((a, b) => {
      const aPrioridade = a.perfisRecomendados.includes(roleNormalizada);
      const bPrioridade = b.perfisRecomendados.includes(roleNormalizada);
      if (aPrioridade && !bPrioridade) return -1;
      if (!aPrioridade && bPrioridade) return 1;
      return 0;
    });
  }

  return resultado;
};

export { CATEGORIAS_WIKI, obterCategoriaPorId };
