/**
 * dashboardNav.js - Fonte Única de Verdade da Navegação do Dashboard
 *
 * Papel Didático:
 * Centraliza a árvore declarativa de módulos, rotas, ícones, regras de acesso (RBAC)
 * e textos explicativos (títulos e descrições contextuais).
 *
 * Evita divergências entre o menu lateral (Aside), a barra de navegação superior de
 * cada módulo (ModuloNav) e os cartões de acolhimento (BoasVindasCard).
 */

import { normalizarRole } from "./rolesRoutes";

/**
 * Mapeamento das descrições do Painel Geral de acordo com o papel do usuário.
 */
export const DESCRICOES_GERAL = {
  aluno: "Acompanhe seu desempenho, frequência e tenha acesso a todos os recursos da escola.",
  professor: "Aqui você consulta o rendimento e a frequência das suas turmas.",
  bibliotecaria: "Aqui você acompanha o acervo, os empréstimos e as devoluções da biblioteca.",
  bibliotecario: "Aqui você acompanha o acervo, os empréstimos e as devoluções da biblioteca.",
  especialista: "Acompanhe os principais indicadores e o andamento da escola em tempo real.",
  adm: "Visão consolidada de toda a escola, turmas e indicadores gerais em tempo real.",
};

/**
 * Nomes amigáveis de exibição para os títulos dos perfis no Geral.
 */
export const TITULOS_GERAL = {
  aluno: "Painel do Aluno",
  padrao: "Painel do Aluno",
  professor: "Painel do Professor",
  bibliotecaria: "Painel da Bibliotecária",
  bibliotecario: "Painel da Bibliotecária",
  especialista: "Painel do Especialista",
  adm: "Painel do Administrador",
};

/**
 * Estrutura declarativa hierárquica oficial de navegação do Dashboard.
 */
export const NAV_STRUCTURE = [
  {
    id: "geral",
    type: "item",
    label: "Geral",
    path: "/dashboard/geral",
    icon: "bi-house-door-fill",
    roles: [
      "aluno",
      "professor",
      "bibliotecaria",
      "bibliotecario",
      "especialista",
      "adm",
      "padrao",
    ],
  },
  {
    id: "academico",
    type: "group",
    label: "Acadêmico",
    icon: "bi-mortarboard-fill",
    children: [
      {
        id: "turmas",
        label: "Turmas",
        path: "/dashboard/turmas",
        icon: "bi-people-fill",
        roles: ["professor", "especialista", "adm"],
        badgeKey: "alunosPendentes",
        descricao:
          "Acompanhamento de turmas, alunos matriculados e diários escolares consolidados.",
      },
      {
        id: "boletim",
        label: "Boletim",
        path: "/dashboard/boletim",
        icon: "bi-journal-check",
        roles: ["aluno", "adm", "padrao"],
        descricao:
          "Consulte o histórico de notas, faltas e desempenho escolar ao longo do ano letivo.",
      },
      {
        id: "professores",
        label: "Professores",
        path: "/dashboard/professores",
        icon: "bi-person-badge",
        roles: ["especialista", "adm"],
        badgeKey: "professoresPendentes",
        descricao:
          "Confirme o pertencimento institucional vinculando disciplinas e acompanhe o quadro docente.",
      },
      {
        id: "disciplinas",
        label: "Disciplinas",
        path: "/dashboard/disciplinas",
        icon: "bi-journal-bookmark-fill",
        roles: ["aluno", "professor", "especialista", "adm", "padrao"],
        descricao:
          "Matriz curricular organizada por ciclos, carga horária anual e habilidades da BNCC.",
      },
      {
        id: "periodo-letivo",
        label: "Período Letivo",
        path: "/dashboard/periodos-letivos",
        icon: "bi-calendar-range",
        roles: ["especialista", "adm"],
        descricao:
          "Configuração do ano letivo, ciclos de divisão (bimestres/trimestres), pontuações e marcos escolares.",
      },
    ],
  },
  {
    id: "agenda",
    type: "group",
    label: "Agenda",
    icon: "bi-calendar-event",
    children: [
      {
        id: "agenda-calendario",
        label: "Calendário",
        path: "/dashboard/agenda?tab=calendario",
        matchPath: "/dashboard/agenda",
        matchTab: "calendario",
        defaultTab: true,
        icon: "bi-calendar3",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Planejamento e acompanhamento do calendário letivo, eventos e reuniões escolares.",
      },
      {
        id: "agenda-sabados",
        label: "Sábados Letivos",
        path: "/dashboard/agenda?tab=sabados",
        matchPath: "/dashboard/agenda",
        matchTab: "sabados",
        icon: "bi-calendar2-check",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Cronograma e planejamento pedagógico dos sábados letivos programados.",
      },
      {
        id: "agenda-feriados",
        label: "Feriados e Recessos",
        path: "/dashboard/agenda?tab=feriados",
        matchPath: "/dashboard/agenda",
        matchTab: "feriados",
        icon: "bi-calendar2-heart",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Calendário oficial de feriados nacionais, recessos e datas comemorativas.",
      },
      {
        id: "agenda-horarios",
        label: "Horário Escolar",
        path: "/dashboard/agenda?tab=horarios",
        matchPath: "/dashboard/agenda",
        matchTab: "horarios",
        icon: "bi-clock-history",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Grade semanal de horários e aulas por turno e turma da instituição.",
      },
    ],
  },
  {
    id: "conteudo",
    type: "group",
    label: "Conteúdo",
    icon: "bi-collection-play-fill",
    children: [
      {
        id: "conteudo-acervo",
        label: "Biblioteca",
        path: "/dashboard/biblioteca?tab=acervo",
        matchPath: "/dashboard/biblioteca",
        matchTab: "acervo",
        defaultTab: true,
        icon: "bi-book",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Consulte o acervo físico escolar, disponibilidade de exemplares e empréstimos.",
      },
      {
        id: "conteudo-videoaulas",
        label: "Vídeo Aula",
        path: "/dashboard/biblioteca?tab=videoaulas",
        matchPath: "/dashboard/biblioteca",
        matchTab: "videoaulas",
        icon: "bi-play-btn",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Curadoria e pesquisa de videoaulas educativas integradas ao YouTube.",
      },
      {
        id: "conteudo-web",
        label: "Busca Web",
        path: "/dashboard/biblioteca?tab=conteudo-web",
        matchPath: "/dashboard/biblioteca",
        matchTab: "conteudo-web",
        icon: "bi-globe2",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Pesquisa de livros, apostilas e referências didáticas na web.",
      },
      {
        id: "conteudo-planos",
        label: "Plano de Estudos",
        path: "/dashboard/biblioteca?tab=planos",
        matchPath: "/dashboard/biblioteca",
        matchTab: "planos",
        icon: "bi-list-check",
        roles: [
          "aluno",
          "professor",
          "bibliotecaria",
          "bibliotecario",
          "especialista",
          "adm",
          "padrao",
        ],
        descricao:
          "Trilhas de aprendizagem e organização de estudos personalizadas.",
      },
    ],
  },
  {
    id: "noticias",
    type: "item",
    label: "Notícias",
    path: "/dashboard/noticias",
    icon: "bi-newspaper",
    roles: ["especialista", "adm"],
    descricao:
      "Publique, edite e gerencie informativos e comunicados da comunidade escolar.",
  },
  {
    id: "usuarios",
    type: "item",
    label: "Usuários",
    path: "/dashboard/usuarios",
    icon: "bi-shield-lock-fill",
    roles: ["adm"],
    badgeKey: "totalPendentes",
    descricao:
      "Gestão de acessos, aprovação de cadastros e permissões de usuários no portal.",
  },
  {
    id: "dona-nana",
    type: "item",
    footerOnly: true,
    label: "Dona Nana",
    path: "/dashboard/dona-nana",
    icon: "bi-chat-heart-fill",
    roles: [
      "aluno",
      "professor",
      "bibliotecaria",
      "bibliotecario",
      "especialista",
      "adm",
      "padrao",
    ],
    descricao:
      "Patrona da escola e mentora pedagógica virtual — sempre com orientações e apoio afetuoso.",
  },
  {
    id: "configuracoes",
    type: "item",
    footerOnly: true,
    label: "Configurações",
    path: "/dashboard/configuracoes",
    icon: "bi-gear",
    roles: [
      "aluno",
      "professor",
      "bibliotecaria",
      "bibliotecario",
      "especialista",
      "adm",
      "padrao",
    ],
    descricao:
      "Personalize sua foto, dados de contato e preferências no Portal Sebastiana.",
  },
];

/**
 * Avalia se um item ou subitem de menu está ativo considerando pathname e query string.
 * Suporta tanto isChildActive(child, location) quanto isChildActive(child, pathname, search).
 */
export const isChildActive = (child, pathnameOrLocation, searchParam) => {
  const pathname =
    typeof pathnameOrLocation === "object" && pathnameOrLocation !== null
      ? pathnameOrLocation.pathname
      : pathnameOrLocation;
  const search =
    typeof pathnameOrLocation === "object" && pathnameOrLocation !== null
      ? pathnameOrLocation.search
      : searchParam;

  const searchParams = new URLSearchParams(search || "");
  const currentTab = searchParams.get("tab");

  if (child.matchPath) {
    if (pathname !== child.matchPath) return false;
    if (!currentTab && child.defaultTab) return true;
    return currentTab === child.matchTab;
  }

  return pathname === child.path || pathname.startsWith(`${child.path}/`);
};

/**
 * Deduz o contexto completo do módulo atual a partir da rota e perfil ativo.
 * Retorna título, subtítulo, ícone e abas ativas do módulo.
 */
export const obterContextoModulo = (pathname, search = "", role = "aluno") => {
  const roleNormalizada = normalizarRole(role);

  // 1. Caso especial: Painel Geral
  if (pathname === "/dashboard/geral" || pathname === "/dashboard") {
    return {
      moduloId: "geral",
      titulo: TITULOS_GERAL[roleNormalizada] || "Painel Geral",
      subtitulo: DESCRICOES_GERAL[roleNormalizada] || DESCRICOES_GERAL.aluno,
      icone: "bi-house-door-fill",
      abas: [],
      abaAtivaId: "geral",
      pertenceAGrupo: false,
    };
  }

  // 2. Sub-rotas especiais
  if (pathname.startsWith("/dashboard/biblioteca/planos/")) {
    return {
      moduloId: "conteudo",
      titulo: "Conteúdo - Plano de Estudos",
      subtitulo: "Visualização detalhada e gerenciamento de materiais da trilha de aprendizagem.",
      icone: "bi-list-check",
      abas: [],
      abaAtivaId: "conteudo-planos",
      pertenceAGrupo: true,
      rotaVoltar: "/dashboard/biblioteca?tab=planos",
    };
  }

  if (pathname === "/dashboard/dona-nana/configuracao") {
    return {
      moduloId: "dona-nana",
      titulo: "Dona Nana - Configuração da Persona",
      subtitulo: "Ajuste a persona e os campos instrucionais do System Prompt da mentora virtual.",
      icone: "bi-sliders",
      abas: [],
      abaAtivaId: "dona-nana",
      pertenceAGrupo: false,
      rotaVoltar: "/dashboard/dona-nana",
    };
  }

  // 3. Procura nos grupos (Acadêmico, Agenda, Conteúdo)
  for (const entry of NAV_STRUCTURE) {
    if (entry.type === "group") {
      const filhasPermitidas = entry.children.filter((child) =>
        child.roles.includes(roleNormalizada)
      );

      const filhaAtiva = filhasPermitidas.find((child) =>
        isChildActive(child, pathname, search)
      );

      if (filhaAtiva) {
        // Rótulo específico para o professor no subitem Turmas
        const rotuloFilha =
          filhaAtiva.id === "turmas" && roleNormalizada === "professor"
            ? "Minhas Turmas"
            : filhaAtiva.label;

        return {
          moduloId: entry.id,
          grupoLabel: entry.label,
          titulo: `${entry.label} - ${rotuloFilha}`,
          subtitulo: filhaAtiva.descricao || "",
          icone: filhaAtiva.icon || entry.icon,
          abas: filhasPermitidas.map((child) => ({
            ...child,
            labelExibicao:
              child.id === "turmas" && roleNormalizada === "professor"
                ? "Minhas Turmas"
                : child.label,
          })),
          abaAtivaId: filhaAtiva.id,
          pertenceAGrupo: true,
        };
      }
    } else if (entry.type === "item") {
      if (isChildActive(entry, pathname, search)) {
        return {
          moduloId: entry.id,
          titulo: entry.label,
          subtitulo: entry.descricao || "",
          icone: entry.icon,
          abas: [],
          abaAtivaId: entry.id,
          pertenceAGrupo: false,
        };
      }
    }
  }

  // Fallback genérico caso a rota não seja mapeada
  return {
    moduloId: "dashboard",
    titulo: "Portal Escolar",
    subtitulo: "Área administrativa e pedagógica da EEPSAS.",
    icone: "bi-mortarboard-fill",
    abas: [],
    abaAtivaId: "",
    pertenceAGrupo: false,
  };
};
