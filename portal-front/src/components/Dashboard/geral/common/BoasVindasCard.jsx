import { useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { normalizarRole } from "../../../../utils/rolesRoutes";

/**
 * Mapeamento das mensagens contextuais do subtítulo para cada perfil de usuário.
 */
const MENSAGEM_POR_ROLE = {
  aluno: "Seja bem-vinda ao Portal Sebastiana. Aqui você acompanha seu desempenho, frequência e tem acesso a todos os recursos da escola.",
  professor: "Bem-vindo(a) ao Portal Sebastiana. Aqui você consulta o rendimento e a frequência das suas turmas.",
  bibliotecaria: "Bem-vindo(a) ao Portal Sebastiana. Aqui você acompanha o acervo, os empréstimos e as devoluções da biblioteca.",
  especialista: "Bem-vindo(a) ao Portal Sebastiana. Aqui você acompanha os indicadores pedagógicos e as atualizações da escola.",
  adm: "Bem-vindo(a) ao Portal Sebastiana. Aqui você tem a visão consolidada de toda a escola.",
};

/**
 * BoasVindasCard.jsx - Saudação compartilhada pelas visões Gerais.
 *
 * Papel Didático:
 * Renderiza o banner superior de acolhimento com foto/ícone de avatar, saudação
 * amigável personalizada pelo `user.nickname` (com fallback) e subtítulo contextual
 * de acordo com o papel acadêmico (role) do usuário.
 */
export default function BoasVindasCard() {
  const { user } = useAuth();
  // Armazena a URL da foto com falha para fallback gracioso declarativo
  const [urlFotoComErro, setUrlFotoComErro] = useState(null);

  // Prioriza o apelido para usar o nome escolhido pelo próprio usuário
  const nomeExibicao = user?.nickname || user?.name || "Maria Eduarda";

  // Identifica a role ativa normalizada para selecionar o texto descritivo correspondente
  const role = normalizarRole(user?.role);
  const mensagemSubtitulo = MENSAGEM_POR_ROLE[role] ?? MENSAGEM_POR_ROLE.aluno;

  return (
    <div className="card border-0 dashboard-card-shadow rounded-4 p-3 mb-3 bg-white">
      <div className="d-flex align-items-center gap-3">
        {/* Avatar do usuário: foto de perfil ou ícone padrão quando não houver foto */}
        {user?.avatar && urlFotoComErro !== user?.avatar ? (
          <img
            src={user.avatar}
            alt={nomeExibicao}
            className="rounded-circle flex-shrink-0 object-fit-cover"
            style={{ width: "58px", height: "58px" }}
            onError={() => setUrlFotoComErro(user?.avatar)}
          />
        ) : (
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: "58px",
              height: "58px",
              backgroundColor: "var(--dashboard-navy-soft)",
              color: "var(--dashboard-navy)",
              fontSize: "1.8rem",
            }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
        )}

        <div>
          <h2 className="fs-4 fw-bold mb-1 text-dark">
            Olá, {nomeExibicao}!
          </h2>
          <p className="text-secondary small mb-0" style={{ maxWidth: "700px" }}>
            {mensagemSubtitulo}
          </p>
        </div>
      </div>
    </div>
  );
}
