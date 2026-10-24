/**
 * index.jsx - Ponto Central de Entrada e Exportação do Módulo Dona Nana
 *
 * Papel Didático:
 * Consolida e exporta todos os componentes de interface da assistente virtual:
 * 1. `DonaNanaChat` (ou default): tela completa da aba do Dashboard com histórico multi-turn;
 * 2. `DonaNanaFloatingWidget`: balão flutuante rápido no canto inferior direito;
 * 3. `DonaNanaAvatar`: componente de avatar com múltiplos tamanhos e placeholders resilientes;
 * 4. `ConfiguracaoDonaNana`: painel de gestão da persona e dos 4 campos do System Prompt.
 */

import DonaNanaChat from './DonaNanaChat';
import DonaNanaFloatingWidget from './DonaNanaFloatingWidget';
import DonaNanaAvatar from './DonaNanaAvatar';
import ConfiguracaoDonaNana from './ConfiguracaoDonaNana';

export {
  DonaNanaChat,
  DonaNanaFloatingWidget,
  DonaNanaAvatar,
  ConfiguracaoDonaNana,
};

export default DonaNanaChat;
