/**
 * Panel.jsx - Container Estrutural de Conteúdo do Dashboard
 *
 * Papel Didático:
 * Atua como envelope semântico (<section>) para os módulos internos do painel administrativo,
 * garantindo espaçamento e padronização visual das telas.
 */

const Panel = ({ children }) => (
  <section className="dashboard-panel flex-grow-1 p-3">{children}</section>
);

export default Panel;
