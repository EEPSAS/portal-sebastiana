/**
 * Panel.jsx - Container Estrutural de Conteúdo do Dashboard
 *
 * Papel Didático:
 * Atua como envelope semântico (<section>) para os módulos internos do painel administrativo,
 * garantindo espaçamento padronizado e área de rolagem vertical independente.
 */

const Panel = ({ children }) => (
  <section className="dashboard-panel flex-grow-1">{children}</section>
);

export default Panel;
