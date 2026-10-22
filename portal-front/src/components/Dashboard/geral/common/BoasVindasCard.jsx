import { useAuth } from "../../../../hooks/useAuth";

/**
 * BoasVindasCard.jsx - Saudação compartilhada pelas visões Gerais.
 */
export default function BoasVindasCard() {
  const { user } = useAuth();

  // Prioriza o apelido para usar o nome escolhido pelo próprio usuário.
  const nomeExibicao = user?.nickname || user?.name || "Maria Eduarda";

  return (
    <div className="card border-0 dashboard-card-shadow rounded-4 p-3 mb-3 bg-white">
      <div className="d-flex align-items-center gap-3">
        {/* Avatar do usuário: foto de perfil ou ícone padrão quando não houver foto */}
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={nomeExibicao}
            className="rounded-circle flex-shrink-0 object-fit-cover"
            style={{ width: "58px", height: "58px" }}
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
            Seja bem-vinda ao Portal Sebastiana. Aqui você acompanha seu desempenho,
            frequência e tem acesso a todos os recursos da escola.
          </p>
        </div>
      </div>
    </div>
  );
}
