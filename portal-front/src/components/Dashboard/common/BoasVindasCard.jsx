/**
 * BoasVindasCard.jsx - Cabeçalho Institucional Padronizado de Módulo
 *
 * Papel Didático:
 * Atua como a identidade visual e o ponto de ancoragem superior de cada tela do Dashboard.
 * 1. Ícone representativo do módulo (Bootstrap Icons) em substituição à foto de perfil;
 * 2. Título do módulo em tipografia clássica e nobre ('Cormorant Garamond');
 * 3. Subtítulo com mensagem curta e descritiva da funcionalidade ativa;
 * 4. Slot flexível à direita (`acoes`) para centralizar botões de cadastro e campos de busca globais.
 */

import { useLocation } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { obterContextoModulo } from "../../../utils/dashboardNav";

export default function BoasVindasCard({
  titulo,
  subtitulo,
  icone,
  acoes,
  className = "",
}) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "aluno";

  // Se título, subtítulo ou ícone não forem explicitamente informados,
  // obtém os valores declarativos calculados da fonte única de navegação
  const contexto = obterContextoModulo(location.pathname, location.search, role);

  const tituloFinal = titulo ?? contexto.titulo;
  const subtituloFinal = subtitulo ?? contexto.subtitulo;
  const iconeFinal = icone ?? contexto.icone;

  return (
    <div
      className={`boas-vindas-card d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 pb-3 ${className}`.trim()}
    >
      {/* Bloco Esquerdo: Ícone do Módulo + Título Institucional + Descrição */}
      <div className="d-flex align-items-center gap-3">
        {iconeFinal && (
          <div
            className="boas-vindas-icone rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
            aria-hidden="true"
            style={{
              width: "52px",
              height: "52px",
              backgroundColor: "var(--dashboard-navy-soft)",
              color: "var(--dashboard-navy)",
              fontSize: "1.6rem",
            }}
          >
            <i className={`bi ${iconeFinal}`}></i>
          </div>
        )}

        <div>
          <h1
            className="boas-vindas-titulo mb-1"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)",
              fontWeight: 700,
              color: "var(--dashboard-navy)",
              lineHeight: 1.2,
            }}
          >
            {tituloFinal}
          </h1>
          {subtituloFinal && (
            <p
              className="text-secondary small mb-0 boas-vindas-subtitulo"
              style={{ maxWidth: "720px", lineHeight: 1.45 }}
            >
              {subtituloFinal}
            </p>
          )}
        </div>
      </div>

      {/* Bloco Direito: Botões de Ação e Buscas do Módulo */}
      {acoes && (
        <div className="boas-vindas-acoes d-flex align-items-center gap-2 flex-wrap ms-lg-auto">
          {acoes}
        </div>
      )}
    </div>
  );
}
