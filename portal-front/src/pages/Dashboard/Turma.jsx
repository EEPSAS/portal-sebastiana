/**
 * Turma.jsx - Página de Gestão de Turmas e Notas
 *
 * Papel Didático:
 * Renderiza o módulo de turmas para professores, especialistas e administradores.
 * A proteção de acesso por perfil é realizada declarativamente pelo <ProtectedRoute allowedRoles={...}>
 * configurado em App.jsx, mantendo este componente desacoplado e focado em renderizar a tela.
 */

import TurmaEspecialista from "../../components/Dashboard/turmas";

const TurmaPage = () => {
  return <TurmaEspecialista />;
};

export default TurmaPage;
