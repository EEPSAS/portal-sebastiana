/**
 * Usuarios.jsx - Página Roteadora de Gestão de Usuários (Módulo 6 - Role: Admin)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para o Módulo 6 (/dashboard/usuarios).
 * Delega o controle de acessos, tabela paginada, filtros e modais para o container
 * especializado em src/components/Dashboard/usuarios/.
 */

import UsuariosContainer from "../../components/Dashboard/usuarios";

export default function UsuariosPage() {
  return <UsuariosContainer />;
}
