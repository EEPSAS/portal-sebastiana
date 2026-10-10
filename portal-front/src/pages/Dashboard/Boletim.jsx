/**
 * Boletim.jsx - Página de Boletim Escolar do Aluno
 *
 * Papel Didático:
 * Exibe o histórico de notas e faltas do estudante. A restrição de perfil é gerenciada
 * pelo <ProtectedRoute allowedRoles={['aluno', 'adm', 'padrao']}> em App.jsx.
 */

import Boletim from "../../components/Dashboard/boletim";

const BoletimPage = () => {
  return <Boletim />;
};

export default BoletimPage;
