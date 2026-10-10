/**
 * Geral.jsx - Visão Geral do Painel de Controle
 *
 * Papel Didático:
 * Esta tela renderiza a visão analítica adequada de acordo com o papel acadêmico:
 * - 'aluno': visualiza dados acadêmicos do aluno (GeralPadrao).
 * - 'professor', 'especialista', 'adm': visualizam painel gerencial docente/pedagógico (GeralEspecialista).
 */

import GeralPadrao from "../../components/Dashboard/geral/padrao";
import GeralEspecialista from "../../components/Dashboard/geral/especialista";
import { useAuth } from "../../hooks/useAuth";

const GeralPage = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";

  // Professores, especialistas e administradores compartilham a visão executiva/docente
  const isVisaoEspecialista =
    role === "professor" || role === "especialista" || role === "adm";

  return isVisaoEspecialista ? <GeralEspecialista /> : <GeralPadrao />;
};

export default GeralPage;