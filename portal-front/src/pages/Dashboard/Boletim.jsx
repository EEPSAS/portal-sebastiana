/**
 * Boletim.jsx - Página de Boletim Escolar do Aluno
 *
 * Papel Didático:
 * Exibe o histórico de notas e faltas do estudante. A restrição de perfil é gerenciada
 * pelo <ProtectedRoute allowedRoles={['aluno', 'adm', 'padrao']}> em App.jsx.
 */

import { useLocation } from "react-router";
import Boletim from "../../components/Dashboard/boletim";
import { useAuth } from "../../hooks/useAuth";

const BoletimPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Cascata pedagógica de identificação da turma:
  // 1. Navegação explícita via state do React Router (location.state?.turma_id)
  // 2. Parâmetro de busca na URL (?turma_id=)
  // 3. Vínculo ativo do aluno no banco de dados (user?.turma_id)
  const turmaId =
    location.state?.turma_id ??
    location.state?.turmaId ??
    new URLSearchParams(location.search).get("turma_id") ??
    user?.turma_id;

  // Identificação do estudante (permite que especialistas/professores visualizem o boletim de qualquer aluno)
  const alunoId =
    location.state?.aluno_id ??
    location.state?.alunoId ??
    new URLSearchParams(location.search).get("aluno_id") ??
    user?.id;

  return <Boletim turmaId={turmaId} alunoId={alunoId} />;
};

export default BoletimPage;
