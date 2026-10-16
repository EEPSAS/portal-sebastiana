/**
 * Boletim.jsx - Página de Boletim Escolar do Aluno
 *
 * Papel Didático:
 * Exibe o histórico de notas e faltas do estudante. A restrição de perfil é gerenciada
 * pelo <ProtectedRoute allowedRoles={['aluno', 'adm', 'padrao']}> em App.jsx.
 */

import { useLocation } from "react-router";
import Boletim from "../../components/Dashboard/boletim";

const BoletimPage = () => {
  const location = useLocation();
  // A turma chega pela navegação ou pela URL, sem recorrer a um identificador fixo.
  const turmaId =
    location.state?.turma_id ??
    location.state?.turmaId ??
    new URLSearchParams(location.search).get("turma_id");

  return <Boletim turmaId={turmaId} />;
};

export default BoletimPage;
