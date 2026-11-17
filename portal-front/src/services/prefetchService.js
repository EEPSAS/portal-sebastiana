/**
 * prefetchService.js - Pré-carregamento Inteligente e Assíncrono por Papel (Role-based Prefetch)
 *
 * Papel Didático:
 * Em vez de esperar o usuário clicar em uma aba e aguardar a rede, este serviço
 * antecipa as requisições essenciais de cada papel logo após o login.
 * Utiliza `requestIdleCallback` (com fallback para `setTimeout`) para executar o
 * pré-carregamento exclusivamente em momentos de ociosidade da CPU do navegador,
 * sem concorrer com a renderização inicial do Dashboard Geral.
 */

import { api } from "./api";
import { normalizarRole } from "../utils/rolesRoutes";

/**
 * Executa tarefas em momentos de ociosidade do navegador para evitar congelamentos na UI.
 */
const runWhenIdle = (callback) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 500);
  }
};

/**
 * Pré-carrega recursos específicos para cada papel institucional da escola.
 * Todas as chamadas usam tratamento silencioso (.catch(() => {})) para que
 * nenhuma falha de rede interrompa a experiência do usuário.
 */
export const executarPrefetchPorPapel = (user) => {
  if (!user || !user.role) return;

  const role = normalizarRole(user.role);

  runWhenIdle(async () => {
    try {
      // 1. Recursos Comuns a Todos os Perfis Logados
      // Agenda escolar (eventos e datas importantes)
      api("/eventos").catch(() => {});
      api("/eventos/datas-importantes").catch(() => {});

      // 2. Pré-carregamento Específico por Papel
      if (role === "aluno" || role === "padrao") {
        // Pré-carrega o boletim do aluno se ele possuir turma vinculada
        const turmaId = user.turma_id || user.turma?.id || user.turma?.id_turma;
        if (turmaId && user.id) {
          api(`/alunos/${user.id}/turmas/${turmaId}/resumo-global`).catch(() => {});
          api(`/alunos/${user.id}/turmas/${turmaId}/boletim?trimestre=1`).catch(() => {});
          api(`/alunos/${user.id}/turmas/${turmaId}/comparativo-turma`).catch(() => {});
        }
        // Pré-carrega acervo inicial da biblioteca
        api("/livros?limit=5").catch(() => {});
      } else if (role === "professor") {
        // Pré-carrega turmas sob regência do docente e planos de estudo
        api("/turmas").catch(() => {});
        api("/me/turmas-lecionadas").catch(() => {});
        api("/livros?limit=5").catch(() => {});
      } else if (role === "especialista" || role === "adm") {
        // Gestão pedagógica e administrativa ampla
        api("/turmas").catch(() => {});
        api("/turmas/resumo-geral").catch(() => {});
        api("/professores").catch(() => {});
        api("/periodos-letivos").catch(() => {});
        api("/ciclos").catch(() => {});
        api("/disciplinas").catch(() => {});
        api("/usuarios/pendentes-resumo").catch(() => {});
      } else if (role === "bibliotecaria" || role === "bibliotecario") {
        // Gestão de acervo e empréstimos
        api("/livros?limit=5").catch(() => {});
        api("/emprestimos").catch(() => {});
      }
    } catch {
      // Prefetch é estritamente não-bloqueante
    }
  });
};
