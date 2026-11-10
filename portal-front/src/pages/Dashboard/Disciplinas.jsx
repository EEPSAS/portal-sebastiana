/**
 * Disciplinas.jsx - Página Roteadora de Gestão de Disciplinas (Módulo 5.5)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para o Módulo 5.5 (/dashboard/disciplinas).
 * Delega o catálogo de disciplinas, filtros e modais para o container
 * especializado em src/components/Dashboard/disciplinas/.
 */

import DisciplinasContainer from "../../components/Dashboard/disciplinas";

export default function DisciplinasPage() {
  return <DisciplinasContainer />;
}
