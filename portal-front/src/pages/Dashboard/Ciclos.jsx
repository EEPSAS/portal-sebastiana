/**
 * Ciclos.jsx - Página Roteadora de Ciclos Curriculares e Turnos Escolares (Módulo 5.4)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para o Módulo 5.4 (/dashboard/ciclos).
 * Delega a renderização, estados assíncronos e subcomponentes visuais para o
 * container especializado em src/components/Dashboard/ciclos/.
 */

import CiclosContainer from "../../components/Dashboard/ciclos";

export default function CiclosPage() {
  return <CiclosContainer />;
}
