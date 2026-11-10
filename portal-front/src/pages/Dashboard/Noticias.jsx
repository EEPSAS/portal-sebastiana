/**
 * Noticias.jsx - Página Roteadora de Gestão de Notícias Escolares (Módulo 2)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para o Módulo 2 (/dashboard/noticias).
 * Delega o CRUD completo, modais e tabela para o container em src/components/Dashboard/noticias/.
 */

import NoticiasContainer from "../../components/Dashboard/noticias";

export default function DashboardNoticias() {
  return <NoticiasContainer />;
}
