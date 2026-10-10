/**
 * Biblioteca.jsx - Página do Acervo da Biblioteca Escolar
 *
 * Papel Didático:
 * Rota `/dashboard/biblioteca`. É a página inicial padrão do perfil 'bibliotecario',
 * e também está acessível a alunos, professores e especialistas.
 */

import BibliotecaPadrao from "../../components/Dashboard/biblioteca/padrao/BibliotecaPadrao";

const BibliotecaPage = () => {
  return <BibliotecaPadrao />;
};

export default BibliotecaPage;
