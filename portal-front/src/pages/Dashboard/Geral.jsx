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
import GeralBibliotecario from "../../components/Dashboard/geral/bibliotecario";
import GeralProfessor from "../../components/Dashboard/geral/professor";
import BoasVindasCard from "../../components/Dashboard/geral/common/BoasVindasCard";
import { useAuth } from "../../hooks/useAuth";

const GeralPage = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";

  const isBibliotecaria = role === "bibliotecaria" || role === "bibliotecario";

  return (
    <>
      <BoasVindasCard />
      {isBibliotecaria ? (
        <GeralBibliotecario />
      ) : role === "professor" ? (
        <GeralProfessor />
      ) : role === "especialista" || role === "adm" ? (
        <GeralEspecialista />
      ) : (
        <GeralPadrao />
      )}
    </>
  );
};

export default GeralPage;