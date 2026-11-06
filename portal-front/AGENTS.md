# Frontend — Convenções React e Mentoria Socrática (`portal-front/AGENTS.md`)

> **Diretriz Máxima Pedagógica:** As diretrizes pedagógicas e convenções gerais em [`../AGENTS.md`](../AGENTS.md) são obrigatórias e aplicam-se integralmente aqui.

---

## 1. Comandos e Definição de Pronto
* `npm run dev`: Inicia o servidor Vite local (`http://localhost:5173`).
* `npm run lint`: Executa o ESLint para checagem estática de código.
* `npm run build`: Compila a aplicação para produção.
* `npm run preview` (ou `npm start`): Serve a build de produção localmente / no Railway.
* **Definição de Pronto (DoD):** `npm run lint` sem erros + `npm run build` bem-sucedido + verificação manual na tela alterada + bloco de fechamento explicativo.

---

## 2. Stack Tecnológica e Limites de Bibliotecas
* **Permitido**: React 19, Vite, React Router 7, Bootstrap 5 e Bootstrap Icons (via CDN no `index.html`), **Recharts** (biblioteca padrão obrigatória para gráficos de barras, pizza/rosca e indicadores analíticos visuais), **Zod** (validação e revalidação estrita de payloads/schemas em runtime), **`@dnd-kit/core` e `@dnd-kit/utilities`** (interações *drag & drop*), hooks nativos do React (`useState`, `useEffect`, `useContext`, `useRef`, `useMemo`, `useCallback`), custom hooks organizados por domínio (`src/hooks/<dominio>/use*.js`) e `fetch` nativo com JavaScript moderno (arrow functions, destructuring, `?.`, template literals, `async/await`).
* **Proibido sem aprovação prévia em `/plan`**:
  * Bibliotecas externas de estado ou HTTP (Redux, Zustand, Axios, React Query).
  * Frameworks de CSS adicionais ou kits de componentes prontos (Tailwind, MUI, Chakra, AntDesign).
  * Construção manual de gráficos com SVG trigonométrico ou barras CSS improvisadas onde couber componente **Recharts**.
  * TypeScript no `portal-front`.

---

## 3. Mentoria Socrática no Frontend (UI/UX e Componentes)
Antes de criar qualquer componente, página, layout ou formulário, formule **perguntas de decisão** ao desenvolvedor júnior (em lote de até 5 perguntas com recomendação destacada):
1. *"Como podemos dividir visualmente esta tela em componentes menores e reutilizáveis?"*
2. *"Quais propriedades (`props`) este componente precisa receber para renderizar?"*
3. *"Quais variáveis de estado local (`useState`) serão necessárias e qual é o valor inicial de cada uma?"*
4. *"Como a tela deve se comportar visualmente nos 3 estados assíncronos: Carregando, Erro Amigável e Vazio?"*

---

## 4. Os 7 Módulos Oficiais, Transversais e Rotas no Frontend

1. **Autenticação (`/login`, `/dashboard/espera`)**:
   * Formulário simples integrado a `authService.login()` e botão oficial **Login With Google** (`authService.googleLogin()`). Armazena token Sanctum no `localStorage`, gerencia sessão via `AuthProvider` (`contexts/authContext.js`) e redireciona professores com vínculo ainda não confirmado para `/dashboard/espera`.
2. **Notícias (`/`, `/noticias/:id`, `/noticia/:id`, `/dashboard/noticias`)**:
   * Feed público na Home (junto às seções institucionais *Sobre* e *2.1 Radioatividade / Podcast*), leitura detalhada e painel administrativo CRUD para Especialista e Adm.
3. **Biblioteca (`/dashboard/biblioteca`, `/dashboard/biblioteca/planos/:id`)**:
   * Interface organizada em 4 abas fundamentais:
     * *3.1 Acervo de Livros*: Catálogo físico escolar, autopreenchimento de metadados via **Google Books API** e controle de empréstimos.
     * *3.2 Videoaulas*: Pesquisa e reprodução de vídeos educativos consumindo a **YouTube Data API v3**.
     * *3.3 Conteúdo Web*: Pesquisa didática via widget oficial do **Google Programmable Search Engine** (`cx`, sem chave de API).
     * *3.4 Planos de Estudos*: Trilhas personalizadas integrando livros, vídeos e conteúdos web, com tela de detalhe (`/dashboard/biblioteca/planos/:id`) e compartilhamento por turmas.
4. **Eventos / Agenda (Portal Público `/` e Painel `/dashboard/agenda`)**:
   * *4.1 Calendário*: No Portal Público (`components/Portal/calendario/Calendario.jsx`), visão *read-only* dos eventos institucionais e feriados (`GET /api/eventos`). No Dashboard (`?tab=calendario`), soma os eventos institucionais aos eventos pessoais do usuário logado e suporta cadastro em massa.
   * *4.2 Horários Escolares (`?tab=horarios`)*: Grade semanal por turma com geração automática e movimentação de aulas via `@dnd-kit` (`HorariosEscolares.jsx`).
5. **Acadêmico (`/dashboard/turmas`, `/boletim`, `/disciplinas`, `/periodos-letivos`, `/ciclos`, `/professores`)**:
   * *5.1 e 5.2 Turmas, Matrículas, CSV e Boletim*: Especialista/Adm gerenciam turmas, enturmam alunos, importam o CSV consolidado (inclusive multi-período) e geram boletins; Professor consulta suas turmas e alunos; Aluno visualiza seu Boletim detalhado com gráficos **Recharts**. *(Proibido criar interfaces de atividades avulsas ou chamada diária manual).*
   * *5.3 Período Letivo (`/dashboard/periodos-letivos`)*: Configuração de bimestres/trimestres/semestres e sincronização com a Agenda.
   * *5.4 Ciclos e Turnos (`/dashboard/ciclos`)* e *5.5 Disciplinas (`/dashboard/disciplinas`)*: Matriz curricular, carga horária e habilidades da BNCC.
   * *5.6 Professores (`/dashboard/professores`)*: Confirmação/recusa de vínculo institucional e alocação de disciplinas.
6. **Gestão do Usuário (`/dashboard/configuracoes`, `/dashboard/usuarios`)**:
   * Edição de perfil pessoal, avatar e senha (`/dashboard/configuracoes`), além do controle administrativo de usuários, papéis e vínculos pendentes (`/dashboard/usuarios`, exclusivo do Adm).
7. **Geral (`/dashboard/geral`)**:
   * Painel analítico inicial para **todos os perfis**, renderizando visões especializadas (`padrao`, `professor`, `bibliotecario`, `especialista`, `adm`) com gráficos **Recharts**.
8. **Módulos Transversais**:
   * *T1. Notificações*: Central no cabeçalho (`NotificacoesHeader.jsx`) e modal de criação para turmas/usuários.
   * *T2. Assistente Dona Nana (`/dashboard/dona-nana`, `/dashboard/dona-nana/configuracao`)*: Chat dedicado, widget flutuante global (`DonaNanaFloatingWidget.jsx`) e tela de configuração da persona/System Prompt (Especialista e Adm).

### Matriz de Rotas Protegidas do Dashboard (`src/App.jsx`)
| Rota | Módulo | Roles Permitidas |
|---|---|---|
| `/dashboard/geral` | 7 | todas (`aluno`, `professor`, `bibliotecaria`, `especialista`, `adm`, `padrao`) |
| `/dashboard/biblioteca` · `/dashboard/biblioteca/planos/:id` | 3 / 3.4 | todas |
| `/dashboard/agenda` (`?tab=calendario\|horarios`) | 4.1 / 4.2 | todas |
| `/dashboard/boletim` | 5.2 | `aluno`, `adm` (`padrao` por compatibilidade) |
| `/dashboard/turmas` | 5.1 / 5.2 | `professor` (consulta), `especialista`, `adm` |
| `/dashboard/disciplinas` | 5.5 | `aluno`, `professor`, `especialista`, `adm` (`padrao`) |
| `/dashboard/periodos-letivos` · `/ciclos` · `/professores` | 5.3 / 5.4 / 5.6 | `especialista`, `adm` |
| `/dashboard/noticias` | 2 | `especialista`, `adm` |
| `/dashboard/usuarios` | 6 | `adm` |
| `/dashboard/configuracoes` | 6 | todas |
| `/dashboard/dona-nana` · `/dashboard/dona-nana/configuracao` | T2 | todas · `especialista`, `adm` |
| `/dashboard/espera` | 1 | professor autenticado com confirmação pendente |

---

## 5. Navegação Centralizada e RBAC (`dashboardNav.js` e `rolesRoutes.js`)
* Toda nova página do painel exige obrigatoriamente **dois registros sincronizados**:
  1. Rota em [`src/App.jsx`](./src/App.jsx) envolvida por `<ProtectedRoute allowedRoles={[...]} />`.
  2. Entrada declarativa em [`src/utils/dashboardNav.js`](./src/utils/dashboardNav.js) (`NAV_STRUCTURE`), que funciona como **fonte única da verdade** para o menu lateral (`Aside.jsx`), a navegação interna de abas (`ModuloNav.jsx`) e o cabeçalho contextual (`BoasVindasCard.jsx`).
* A normalização de papéis e a rota inicial pós-login residem em [`src/utils/rolesRoutes.js`](./src/utils/rolesRoutes.js): `padrao` (legado) converge para `aluno`, `bibliotecario` converge para `bibliotecaria`, e `getRotaInicial()` direciona todos os perfis para `/dashboard/geral`.

---

## 6. Estrutura Base de Diretórios
```text
portal-front/src/
├── main.jsx · App.jsx · index.css
├── contexts/        # authContext.js (contexto de autenticação consumido por AuthProvider/useAuth)
├── layouts/         # Portal/PortalLayout.jsx | Dashboard/DashboardLayout.jsx
├── pages/           # Portal/ (Home, Login, Noticia) | Dashboard/ (Geral, Biblioteca, PlanoDetalhe, Agenda, Boletim, Turma,
│                    #   Disciplinas, Ciclos, PeriodoLetivo, Professores, Usuarios, Noticias, Configuracoes, DonaNana,
│                    #   ConfiguracaoDonaNana, EsperaProfessor) | NotFound.jsx
├── components/      # AuthProvider, ProtectedRoute, ErrorBoundary, ScrollToTop
│   ├── Portal/      # Navbar, Hero, Footer, calendario/, noticia/, podcast/, sobre/
│   └── Dashboard/   # Aside, Header, NotificacoesHeader, common/, <modulo>/ (agenda, biblioteca, boletim, turmas,
│                    #   disciplinas, periodoLetivo, professores, usuarios, configuracoes, dona-nana, geral/<papel>/)
├── hooks/           # use*.js na raiz (useAuth, useEventos, useNoticias) + <dominio>/ (biblioteca, Boletim, geral/<papel>)
├── services/        # api.js (fetch central da API) + <dominio>Service.js + biblioteca/ (biblioteca, youtube, googleBooks, planos)
└── utils/           # dashboardNav.js, rolesRoutes.js, academicoSchemas.js (Zod), formatters.js, agenda*, notificacoesEventos.js
```

---

## 7. Comunicação com a API, Schemas Zod e Contrato (`apiContract.md`)
* Toda requisição HTTP para o **backend Laravel** passa obrigatoriamente por [`src/services/api.js`](./src/services/api.js) (que injeta `Authorization: Bearer <token>`, trata `204 No Content` e lança `Error` amigável em português).
* Apenas as integrações diretas com APIs públicas externas do Google ([`src/services/biblioteca/youtubeService.js`](./src/services/biblioteca/youtubeService.js) e [`src/services/biblioteca/googleBooksService.js`](./src/services/biblioteca/googleBooksService.js)) utilizam `fetch` próprio. Componentes **nunca** executam `fetch` diretamente.
* As chaves enviadas e recebidas em `src/services/` devem respeitar estritamente o [`apiContract.md`](../apiContract.md). No domínio Acadêmico, payloads da API e formulários são revalidados em runtime pelos schemas **Zod** em [`src/utils/academicoSchemas.js`](./src/utils/academicoSchemas.js), espelhando 1:1 os Data Objects (`Spatie Laravel Data`) do backend.

---

## 8. Estados de Tela Obrigatórios
Toda tela assíncrona deve tratar visualmente:
1. **Carregando**: Spinner ou *placeholder* visual indicando que os dados estão sendo buscados.
2. **Erro Amigável**: Alerta ou mensagem explicativa em português (ex.: *"Não foi possível carregar os dados no momento. Tente novamente mais tarde."*).
3. **Vazio**: Mensagem amigável quando a consulta não retornar registros (ex.: *"Nenhum livro encontrado no acervo."*).

---

## 9. Estilização, CSS e Padrão de Gráficos (`Recharts`)
* Prefira as classes nativas do **Bootstrap 5** (`d-flex`, `gap-3`, `rounded-4`, `btn`, `card`).
* Para estilos personalizados, utilize arquivos `.css` isolados ao lado do respectivo componente ou layout (ex.: `noticias.css`), respeitando estritamente letras maiúsculas/minúsculas no `import`.
* Cores devem utilizar as variáveis CSS globais definidas em `index.css` (ex.: `var(--cor-primaria)`).
* **Padrão Recharts**: Todos os gráficos e indicadores analíticos (comparativos de notas, taxas de presença por turma, frequência por disciplina, gráficos de rosca/donut) devem utilizar os componentes declarativos do `recharts` (`<ResponsiveContainer>`, `<BarChart>`, `<PieChart>`, `<CartesianGrid>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<Legend>`).

---

## 10. Checklist de Checagem: "Login With Google", Chaves de API e CORS Local
Sempre que configurar ou depurar o login com Google ou as integrações da Biblioteca:
1. **SDK Google Identity Services no `index.html`**:
   * Verificar a presença de `<script src="https://accounts.google.com/gsi/client" async defer></script>`.
2. **Variáveis de Ambiente (`portal-front/.env`)**:
   * `PORT=5173`
   * `VITE_API_URL=http://localhost:8000/api`
   * `VITE_GOOGLE_CLIENT_ID=<Client ID OAuth 2.0 Web configurado no Google Cloud Console>`
   * `VITE_YOUTUBE_API_KEY=<Chave de API com YouTube Data API v3 ativada — usada na aba Videoaulas>`
   * `VITE_GOOGLE_BOOKS_API_KEY=<Chave de API com Books API ativada — usada no autopreenchimento de livros do Acervo>`
   * *(Nota: A aba Conteúdo Web utiliza o widget oficial do Google Programmable Search Engine `cx` e não exige chave no `.env`).*
3. **Porta Fixa, Origem Autorizada e COOP (`vite.config.js`)**:
   * O servidor Vite deve rodar em `http://localhost:5173` com `strictPort: true` (para coincidir com *Authorized JavaScript Origins* no Google Cloud Console e com `config/cors.php` no backend).
   * Configurar o header `Cross-Origin-Opener-Policy: same-origin-allow-popups` no `vite.config.js` (em `server` e `preview`) para permitir que o popup do Google envie a credencial JWT via `window.postMessage`.
4. **Backend Local (SSL e CORS)**:
   * Certificar-se de que o PHP local possui `C:\php\extras\ssl\cacert.pem` configurado em `curl.cainfo` e `openssl.cafile` no `php.ini` (veja [`../portal-back/AGENTS.md`](../portal-back/AGENTS.md)).

---

## 11. Dívidas Técnicas Conhecidas
* **Utilitários duplicados da Agenda**: `agendaUtils.js` e `agendaConfig.js` existem tanto em `src/utils/` quanto em `src/components/Dashboard/agenda/`.
* **Dependências redundantes/acidentais no `package.json`**: pacotes `"i"` e `"rolldown"` listados em `dependencies`, além da coexistência de `react-router` e `react-router-dom`.
* **Mocks residuais**: `dadosTopLivrosMock.js`, `materiasProfessorMock.js` e `noticiasMock.js` ainda permanecem no código como dados estáticos/fallback.
* **Ponte de serviço**: `src/services/bibliotecaService.js` atua apenas como reexport para `src/services/biblioteca/bibliotecaService.js`.
* **Capitalização heterogênea de pastas**: coexistência de convenções em `src/hooks/` e `src/components/Dashboard/` (ex.: `Boletim/` vs `biblioteca/`, `periodoLetivo/` vs `dona-nana/`) — atenção redobrada ao *case-sensitivity* nos `import`s para não quebrar builds Linux (CI/Railway).

