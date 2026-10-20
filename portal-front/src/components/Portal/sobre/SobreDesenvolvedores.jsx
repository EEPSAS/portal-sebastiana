import { useEffect, useRef, useState } from "react";

// ==============================================================================
// DADOS DA LIDERANÇA
// Dois cards de liderança em destaque, alinhados horizontalmente no desktop.
// Cada líder possui caminho dedicado para fotografia (/img/devs/<nome>.jpg)
// e fallback automático com as iniciais caso a foto ainda não esteja presente.
// ==============================================================================
// DADOS DA LIDERANÇA
// Dois cards de liderança em destaque, alinhados horizontalmente no desktop.
// Cada líder possui caminho dedicado para fotografia com calibração individual
// de enquadramento facial (objectPosition) para garantir visualização perfeita do rosto.
// ==============================================================================
const leaders = [
  {
    name: "Ana Lívia",
    role: "",
    badge: "Liderança · Back-end",
    description: "Coordena o desenvolvimento do back-end e a integração dos dados da aplicação.",
    photo: "/img/ana-perfil.jpeg",
    // Classe CSS específica para ajuste fino do enquadramento facial
    photoClassName: "foto-ana-livia",
    // Centraliza perfeitamente o rosto (olhos/sorriso) dentro do avatar quadrado
    objectPosition: "50% 36%",
    // Link configurável para o portfólio pessoal do desenvolvedor
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
  {
    name: "Yasmin Teixeira",
    role: "",
    badge: "Liderança · Front-end",
    description: "Coordena o desenvolvimento da interface, o design e a navegação do portal.",
    // Utiliza o arquivo PNG de altíssima definição (859x731) em vez do JPEG comprimido
    photo: "/img/teixeira-perfil.png",
    objectPosition: "center 22%",
    // Link configurável para o portfólio pessoal do desenvolvedor
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://www.instagram.com/yasminxst0/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/yasminxst",
    },
  },
];

// ==============================================================================
// DADOS DA EQUIPE — LISTA PLANA PARA CARROSSEL FLUIDO DE 1 EM 1
// Permite que os cards deslizem individualmente sem a quebra brusca de blocos de páginas.
// Dalton e Prentys foram removidos permanentemente conforme especificação.
// ==============================================================================
const teamMembers = [
  {
    name: "Davi",
    role: "Desenvolvedor Front-end",
    photo: "/img/davi-perfil.png",
    // Enquadramento no terço superior para evitar corte da cabeça
    objectPosition: "center 20%",
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
  {
    name: "Natã",
    role: "Desenvolvedor Front-end",
    photo: "/img/nata-perfil.png",
    objectPosition: "center 20%",
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
  {
    name: "Rhaynner",
    role: "Desenvolvedor Front-end",
    photo: "/img/perfil-rhaynner.png",
    objectPosition: "center 20%",
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
  {
    name: "Yasmim Gomes",
    role: "Desenvolvedora Back-end",
    photo: "/img/gomes-perfil.jpeg",
    // Classe CSS específica para ajuste fino do enquadramento facial
    photoClassName: "foto-yasmim-gomes",
    // Centraliza com precisão o rosto e o sorriso, preservando o volume dos cachos
    objectPosition: "50% 45%",
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://www.instagram.com/yasmimg36/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
  {
    name: "Cadu",
    role: "Desenvolvedor Back-end",
    photo: "/img/cadu-perfil.png",
    objectPosition: "center 25%",
    portfolioUrl: "https://github.com/",
    // Redes sociais (substituir pelas URLs reais; rede omitida = ícone não aparece)
    social: {
      instagram: "https://instagram.com/",
      linkedin: "https://linkedin.com/",
      github: "https://github.com/",
    },
  },
];

// Clona os primeiros 2 integrantes no final da fila para manter a grade cheia (3 cards visíveis)
// nos últimos passos (índices 3 e 4), criando rotação circular suave de 1 em 1
const displayMembers = [...teamMembers, ...teamMembers.slice(0, 2)];

const AUTOPLAY_INTERVAL_MS = 5000; // Tempo de rotação automática do carrossel (5 segundos)
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Função utilitária pura para extrair até duas iniciais em maiúsculo do nome.
 */
const getInitials = (name) => {
  const parts = name.trim().split(" ");
  const initials = parts.length > 1
    ? parts[0][0] + parts[1][0]
    : name.slice(0, 2);

  return initials.toLocaleUpperCase("pt-BR");
};

/**
 * Componente didático para renderização da foto com fallback de iniciais.
 * Utiliza o evento onError da tag <img> para alternar transparentemente para o avatar textual.
 * O elemento wrapper interno (.sobre-dev-photo-wrapper) garante recorte suave de cantos (antialiasing)
 * sem cortar o indicador amarelo ::after posicionado na borda externa.
 */
const DevPhoto = ({ name, src, size = "md", objectPosition, photoClassName }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`sobre-dev-photo sobre-dev-photo--${size}`}>
      {hasError ? (
        <div className="sobre-dev-photo-fallback" role="img" aria-label={name}>
          {getInitials(name)}
        </div>
      ) : (
        <div className="sobre-dev-photo-wrapper">
          <img
            className={`sobre-dev-photo-img ${photoClassName || ""}`.trim()}
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            style={objectPosition ? { objectPosition } : undefined}
            onError={() => setHasError(true)}
          />
        </div>
      )}
    </div>
  );
};

// Lista fixa das redes: define a ordem, o ícone (Bootstrap Icons) e o rótulo de cada botão
const SOCIAL_NETWORKS = [
  { key: "instagram", icon: "bi-instagram", label: "Instagram" },
  { key: "linkedin", icon: "bi-linkedin", label: "LinkedIn" },
  { key: "github", icon: "bi-github", label: "GitHub" },
];

/**
 * Botões de ícone das redes sociais do desenvolvedor.
 * Só renderiza as redes que possuem URL preenchida em `social`.
 */
const SocialLinks = ({ name, social }) => {
  // Sem objeto social, não há nada para mostrar
  if (!social) return null;

  // Filtra apenas as redes com URL informada (rede ausente = ícone omitido)
  const networks = SOCIAL_NETWORKS.filter(({ key }) => social[key]);
  if (networks.length === 0) return null;

  return (
    <div className="sobre-dev-social">
      {networks.map(({ key, icon, label }) => (
        <a
          key={key}
          href={social[key]}
          target="_blank"
          rel="noopener noreferrer" // evita que a nova aba acesse window.opener
          className="sobre-dev-social-btn"
          aria-label={`${label} de ${name}`}
          title={label}
        >
          <i className={`bi ${icon}`} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
};

/**
 * Card individual de Liderança:
 * Foto à esquerda, badge em pílula, nome, cargo com traço rosa característico, descrição e botão de portfólio.
 */
const LeaderCard = ({ leader }) => (
  <article className="sobre-dev-leader-card">
    <DevPhoto
      name={leader.name}
      src={leader.photo}
      size="lg"
      objectPosition={leader.objectPosition}
      photoClassName={leader.photoClassName}
    />
    <div className="sobre-dev-leader-info">
      <span className="sobre-dev-leader-badge">{leader.badge}</span>
      <h3 className="sobre-dev-leader-name">{leader.name}</h3>
      <p className="sobre-dev-leader-role">{leader.role}</p>
      <span className="sobre-dev-leader-divider" aria-hidden="true" />
      <p className="sobre-dev-leader-description">{leader.description}</p>
      {/* Linha de ações: botão de portfólio + ícones das redes sociais */}
      <div className="sobre-dev-actions sobre-dev-actions--leader">
        {leader.portfolioUrl && (
          <a
            href={leader.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sobre-dev-portfolio-btn sobre-dev-portfolio-btn--leader"
            aria-label={`Acessar portfólio de ${leader.name}`}
          >
            <span>Portfólio</span>
            <span className="sobre-dev-portfolio-arrow" aria-hidden="true">↗</span>
          </a>
        )}
        <SocialLinks name={leader.name} social={leader.social} />
      </div>
    </div>
  </article>
);

/**
 * Card individual de Integrante da Equipe:
 * Avatar no topo à esquerda com ponto amarelo, nome, função técnica e botão de portfólio na base.
 */
const TeamMemberCard = ({ member }) => (
  <article className="sobre-dev-member-card">
    <div className="sobre-dev-member-top">
      <DevPhoto
        name={member.name}
        src={member.photo}
        size="sm"
        objectPosition={member.objectPosition}
        photoClassName={member.photoClassName}
      />
      <h4 className="sobre-dev-member-name" title={member.name}>{member.name}</h4>
      <p className="sobre-dev-member-role" title={member.role}>{member.role}</p>
    </div>
    {/* Linha de ações: botão de portfólio + ícones das redes sociais */}
    <div className="sobre-dev-actions">
      {member.portfolioUrl && (
        <a
          href={member.portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sobre-dev-portfolio-btn"
          aria-label={`Acessar portfólio de ${member.name}`}
        >
          <span>Portfólio</span>
          <span className="sobre-dev-portfolio-arrow" aria-hidden="true">↗</span>
        </a>
      )}
      <SocialLinks name={member.name} social={member.social} />
    </div>
  </article>
);

/**
 * Componente Principal da Seção de Desenvolvedores
 */
const SobreDesenvolvedores = () => {
  // Estado que armazena o índice do integrante atual na liderança do carrossel (0 a 4)
  const [currentIndex, setCurrentIndex] = useState(0);
  // Estado de controle para pausar rotação durante interação do usuário
  const [isPaused, setIsPaused] = useState(false);
  // Preferência do usuário por redução de animações e movimentos
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
  // Posição X inicial do gesto de arrasto (touch/mouse)
  const touchStartX = useRef(null);

  const totalMembers = teamMembers.length; // 5 integrantes

  // Monitora mudanças na preferência de movimento reduzido no sistema operacional
  useEffect(() => {
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleMotionChange = () => setReducedMotion(motionQuery.matches);

    motionQuery.addEventListener("change", handleMotionChange);
    return () => motionQuery.removeEventListener("change", handleMotionChange);
  }, []);

  // Temporizador para avanço automático de 1 em 1 card
  useEffect(() => {
    // Se o usuário estiver interagindo ou tiver movimento reduzido ativo, não agenda o temporizador
    if (isPaused || reducedMotion) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      // Avanço contínuo de 1 em 1 card: 0 -> 1 -> 2 -> 3 -> 4 -> 0
      setCurrentIndex((prev) => (prev + 1) % totalMembers);
    }, AUTOPLAY_INTERVAL_MS);

    // Limpeza obrigatória do temporizador para prevenir memory leaks
    return () => window.clearTimeout(timer);
  }, [currentIndex, isPaused, reducedMotion, totalMembers]);

  // Função para navegar entre os integrantes de 1 em 1 (+1 ou -1)
  const navigate = (direction) => {
    setCurrentIndex((prev) => (prev + direction + totalMembers) % totalMembers);
  };

  // Suporte a navegação por teclado acessível
  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setCurrentIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setCurrentIndex(totalMembers - 1);
    }
  };

  // Gestos de arrasto e toque para dispositivos móveis
  const handlePointerDown = (event) => {
    touchStartX.current = event.clientX;
    setIsPaused(true);
  };

  const handlePointerUp = (event) => {
    if (touchStartX.current === null) return;

    const diff = event.clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      navigate(diff < 0 ? 1 : -1);
    }

    touchStartX.current = null;
    setIsPaused(false);
  };

  const handlePointerCancel = () => {
    touchStartX.current = null;
    setIsPaused(false);
  };

  return (
    <section
      id="sobre-desenvolvedores"
      className="sobre-developers-panel"
      role="region"
      aria-label="Desenvolvedores do Portal Sebastiana"
    >
      {/* 1. Apresentação Inicial: Título "Nossa equipe" e descrição curta */}
      <div className="sobre-dev-header">
        <p className="sobre-eyebrow">Quem faz o portal</p>
        <h2 className="sobre-dev-title">Nossa equipe</h2>
        <p className="sobre-dev-subtitle">
          Ideias, design e tecnologia que aproximam a escola da comunidade.
        </p>
      </div>

      {/* 2. Área de Liderança: Dois cards brancos lado a lado */}
      <div className="sobre-dev-leaders-grid">
        {leaders.map((leader) => (
          <LeaderCard key={leader.name} leader={leader} />
        ))}
      </div>

      {/* 3. Área da Equipe de Desenvolvimento com Carrossel de 2 Páginas */}
      <div
        className="sobre-dev-team-section"
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) setIsPaused(true);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
        }}
      >
        <h3 className="sobre-dev-team-heading">Equipe de desenvolvimento</h3>

        <div className="sobre-dev-carousel-container">
          {/* Seta Lateral Esquerda */}
          <button
            className="sobre-dev-arrow sobre-dev-arrow--prev"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Mostrar integrante anterior"
          >
            <span aria-hidden="true">&#8592;</span>
          </button>

          {/* Janela de Visualização (Viewport) */}
          <div
            className="sobre-dev-viewport"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            aria-live={isPaused || reducedMotion ? "polite" : "off"}
          >
            {/* Trilho Deslizante com translateX que se desloca de 1 em 1 card */}
            <div
              className="sobre-dev-track"
              style={{
                transform: `translateX(calc(-${currentIndex} * (100% + var(--dev-carousel-gap, 1rem)) / 3))`,
              }}
            >
              {displayMembers.map((member, idx) => (
                <TeamMemberCard key={`${member.name}-${idx}`} member={member} />
              ))}
            </div>
          </div>

          {/* Seta Lateral Direita */}
          <button
            className="sobre-dev-arrow sobre-dev-arrow--next"
            type="button"
            onClick={() => navigate(1)}
            aria-label="Mostrar próximo integrante"
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>

        {/* Indicadores de Posição: 1 ponto por integrante da equipe */}
        <div
          className="sobre-dev-indicators"
          role="tablist"
          aria-label="Indicadores dos integrantes da equipe"
        >
          {teamMembers.map((member, index) => (
            <button
              key={member.name}
              type="button"
              role="tab"
              className={`sobre-dev-indicator-dot${currentIndex === index ? " is-active" : ""}`}
              aria-selected={currentIndex === index}
              aria-label={`Integrante ${index + 1} de ${totalMembers}: ${member.name}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>


    </section>
  );
};

export default SobreDesenvolvedores;
