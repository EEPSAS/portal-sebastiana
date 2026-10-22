import { useState } from "react";
import { useAuth } from "../../../../../hooks/useAuth";

/**
 * AlunoBoasVindasCard.jsx - Banner de Boas-Vindas do Estudante
 *
 * Papel Didático:
 * Renderiza a mensagem calorosa de recepção para o estudante.
 * Exibe o avatar oficial e utiliza 'user.nickname' prioritariamente (com fallback para 'user.name' ou 'Estudante').
 */
export default function AlunoBoasVindasCard() {
  const { user } = useAuth();
  // Armazena a URL da foto com falha para fallback gracioso declarativo
  const [urlFotoComErro, setUrlFotoComErro] = useState(null);
  
  // Conforme requisito: prioriza 'nickname' com fallback gracioso para 'name'
  const nomeExibicao = user?.nickname || user?.name || "Maria Eduarda";

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
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
              fontSize: "1.8rem"
            }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
        )}

        {/* Mensagem e texto de apoio */}
        <div>
          <h2 className="fs-4 fw-bold mb-1 text-dark">
            Olá, {nomeExibicao}!
          </h2>
          <p className="text-secondary small mb-0" style={{ maxWidth: "700px" }}>
            Seja bem-vinda ao Portal Sebastiana. Aqui você acompanha seu desempenho,
            frequência e tem acesso a todos os recursos da escola.
          </p>
        </div>
      </div>
    </div>
  );
}
