# Frontend — Convenções React e Mentoria Socrática

> As diretrizes pedagógicas e convenções gerais em `../AGENTS.md` são obrigatórias e aplicam-se integralmente aqui.

## Comandos do Projeto
- `npm run dev`: Servidor Vite | `npm run lint`: ESLint | `npm run build`: Build de produção.
- `.env` (baseado em `.env.example`): define `VITE_API_URL`.
- **Definição de Pronto:** `npm run lint` sem erros + `npm run build` ok + verificação manual na tela alterada.

## Stack e Limites Tecnológicos
- **Permitido:** React 19, Vite, React Router, Bootstrap 5 e Icons (CDN no `index.html`), `fetch` nativo.
- **Recursos JS:** Arrow functions, destructuring, `?.`, template literals, `async/await` com `try/catch`, `map/filter/find`.
- **Proibido sem aprovação prévia:**
  - Bibliotecas externas de estado ou HTTP (Redux, Zustand, Axios, React Query).
  - Componentes prontos (Tailwind, MUI, Chakra).
  - TypeScript ou abstrações avançadas (`useReducer`, `useMemo`, `useCallback`, `React.memo`, `lazy`).
  - Custom hooks genéricos em excesso (permitido apenas para consumo de API ex.: `useEventos`, e auth `useAuth`).

## Estrutura Base de Diretórios
```
portal-front/src/
├── main.jsx                     # Renderiza AuthProvider e App
├── App.jsx                      # Declaração única de todas as rotas
├── index.css                    # Estilos puramente globais (:root, body, resets)
├── layouts/                     # Portal/PortalLayout.jsx | Dashboard/DashboardLayout.jsx (+ .css)
├── pages/                       # Login.jsx | Portal/ (Home, Noticia) | Dashboard/ (Geral, Biblioteca, Turmas, Agenda, Noticias, Configuracoes)
├── components/                  # AuthProvider.jsx | ProtectedRoute.jsx | Portal/ | Dashboard/
├── hooks/                       # Custom hooks didáticos (useAuth, useEventos, useNoticias)
├── services/                    # api.js (único fetch) | authService.js | eventosService.js | noticiasService.js
└── utils/                       # Funções puras utilitárias (datas, formatações, categorias)
```
- **Page:** ligada a uma rota. **Component:** bloco reutilizável. Sem componentes "casca" vazios (1-2 linhas).

## Convenção de Nomenclatura
| Artefato | Padrão | Exemplo |
|---|---|---|
| Componentes, Pages e Layouts | `PascalCase.jsx` (nome do arquivo = componente) | `NoticiaCard.jsx` |
| Arquivos CSS vinculados | `PascalCase.css` (ao lado do componente) | `Noticias.css` |
| Pastas de domínio | Minúsculas, sem acento | `portal/`, `dashboard/`, `agenda/` |
| Custom Hooks | `useCamelCase.js` | `useAuth.js`, `useEventos.js` |
| Serviços de API | `camelCaseService.js` (exceto `api.js`) | `eventosService.js` |
| Utilitários | `camelCase.js` | `calendario.js` |
| Imagens em `public/img/` | Minúsculas com hífen, sem acento | `foto-escola.jpg` |
| Variáveis e funções | `camelCase`; constantes em `MAIUSCULA_SNAKE` | `usuarioAtivo`, `API_URL` |
| Event handlers | `handleAcao` interno, `onAcao` nas props | `handleSalvar` -> `onSalvar` |

## Convenção de Rotas (React Router)
- Declaradas exclusivamente em `src/App.jsx`. URLs minúsculas, substantivos no plural, item específico com `:id`.
- Rotas do painel sob `/dashboard` e protegidas por `ProtectedRoute`. Diferenças de permissão tratadas na página/menu.
- Toda navegação interna DEVE usar `<Link>` ou `<NavLink>` (SPA: sem recarregar a página). Nunca use `<a href>` interno ou `target="_blank"`.

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Home do portal escolar |
| `/login` | Público | Login de alunos e servidores |
| `/noticias/:id` | Público | Detalhe da notícia |
| `/dashboard` (-> `geral`) | Logado | Entrada do painel |
| `/dashboard/geral` | Logado | Visão geral do painel |
| `/dashboard/biblioteca` | Logado | Acervo escolar |
| `/dashboard/turmas` | Professor/Especialista/Adm | Gestão de turmas |
| `/dashboard/agenda` | Logado | Calendário e eventos |
| `/dashboard/noticias` | Especialista/Adm | CRUD de notícias |
| `/dashboard/configuracoes` | Logado | Perfil e preferências |
| `*` | Público | Fallback 404 |

## Serviços e Comunicação com API
- Toda requisição HTTP passa exclusivamente por `src/services/api.js`. Componentes nunca chamam `fetch` direto.
- `api.js` injeta `Authorization: Bearer <token>` do `localStorage`, trata 204 (sem corpo) e lança `Error` amigável em caso de falha.
- Módulos específicos exportam funções limpas (`listarEventos`, `criarEvento`). Tokens não são repassados por props.

## Autenticação e Sessão
- `AuthProvider` centraliza usuário em `useState`. Hook `useAuth()` expõe `{ user, login, logout, isAuthenticated }`.
- `ProtectedRoute` redireciona não autenticados para `/login`. Botão de sair deve invocar `logout()`.

## Hooks e Ensino de Estado (Regra Didática)
- `useState`: comentar o estado inicial, o que representa na memória e o evento que o altera.
- `useEffect`: comentar o motivo do efeito e o array de dependências (`[]` = executa uma vez na montagem).

## Estados de Tela Obrigatórios
Toda tela assíncrona deve tratar 3 estados: **Carregando** (spinner/loading), **Erro Amigável** (mensagem de falha) e **Vazio** (sem dados). Nunca use mock/dados falsos para mascarar erro da API.

## Estilização e Escopo de CSS
1. **Global (`index.css`):** `:root` (variáveis de cor), `body` e resets.
2. **Layout:** Arquivo próprio do layout (ex.: `DashboardLayout.css`).
3. **Componente:** Arquivo `.css` isolado ao lado do componente (`Noticias.css`).
- Prefira classes Bootstrap 5 (`d-flex`, `gap-3`, `rounded-4`, `btn`). `style={{}}` inline apenas para valores estritamente dinâmicos. Cores via variáveis CSS (`var(--cor-primaria)`).

## Código Legado e Transição
- Arquivos novos ou alterados devem seguir este guia na íntegra.
- Não refatore ou renomeie arquivos legados sem aprovação prévia em `/plan`.
