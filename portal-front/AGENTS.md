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
* **Permitido**: React 19, Vite, React Router, Bootstrap 5 e Bootstrap Icons (via CDN no `index.html`), `fetch` nativo com JavaScript moderno (arrow functions, destructuring, `?.`, template literals, `async/await`).
* **Proibido sem aprovação prévia em `/plan`**:
  * Bibliotecas externas de estado ou HTTP (Redux, Zustand, Axios, React Query).
  * Frameworks de CSS adicionais ou componentes prontos (Tailwind, MUI, Chakra, AntDesign).
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
   * Formulário simples integrado a `authService.login()`. Armazena token Sanctum no `localStorage` e dados do usuário via `AuthProvider`.
2. **Notícias (`/`, `/noticias/:id`, `/dashboard/noticias`)**:
   * Feed público na Home, leitura detalhada e painel administrativo CRUD para Especialista e Adm.
3. **Biblioteca (`/dashboard/biblioteca`)**:
   * Interface organizada em 3 abas fundamentais:
     * *Acervo de Livros*: Catálogo físico escolar e controle de empréstimos.
     * *Videoaulas*: Pesquisa e reprodução de vídeos educativos consumindo a API pública do Google (YouTube).
     * *Conteúdo Web*: Busca de artigos e referências pedagógicas consumindo a API pública do Google (Search).
4. **Eventos / Agenda (`/dashboard/agenda`)**:
   * Calendário letivo escolar e listagem de datas comemorativas/reuniões.
5. **Turmas / Boletim (`/dashboard/turmas`, `/dashboard/geral`)**:
   * **Especialista**: Aba/tela para upload do arquivo CSV do diário escolar (`importarRelatorioCSV`).
   * **Professor**: Visualização consultiva de suas turmas e rendimento dos alunos.
   * **Aluno**: Visualização do Boletim com notas por disciplina, faltas e situação acadêmica.
   * *Atenção:* Não construa interfaces para criação manual de tarefas ou chamada diária avulsa.
6. **Configurações (`/dashboard/configuracoes`)**:
   * Edição de dados do perfil, alteração de senha e gestão de usuários (para Adm).
7. **Geral (`/dashboard/geral`)**:
   * Painel de indicadores com cruzamento estatístico customizado por perfil de usuário.

---

## 5. Estrutura Base de Diretórios
```
portal-front/src/
├── main.jsx                     # Renderiza AuthProvider e App
├── App.jsx                      # Declaração única de todas as rotas da aplicação
├── index.css                    # Estilos puramente globais (:root, body, resets)
├── layouts/                     # Portal/PortalLayout.jsx | Dashboard/DashboardLayout.jsx (+ .css)
├── pages/                       # Login.jsx | Portal/ (Home, Noticia) | Dashboard/ (Geral, Biblioteca, Turmas, Agenda, Noticias, Configuracoes)
├── components/                  # AuthProvider.jsx | ProtectedRoute.jsx | Portal/ | Dashboard/
├── hooks/                       # Custom hooks didáticos (useAuth, useEventos, useNoticias)
├── services/                    # api.js (único fetch central) | authService.js | eventosService.js | turmasService.js | bibliotecaService.js
└── utils/                       # Funções puras utilitárias (formatadores de data, helpers)
```

---

## 6. Comunicação com a API e Contrato (`apiContract.md`)
* Toda requisição HTTP passa obrigatoriamente por [`src/services/api.js`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/portal-front/src/services/api.js). Componentes nunca utilizam `fetch` direto.
* `api.js` injeta o header `Authorization: Bearer <token>` a partir do `localStorage`, trata respostas sem corpo (204) e lança `Error` amigável em português em caso de falha.
* As chaves enviadas e recebidas nos arquivos em `src/services/` devem respeitar estritamente as especificações do [`apiContract.md`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/apiContract.md) e dos Eloquent API Resources do backend.

---

## 7. Estados de Tela Obrigatórios
Toda tela assíncrona deve tratar visualmente:
1. **Carregando**: Spinner ou *placeholder* visual indicando que os dados estão sendo buscados.
2. **Erro Amigável**: Alerta ou mensagem explicativa em português (ex.: *"Não foi possível carregar os dados no momento. Tente novamente mais tarde."*).
3. **Vazio**: Mensagem amigável quando a consulta não retornar registros (ex.: *"Nenhum livro encontrado no acervo."*).

---

## 8. Estilização e CSS
* Prefira as classes nativas do **Bootstrap 5** (`d-flex`, `gap-3`, `rounded-4`, `btn`, `card`).
* Para estilos personalizados, utilize arquivos `.css` isolados ao lado do respectivo componente ou layout (ex.: `Noticias.css`).
* Cores devem utilizar as variáveis CSS globais definidas em `index.css` (ex.: `var(--cor-primaria)`).
