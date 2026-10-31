/**
 * notificacoesEventos.js - Barramento de Eventos Desacoplado do Frontend
 *
 * Papel Didático:
 * Permite que componentes desacoplados na árvore React (como o Aside de navegação
 * e modais de ações administrativas) comuniquem alterações de estado sem necessidade
 * de bibliotecas pesadas de gerenciamento de estado (sem Redux), utilizando a API
 * nativa CustomEvent do navegador.
 */

export const EVENTO_PENDENCIAS_ATUALIZADAS = "portal:pendencias-atualizadas";

/**
 * Dispara evento global notificando que contadores de pendências foram modificados
 * (por exemplo, após homologação de aluno ou confirmação de docente).
 */
export const notificarAtualizacaoPendencias = () => {
  window.dispatchEvent(new CustomEvent(EVENTO_PENDENCIAS_ATUALIZADAS));
};

