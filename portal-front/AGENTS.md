# Frontend — Convenções React e Mentoria Socrática (`portal-front/AGENTS.md`)

> **Diretriz Máxima Pedagógica:** As diretrizes pedagógicas e convenções gerais em `../AGENTS.md` são obrigatórias e aplicam-se integralmente aqui.

---

## 1. Comandos e Definição de Pronto
* `npm run dev`: Inicia o servidor Vite local.
* `npm run lint`: Executa o ESLint para checagem estática de código.
* `npm run build`: Compila a aplicação para produção.
* **Definição de Pronto (DoD):** `npm run lint` sem erros + `npm run build` bem-sucedido + verificação manual na tela alterada + bloco de fechamento explicativo.

---

## 2. Stack Tecnológica e Limites de Bibliotecas
* **Permitido**: React 19, Vite, React Router, Bootstrap 5 e Bootstrap Icons (via CDN no `index.html`), **Recharts** (biblioteca padrão obrigatória para gráficos de barras, pizza/rosca e indicadores analíticos visuais), `fetch` nativo com JavaScript moderno (arrow functions, destructuring, `?.`, template literals, `async/await`).
* **Proibido sem aprovação prévia em `/plan`**:
  * Bibliotecas externas de estado ou HTTP (Redux, Zustand, Axios, React Query).
  * Frameworks de CSS adicionais ou componentes prontos (Tailwind, MUI, Chakra, AntDesign).
  * Construção manual de gráficos com SVG trigonométrico ou barras CSS improvisadas onde couber componente **Recharts**.
  * TypeScript ou abstrações avançadas (`useReducer`, `useMemo`, `useCallback`, `React.memo`, `lazy`).
  * Custom hooks genéricos em excesso (permitido apenas para consumo de serviços, ex.: `useAuth`, `useEventos`, `useNoticias`).

---

## 3. Mentoria Socrática no Frontend (UI/UX e Componentes)
Antes de criar qualquer componente, página, layout ou formulário, formule **perguntas de decisão** ao desenvolvedor júnior (em lote de até 5 perguntas com recomendação destacada):
1. *"Como podemos dividir visualmente esta tela em componentes menores e reutilizáveis?"*
2. *"Quais propriedades (`props`) este componente precisa receber para renderizar?"*
3. *"Quais variáveis de estado local (`useState`) serão necessárias e qual é o valor inicial de cada uma?"*
4. *"Como a tela deve se comportar visualmente nos 3 estados assíncronos: Carregando, Erro Amigável e Vazio?"*

---

## 4. Os 7 Módulos Oficiais no Frontend

1. **Autenticação (`/login`)**:
   * Formulário simples integrado a `authService.login()` e botão oficial **Login With Google** (`authService.googleLogin()`). Armazena token Sanctum no `localStorage` e dados do usuário via `AuthProvider`.
2. **Notícias (`/`, `/noticias/:id`, `/dashboard/noticias`)**:
   * Feed público na Home, leitura detalhada e painel administrativo CRUD para Especialista e Adm.
3. **Biblioteca (`/dashboard/biblioteca`)**:
   * Interface organizada em abas fundamentais:
     * *Acervo de Livros*: Catálogo físico escolar e controle de empréstimos.
     * *Videoaulas*: Pesquisa e reprodução de vídeos educativos consumindo a API pública do Google (YouTube Data API v3).
     * *Conteúdo Web*: Busca de livros, artigos e referências pedagógicas consumindo a API pública do Google (Google Books API).
     * *Planos de Estudos*: Trilhas personalizadas integrando livros, vídeos e conteúdos web.
4. **Eventos / Agenda (Portal Público `/` e Painel `/dashboard/agenda`)**:
   * **Unificação Conceitual dos 2 Calendários**:
     * *Calendário do Portal Público (`Calendario.jsx`)*: Visão **somente leitura (*read-only*)** que consome `GET /api/eventos` e exibe todos os eventos institucionais cadastrados pelo **Especialista / Adm** + feriados nacionais.
     * *Calendário do Dashboard (`Agenda.jsx`)*: Exibe os eventos institucionais do **Especialista / Adm** somados aos **eventos pessoais** criados pelo próprio usuário logado (que são visíveis exclusivamente para quem os criou).
5. **Turmas / Boletim (`/dashboard/turmas`, `/dashboard/boletim`)**:
   * **Especialista**: Aba/tela para upload do arquivo CSV do diário escolar (`importarRelatorioCSV`).
   * **Professor**: Visualização consultiva de suas turmas e rendimento dos alunos.
   * **Aluno**: Visualização do Boletim com notas por disciplina, faltas, gráficos **Recharts** e situação acadêmica.
   * *Atenção:* Não construa interfaces para criação manual de tarefas ou chamada diária avulsa.
6. **Configurações (`/dashboard/configuracoes`)**:
   * Edição de dados do perfil, alteração de senha e gestão de usuários (para Adm).
7. **Geral (`/dashboard/geral`)**:
   * Painel de indicadores com cruzamento estatístico e gráficos **Recharts** customizados por perfil de usuário.

---

## 5. Estrutura Base de Diretórios
```
portal-front/src/
├── main.jsx                     # Renderiza AuthProvider e App
├── App.jsx                      # Declaração única de todas as rotas da aplicação
├── index.css                    # Estilos puramente globais (:root, body, resets)
├── layouts/                     # Portal/PortalLayout.jsx | Dashboard/DashboardLayout.jsx (+ .css)
├── pages/                       # Portal/ (Home, Login, NoticiaDetalhe) | Dashboard/ (Geral, Biblioteca, Turma, Boletim, Agenda, Noticias, Configuracoes)
├── components/                  # AuthProvider.jsx | ProtectedRoute.jsx | Portal/ | Dashboard/
├── hooks/                       # Custom hooks didáticos para consumo de serviços (useAuth, useEventos, useNoticias)
├── services/                    # api.js (único fetch central da API) | authService.js | eventosService.js | turmasService.js | biblioteca/
└── utils/                       # Funções puras utilitárias compartilhadas (ex: agendaUtils.js)
```

---

## 6. Comunicação com a API e Contrato (`apiContract.md`)
* Toda requisição HTTP para o backend Laravel passa obrigatoriamente por [`src/services/api.js`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/portal-front/src/services/api.js). Componentes nunca utilizam `fetch` direto.
* `api.js` injeta o header `Authorization: Bearer <token>` a partir do `localStorage`, trata respostas sem corpo (204) e lança `Error` amigável em português em caso de falha.
* As chaves enviadas e recebidas nos arquivos em `src/services/` devem respeitar estritamente as especificações do [`apiContract.md`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/apiContract.md) e dos Eloquent API Resources do backend.

---

## 7. Estados de Tela Obrigatórios
Toda tela assíncrona deve tratar visualmente:
1. **Carregando**: Spinner ou *placeholder* visual indicando que os dados estão sendo buscados.
2. **Erro Amigável**: Alerta ou mensagem explicativa em português (ex.: *"Não foi possível carregar os dados no momento. Tente novamente mais tarde."*).
3. **Vazio**: Mensagem amigável quando a consulta não retornar registros (ex.: *"Nenhum livro encontrado no acervo."*).

---

## 8. Estilização, CSS e Padrão de Gráficos (`Recharts`)
* Prefira as classes nativas do **Bootstrap 5** (`d-flex`, `gap-3`, `rounded-4`, `btn`, `card`).
* Para estilos personalizados, utilize arquivos `.css` isolados ao lado do respectivo componente ou layout (ex.: `noticias.css`), respeitando estritamente letras maiúsculas/minúsculas no `import`.
* Cores devem utilizar as variáveis CSS globais definidas em `index.css` (ex.: `var(--cor-primaria)`).
* **Padrão Recharts**: Todos os gráficos e indicadores analíticos (comparativos de notas, taxas de presença por turma, frequência por disciplina, gráficos de rosca/donut) devem utilizar os componentes declarativos do `recharts` (`<ResponsiveContainer>`, `<BarChart>`, `<PieChart>`, `<CartesianGrid>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, `<Legend>`).

---

## 9. Checklist de Checagem: "Login With Google", Chaves de API e CORS Local
Sempre que configurar ou depurar o login com Google ou as abas externas da Biblioteca (Videoaulas e Conteúdo Web):
1. **SDK Google Identity Services no `index.html`**:
   * Verificar a presença de `<script src="https://accounts.google.com/gsi/client" async defer></script>`.
2. **Variáveis de Ambiente (`portal-front/.env`)**:
   * `VITE_API_URL=http://localhost:8000/api`
   * `VITE_GOOGLE_CLIENT_ID=<Client ID OAuth 2.0 Web configurado no Google Cloud Console>`
   * `VITE_YOUTUBE_API_KEY=<Chave de API com YouTube Data API v3 ativada>`
   * `VITE_GOOGLE_BOOKS_API_KEY=<Chave de API com Books API ativada>`
3. **Porta Fixa, Origem Autorizada e COOP (`vite.config.js`)**:
   * O servidor Vite deve rodar em `http://localhost:5173` com `strictPort: true` (para coincidir com *Authorized JavaScript Origins* no Google Cloud Console e com `config/cors.php` no backend).
   * Configurar o header `Cross-Origin-Opener-Policy: same-origin-allow-popups` no `vite.config.js` para permitir que o popup do Google envie a credencial JWT via `window.postMessage`.
4. **Backend Local (SSL e CORS)**:
   * Certificar-se de que o PHP local possui `C:\php\extras\ssl\cacert.pem` configurado em `curl.cainfo` e `openssl.cafile` no `php.ini` (veja `portal-back/AGENTS.md`).

