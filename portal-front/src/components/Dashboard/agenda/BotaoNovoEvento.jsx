/**
 * BotaoNovoEvento.jsx - Gatilho de Abertura do Modal de Cadastro de Eventos
 *
 * Papel Didático:
 * Componente funcional simples ("apresentacional") que recebe o callback `onClick`
 * para disparar a abertura do modal de agendamento na interface do especialista.
 * Estilizado através da classe externa `.agenda-btn-novo-evento`.
 */

const BotaoNovoEvento = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="agenda-btn-novo-evento"
  >
    + Adicionar Data
  </button>
);

export default BotaoNovoEvento;

