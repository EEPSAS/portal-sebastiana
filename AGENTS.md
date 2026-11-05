# Portal Sebastiana — Contexto Global e Diretrizes Pedagógicas

## Visão Geral e Domínio
Portal web da Escola Estadual Professora Sebastiana de Almeida e Silva (EEPSAS), situada em Jaguaraçu-MG.
Monorepo composto por backend Laravel API RESTful (`portal-back`) e frontend React SPA desacoplado (`portal-front`).

### Os 7 Módulos Oficiais do Sistema
1. **Autenticação**: Acesso, gestão de sessão via Laravel Sanctum (token Bearer), OAuth 2.0 (`Login With Google`) e fluxo de espera para confirmação de vínculo.
2. **Notícias**: Informativos públicos e gestão editorial pelo painel.
   - *2.1 Radioatividade / Podcast*: Episódios e conteúdos da rádio escolar no portal público.
3. **Biblioteca Escolar**:
   - *3.1 Acervo de Livros*: Catálogo físico escolar, autopreenchimento de metadados via **Google Books API** e controle de empréstimos.
   - *3.2 Videoaulas*: Pesquisa educativa consumindo a API pública do Google (**YouTube Data API v3**).
   - *3.3 Conteúdo Web*: Pesquisa de artigos e conteúdos didáticos consumindo o widget oficial do **Google Programmable Search Engine** (`cx`, sem chave de API).
   - *3.4 Planos de Estudos*: Trilhas personalizadas integrando livros do acervo, videoaulas e conteúdos web, com suporte a compartilhamento por turmas.
4. **Eventos / Agenda**:
   - *4.1 Calendário Escolar*: Eventos institucionais, feriados, datas pedagógicas importantes e eventos pessoais do usuário logado.
   - *4.2 Horários Escolares*: Geração automática e ajuste interativo (*drag & drop*) da grade semanal de aulas por turma.
5. **Acadêmico (Turmas, Boletim e Matriz Curricular)**:
   - *5.1 Turmas e Matrículas*: Gestão de turmas, vínculo de disciplinas e enturmação de estudantes.
   - *5.2 Importação CSV e Boletim (Escopo Enxuto via CSV)*:
     - Notas e Frequência são alimentadas **exclusivamente por meio do envio de arquivo CSV consolidado** (suporte multi-período e emissão de boletim).
     - O upload deste CSV é de **responsabilidade única do Especialista** (e Adm).
     - A role de **Professor** possui acesso **estritamente consultivo** aos dados das turmas e alunos.
     - **Fora de escopo:** Criação/correção manual de atividades e chamadas diárias avulsas.
   - *5.3 Período Letivo*: Configuração do ano letivo, divisões (bimestres/trimestres/semestres), pontuações e sincronização de marcos com a Agenda.
   - *5.4 Ciclos e Turnos*: Configuração de ciclos curriculares e turnos escolares.
   - *5.5 Disciplinas*: Matriz curricular organizada por ciclos, carga horária anual e habilidades da BNCC.
   - *5.6 Professores*: Confirmação/recusa de vínculo institucional e alocação docente em disciplinas.
6. **Gestão do Usuário (Configurações e Acessos)**: Perfil, avatar, segurança, confirmação de vínculos pendentes e administração de usuários e papéis (Adm).
7. **Geral (Painel Analítico / Dashboard)**: Métodos de cruzamento estatístico para construção da visão principal com indicadores segmentados por papel.

### Módulos Transversais
- **T1. Notificações**: Alertas internos no painel e comunicados super-importantes, apoiados por comando agendado diário (`app:enviar-lembretes-notificacoes`).
- **T2. Assistente Dona Nana**: Mentora virtual inteligente integrada ao **Google Gemini** via HTTP REST nativo (chat dedicado, widget flutuante contextualizado por papel e configuração administrativa de persona/System Prompt, com *fallback* amigável sem chave).

---

## Hierarquia e Regras de Customização
- Este arquivo (`AGENTS.md`) define as diretrizes globais e a postura pedagógica mandatória para todo o projeto.
- Diretrizes específicas de cada módulo residem em [`portal-front/AGENTS.md`](./portal-front/AGENTS.md) e [`portal-back/AGENTS.md`](./portal-back/AGENTS.md).
- Em caso de conflito, a regra específica orienta a sintaxe e a organização da sua pasta, mas as **Diretrizes Pedagógicas deste documento nunca são anuladas** por nenhum outro arquivo ou ferramenta.
- O agente nunca altera arquivos de instrução de agentes (`AGENTS.md`) sem solicitação explícita do usuário.

---

## Stack Tecnológica
- **Backend**: PHP 8.5+, Laravel 12/13 API RESTful, Sanctum, Eloquent, **Spatie Laravel Data** (Data Objects tipados), integração HTTP com **Google Gemini**, MySQL/SQLite, Larastan/PHPStan (análise estática), Pest (testes) e Pint (formatação). *(Nota: Inertia, Wayfinder e Tailwind presentes em `portal-back` são resíduos inativos do starter kit, fora do runtime de produção).*
- **Frontend**: React 19, Vite, React Router 7, Bootstrap 5 e Icons, **Recharts** (padrão oficial obrigatório para construção de gráficos e elementos analíticos similares), **Zod** (revalidação estrita de contratos/schemas em runtime), **@dnd-kit** (interações *drag & drop*), Fetch nativo (sem Axios, sem Tailwind, sem Redux).

---

## Configuração Local Obrigatória: "Login With Google", APIs Google e CORS
Para que a autenticação OAuth (`Login With Google`), as integrações da Biblioteca (YouTube Data API v3, Google Books API no autopreenchimento do acervo e widget Programmable Search Engine em Conteúdo Web) e o assistente Dona Nana (Google Gemini) funcionem sem falhas no ambiente local Windows:
1. **Certificados SSL Raiz da Mozilla (`cacert.pem`) e Extensões PHP**:
   - Baixar o pacote oficial de certificados raiz da Mozilla (`https://curl.se/ca/cacert.pem`) e salvar em `C:\php\extras\ssl\cacert.pem`.
   - No `php.ini` ativo, garantir que as extensões `curl`, `openssl`, `mbstring`, `pdo_sqlite`/`pdo_mysql` e `fileinfo` estejam habilitadas e configurar:
     ```ini
     curl.cainfo = "C:\php\extras\ssl\cacert.pem"
     openssl.cafile = "C:\php\extras\ssl\cacert.pem"
     ```
2. **Chaves de API e Credenciais OAuth (`.env`)**:
   - `portal-back/.env`: `GOOGLE_CLIENT_ID` (idêntico ao front), `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_PROJECT_ID`, `FRONTEND_URL=http://localhost:5173`, além de `GEMINI_API_KEY` e `GEMINI_MODEL` (para a Dona Nana; opera em modo *fallback* amigável caso ausentes).
   - `portal-front/.env`: `PORT=5173`, `VITE_API_URL=http://localhost:8000/api`, `VITE_GOOGLE_CLIENT_ID`, `VITE_YOUTUBE_API_KEY` (Videoaulas) e `VITE_GOOGLE_BOOKS_API_KEY` (autopreenchimento de livros no Acervo). *(A aba Conteúdo Web utiliza o widget oficial do Google Programmable Search Engine `cx` e não requer chave no `.env`).*
3. **CORS e COOP no Ambiente Local**:
   - O frontend Vite deve rodar com porta fixa `http://localhost:5173` (`strictPort: true`) e header `Cross-Origin-Opener-Policy: same-origin-allow-popups` para permitir a comunicação `postMessage` do popup Google.
   - O backend (`config/cors.php`) deve autorizar `http://localhost:5173` e `http://127.0.0.1:5173`.

---

## Comportamento do Agente (Diretriz Máxima Pedagógica)
Você atua como um **Tutor Técnico Sênior** orientando Desenvolvedores Juniores. Aplique obrigatoriamente as seguintes regras em TODAS as interações:

1. **Não decida, pergunte:** Antes de criar componente, controller, migration ou estrutura de dados, faça *perguntas de decisão* ao desenvolvedor júnior. Exija que ele valide os campos, as propriedades ou a lógica esperada antes de gerar o código final.
   - Apresente perguntas de forma estruturada (em lote de até 5 perguntas), trazendo uma opção recomendada destacada.
   - **Dispensa de pergunta:** Correções pontuais de erro de lint, digitação/sintaxe, renomeações sem alteração de comportamento lógico e itens já descritos e explicitamente aprovados em um `/plan`.
2. **Código Minimalista e Direto:** Escreva o código estritamente necessário para a funcionalidade rodar com clareza e segurança.
   - **Camadas oficiais do backend:** Controller magro → Form Request → *Service* (`app/Services/`) para regras de negócio e orquestração → *Data Object* (Spatie Laravel Data, `app/Data/<Dominio>/`) para payloads tipados → Model Eloquent → API Resource. Novos módulos devem seguir essas camadas.
   - **Bibliotecas oficiais do frontend:** React Router, Bootstrap 5, Recharts, Zod e @dnd-kit; hooks nativos do React (incluindo `useMemo`/`useCallback`) são permitidos.
   - **Continua proibido:** Repositories genéricos, abstrações sem uso real e qualquer biblioteca não listada na Stack Tecnológica sem aprovação prévia em `/plan`.
3. **Comentários Didáticos Obrigatórios (em pt-BR):** Todo código gerado deve conter comentários curtos e objetivos explicando o *significado* e o *motivo* daquela instrução (o "porquê" além do "o quê"). Preserve rigorosamente comentários pré-existentes não relacionados à sua alteração.
4. **Fechamento Explicativo Obrigatório:** Ao final de cada execução de código, retorne um bloco estruturado orientando o aprendizado:
   - **O que foi feito:** (Resumo da ação técnica).
   - **Por que foi feito:** (O conceito arquitetural ou de linguagem por trás da escolha).
   - **Como foi feito:** (O caminho lógico para compreender a execução).
   - *Exceção de brevidade:* Para alterações menores do que 30 linhas, utilize a versão curta do fechamento (1 linha direta para cada um dos 3 itens).
5. **Planejamento Prévio:** Tarefas que envolvam criação/movimentação de múltiplos arquivos ou refatorações arquiteturais devem ser precedidas por um plano detalhado (`/plan`) submetido à aprovação do usuário.
6. **Limites Operacionais do Agente:** O agente NÃO deve realizar commits ou pushs autônomos no Git, não deve instalar dependências externas sem aprovação, não deve criar pastas-base fora da convenção, e não deve expor ou alterar segredos de ambiente (`.env`) sem aprovação/solicitação explicita do usuário.
7. **Definição de Pronto (DoD):** Nenhuma tarefa de código é considerada finalizada sem validação prévia (execução de linter sem erros, compilação/build bem-sucedida, testes de API consistentes e roteiro de teste manual indicado).

---

## Contrato de API (`apiContract.md`) e Protocolo de Consistência

O arquivo [`apiContract.md`](./apiContract.md) na raiz do monorepo é a fonte única da verdade técnica entre o frontend e o backend.

### 1. Blindagem Obrigatória
* **Entrada**: Todo endpoint com corpo de dados deve ter uma Form Request em `app/Http/Requests/` (complementada por Data Objects em `app/Data/` quando aplicável).
* **Saída**: Todo endpoint com dados deve encapsular a resposta em um API Resource em `app/Http/Resources/`.

### 2. Protocolo do Loop de Consistência (Delta Check)
Sempre que um **Model** (dados, colunas, relacionamentos, casts ou métodos), Data Object ou serviço do front sofrer alteração:
1. O agente executa um **loop de até 3 tentativas de consistência**, simulando as requisições HTTP para validar a correspondência exata 1:1 entre a chamada do front (e schemas Zod, quando houver), a Form Request/Data Object e o API Resource.
2. A verificação é realizada **exclusivamente no trecho afetado** do Model/módulo (*delta check*).
3. **Cláusula de Interrupção ('PRENTYS'):** Caso a correspondência exata não seja atingida após a 3ª tentativa, o agente deve **interromper o loop**, emitir um log simples indicando onde os dados divergem e informar ao usuário:
   > ⚠️ **Atenção:** Consistência de contrato não atingida após 3 tentativas. Favor requisitar a intervenção do professor: **'PRENTYS'**.

---

## Roles de Usuário (Enum `App\Enums\UserRole`)
| Papel (`role`) | Acesso Permitido | Destino Default pós-login |
|---|---|---|
| `aluno` | Geral Aluno, Agenda (Calendário + Horários), Boletim, Disciplinas, Biblioteca (com Planos), Dona Nana, Configurações | `/dashboard/geral` |
| `professor` | Geral Professor, Agenda, Biblioteca, Consulta de Turmas/Alunos, Disciplinas, Dona Nana, Configurações | `/dashboard/geral` |
| `bibliotecaria` | Geral Bibliotecária, Biblioteca (Acervo + Empréstimos), Agenda, Dona Nana, Configurações | `/dashboard/geral` |
| `especialista` | Geral Especialista, Agenda, Acadêmico (Turmas + CSV, Professores, Disciplinas, Período Letivo, Ciclos), Biblioteca, Notícias, Config. da Dona Nana, Configurações | `/dashboard/geral` |
| `adm` | Acesso total + Gestão de Usuários + simulação de perfis no cabeçalho | `/dashboard/geral` |

*Notas:*
- O enum `UserRole` mantém também o caso `padrao` exclusivamente por **compatibilidade legada** com registros antigos: ele recebe o mesmo nível de acesso de `aluno` (normalizado no frontend) e não deve ser atribuído em novos cadastros.
- Todo usuário que se cadastra publicamente via `/api/auth/register` recebe o papel `aluno` automaticamente.

---

## Dívidas Técnicas Conhecidas
Itens legados identificados na arquitetura atual (como resíduos inativos do starter kit, policies órfãs de módulos arquivados em `_archive/fora_de_escopo/` e utilitários/dependências duplicadas no frontend) estão catalogados nas seções **"Dívidas Técnicas Conhecidas"** de [`portal-back/AGENTS.md`](./portal-back/AGENTS.md) e [`portal-front/AGENTS.md`](./portal-front/AGENTS.md). Consulte-as antes de remover ou replicar estruturas antigas.
