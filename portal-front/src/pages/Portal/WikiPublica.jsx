/**
 * WikiPublica.jsx - Página de Manuais e Ajuda no Portal Público
 *
 * Papel Didático:
 * Rota pública `/wiki`. Acessível por estudantes, responsáveis, professores e
 * membros da comunidade que visitam o portal escolar da EEPSAS.
 */

import WikiContainer from "../../components/Dashboard/wiki/WikiContainer";

export default function WikiPublicaPage() {
  return (
    <div className="container py-4 my-2">
      <WikiContainer roleUsuario="aluno" modoPublico={true} />
    </div>
  );
}
