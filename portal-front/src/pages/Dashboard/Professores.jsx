/**
 * Professores.jsx - Página Roteadora de Gestão de Professores (Módulo 5.6)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para o Módulo 5.6 (/dashboard/professores).
 * Delega o controle de confirmação, listagem docente e vínculos com disciplinas
 * para o container em src/components/Dashboard/professores/.
 */

import ProfessoresContainer from "../../components/Dashboard/professores";

export default function ProfessoresPage() {
  return <ProfessoresContainer />;
}
