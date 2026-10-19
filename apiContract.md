# Contrato de API — Portal Sebastiana (`apiContract.md`)

Este documento é a **fonte única da verdade** para a integração entre o frontend React SPA (`portal-front`) e o backend Laravel API RESTful (`portal-back`).

---

## 1. Diretrizes Globais de Integração

1. **Protocolo e Formato**:
   * Comunicação exclusivamente via **HTTPS / HTTP RESTful** utilizando **JSON** (`Content-Type: application/json` e `Accept: application/json`).
   * URL Base: `VITE_API_URL` (com fallback padrão `http://localhost:8000/api`).
2. **Autenticação**:
   * Gerenciada pelo **Laravel Sanctum**.
   * Header obrigatório para rotas autenticadas: `Authorization: Bearer <token>` (armazenado no `localStorage`).
3. **Padrão de Resposta da API (Envelope JSON)**:
   * **Sucesso**: Status HTTP semântico (200, 201, 204) com payload padronizado por **Eloquent API Resource**.
   * **Erro**: Status HTTP semântico (400, 401, 403, 404, 422, 500) com payload contendo `message` amigável em pt-BR (e `errors` em caso de 422 Unprocessable Entity).
4. **Blindagem de Entrada e Saída**:
   * **Entrada**: 100% das requisições com corpo (POST/PUT/PATCH) passam obrigatoriamente por Form Requests em `app/Http/Requests/`.
   * **Saída**: 100% das respostas com dados passam obrigatoriamente por API Resources em `app/Http/Resources/`.

---

## 2. Protocolo de Governança e Validação do Contrato

### 2.1 Gatilho de Atualização (Delta Check)
Sempre que um **Model**, **Migration**, **Form Request**, **API Resource** ou serviço do frontend sofrer modificação, o trecho afetado deste contrato **deve ser atualizado imediatamente**.

### 2.2 Protocolo de Loop de Consistência (Até 3 Tentativas)
1. **Simulação HTTP**: O agente simula a requisição correspondente, validando:
   * *Entrada:* Se os campos enviados pelo serviço front batem exatamente com as regras da Form Request.
   * *Saída:* Se as chaves do payload entregues pelo API Resource batem exatamente com as consumidas no frontend.
2. **Escopo Restrito**: A validação é realizada **apenas no trecho do módulo modificado** na interação atual.
3. **Critério de Aprovação**: Correspondência exata 1:1 entre os lados.
4. **Cláusula de Interrupção ('PRENTYS')**:
   * Caso haja divergência não sanada após a 3ª tentativa de ajuste:
     * O loop é interrompido imediatamente.
     * É emitido um log simples indicando onde os dados não correspondem.
     * É exibido o aviso oficial ao usuário:
       > ⚠️ **Atenção:** Consistência de contrato não atingida após 3 tentativas. Favor requisitar a intervenção do professor: **'PRENTYS'**.

---

## 3. Matriz de Endpoints e Paridade dos 7 Módulos Oficiais

### Módulo 1: Autenticação
*Gerenciamento de sessão, registro inicial e usuário autenticado.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front (`src/services/`) | Descrição |
|---|---|---|---|---|---|---|
| `POST` | `/api/auth/google` | Público | `AuthGoogleRequest` | `AuthUserResource` | `authService.googleLogin()` | Login e auto-cadastro via Google OAuth (com turma em standby) |
| `POST` | `/api/auth/login` | Público | `AuthLoginRequest` | `AuthUserResource` | `authService.login()` | Login tradicional e emissão do token Sanctum (fallback) |
| `POST` | `/api/auth/register` | Público | `AuthRegisterRequest` | `AuthUserResource` | `authService.register()` | Auto-cadastro (recebe role `aluno`) |
| `POST` | `/api/auth/logout` | Autenticado | N/A | Mensagem 200/204 | `authService.logout()` | Invalida o token atual |
| `GET` | `/api/user` | Autenticado | N/A | `UsuarioResource` | `authService.getUser()` | Retorna o usuário logado e permissões |

#### Especificação de Payload: `UsuarioResource`
Envelope seguro de dados do usuário autenticado retornado em `/api/user`, `/api/auth/login`, `/api/auth/google` e `/api/auth/register`:
```json
{
  "id": 1,
  "name": "Yasmin Teixeira",
  "nickname": "Yasmin",
  "email": "yasmin.teixeira@sebastiana.edu.br",
  "telefone": "(31) 98888-0001",
  "avatar": "http://localhost:8000/storage/avatars/avatar.webp",
  "data_nascimento": "2008-05-14",
  "google_vinculado": false,
  "tem_senha": true,
  "role": "aluno",
  "role_label": "Aluno",
  "turma": "1º Ano A - Ensino Médio",
  "turma_id": 1,
  "ativo": true,
  "permissoes": []
}
```
* **Nota sobre `turma` e `turma_id`**: Retorna a string com o `nome_identificador` e o ID numérico da turma ativa do aluno (matrícula com status `Ativo`). Caso o usuário não seja aluno ou não possua matrícula ativa vinculada, os valores retornados são `null`.

---

### Módulo 2: Notícias
*Informativos escolares e publicações institucionais.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/noticias` | Público | N/A | `NoticiaResource` (Coleção) | `noticiasService.listarNoticias()` | Sem parâmetros: top 5 (Home). Com `?page`/`?per_page`: paginado (padrão 10). `?all=true`: todas |
| `GET` | `/api/noticias/{id}` | Público | N/A | `NoticiaResource` | `noticiasService.obterNoticia()` | Detalhes de uma notícia específica |
| `POST` | `/api/noticias` | Especialista / Adm (+ quem tiver `criar_noticia`) | `StoreNoticiaRequest` | `NoticiaResource` | `noticiasService.criarNoticia()` | Cria nova notícia escolar (autor = usuário logado) |
| `PUT` | `/api/noticias/{id}` | Especialista / Adm (+ autor com `editar_noticia_propria`) | `UpdateNoticiaRequest` | `NoticiaResource` | `noticiasService.atualizarNoticia()` | Atualiza notícia existente |
| `DELETE` | `/api/noticias/{id}` | Especialista / Adm | N/A | Mensagem 200 | `noticiasService.excluirNoticia()` | Remove notícia |

* **Regra de destaque**: ao criar/atualizar com `destaque: true`, qualquer outra notícia em destaque é desmarcada (apenas uma notícia principal por vez).

#### Especificação de Payload: Entrada (`StoreNoticiaRequest` / `UpdateNoticiaRequest`)
```json
{
  "titulo": "string (obrigatório no POST, máx. 255)",
  "conteudo": "string (obrigatório no POST)",
  "categoria": "string | null (máx. 100, padrão 'Geral')",
  "descricao": "string | null (máx. 500; se vazio, gerado dos 160 primeiros caracteres do conteúdo)",
  "url_foto": "string | null (máx. 2048)",
  "url_miniatura": "string | null (máx. 2048)",
  "data_publicacao": "date | null",
  "destaque": "boolean | null"
}
```

#### Especificação de Payload: Saída (`NoticiaResource`)
```json
{
  "id": 1,
  "categoria": "Pedagógico",
  "titulo": "Semana de Orientação Pedagógica",
  "descricao": "Resumo da semana pedagógica.",
  "conteudo": "Texto completo da matéria.",
  "url_foto": "https://exemplo.com/foto.jpg",
  "url_miniatura": "https://exemplo.com/foto.jpg",
  "data_publicacao": "2026-10-16T15:00:00.000000Z",
  "destaque": true,
  "autor": { "id": 3, "name": "Clara Mendes", "nickname": "Clara" },
  "created_at": "2026-10-16T15:00:00.000000Z",
  "updated_at": "2026-10-16T15:00:00.000000Z"
}
```
* **Listagem paginada** (`?page`/`?per_page`): envelope padrão Laravel `{ "data": [NoticiaResource...], "links": {...}, "meta": { "current_page", "last_page", "per_page", "total" } }`.
* **Mapeamento interno**: `url_foto` ↔ coluna `imagem`, `url_miniatura` ↔ `miniatura`, `data_publicacao` ↔ `dataPublicacao` (via mutators/accessors do Model `Noticia`).

---

### Módulo 3: Biblioteca Escolar
*Acervo escolar com 3 abas fundamentais no painel.*

#### 3.1 Acervo de Livros Físicos e Empréstimos
| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/livros` | Público / Logado (Leitura para Aluno e Prof) | N/A | `LivroResource` (Coleção) | `bibliotecaService.listarLivros()` | Catálogo da biblioteca (pré-carrega os 5 últimos cadastrados; busca completa via `?q=`) |
| `GET` | `/api/livros/{id}` | Público / Logado | N/A | `LivroResource` | `bibliotecaService.detalharLivro()` | Detalhes e disponibilidade do livro |
| `POST` | `/api/livros` | Bibliotecária / Especialista / Adm | `StoreLivroRequest` | `LivroResource` | `bibliotecaService.cadastrarLivro()` | Cadastra exemplar no acervo (`codigo_livro`, `titulo`, `editora`, `autor`, `genero`, `data_lancamento`) |
| `POST` | `/api/livros/importar-csv` | Bibliotecária / Especialista / Adm | `ImportarLivrosCsvRequest` | `LivroResource` (Coleção) | `bibliotecaService.importarLivrosCSV()` | **Mass Assignment via CSV** (`titulo`, `editora`, `autor`, `genero`, `data_lancamento`, `codigo_livro`) |
| `PUT` | `/api/livros/{id}` | Bibliotecária / Especialista / Adm | `UpdateLivroRequest` | `LivroResource` | `bibliotecaService.editarLivro()` | Atualiza dados do exemplar |
| `DELETE` | `/api/livros/{id}` | Bibliotecária / Especialista / Adm | N/A | Mensagem 200/204 | `bibliotecaService.excluirLivro()` | Exclui exemplar do acervo |
| `POST` | `/api/emprestimos/solicitar` | Logado | `SolicitarEmprestimoRequest`| `EmprestimoResource` | `bibliotecaService.solicitarEmprestimo()` | Solicita retirada de livro |
| `GET` | `/api/emprestimos/meus-emprestimos` | Logado | N/A | `EmprestimoResource` (Coleção)| `bibliotecaService.meusEmprestimos()` | Consulta histórico pessoal |
| `PATCH`| `/api/emprestimos/{id}/status` | Bibliotecária / Especialista / Adm | `AtualizarStatusEmprestimoRequest`| `EmprestimoResource` | `bibliotecaService.atualizarEmprestimo()` | Aprova, renova ou registra devolução |

#### 3.2 Videoaulas (Google YouTube Data API)
*Consulta de vídeos e videoaulas educativas através de integração frontend com API do Google.*
* **Parâmetros da Consulta**: `q` (termo de busca educativa), `part=snippet`, `type=video`, `maxResults=12`, enriquecido com `videos?part=contentDetails,status` para captura automática da duração (`ISO 8601`).
* **Payload Esperado (Front)**:
  ```json
  {
    "videoId": "string (11 chars)",
    "title": "string",
    "description": "string",
    "thumbnail": "string (url)",
    "channelTitle": "string",
    "url": "string (https://www.youtube.com/watch?v=...)",
    "duration": "string (MM:SS ou HH:MM:SS)"
  }
  ```

#### 3.3 Conteúdo Web (Google Search API / Google Books API)
*Pesquisa de artigos, referências didáticas e materiais pedagógicos na web.*
* **Parâmetros da Consulta**: `q` (termo de busca acadêmica), `num=10`.
* **Payload Esperado (Front)**:
  ```json
  {
    "titulo": "string",
    "link": "string (url)",
    "snippet": "string (resumo)",
    "fonte": "string"
  }
  ```

#### 3.4 Planos de Estudos (Integração da Biblioteca)
*Trilhas de estudo personalizadas agrupando livros do acervo, videoaulas do YouTube e conteúdos didáticos web.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front (`src/services/biblioteca/planosService.js`) | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/planos-estudos` | Logado | N/A | `PlanoEstudoResource` (Coleção) | `planosService.listar()` | Lista os planos do usuário com contadores reais por tipo |
| `POST` | `/api/planos-estudos` | Logado | `StorePlanoEstudoRequest` | `PlanoEstudoResource` | `planosService.criar()` | Cria um novo plano de estudos |
| `GET` | `/api/planos-estudos/{id}` | Logado (Dono/Adm) | N/A | `PlanoEstudoResource` | `planosService.obterPorId()` | Detalhes do plano completo com itens aninhados |
| `DELETE` | `/api/planos-estudos/{id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.excluir()` | Remove o plano (itens associados em cascata) |
| `POST` | `/api/planos-estudos/{id}/itens` | Logado (Dono/Adm) | `StorePlanoEstudoItemRequest` | `PlanoEstudoItemResource` | `planosService.adicionarItem()` | Adiciona conteúdo ao plano (com prevenção de duplicata) |
| `DELETE` | `/api/planos-estudos/{id}/itens/{item_id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.removerItem()` | Remove o conteúdo do plano (preserva fonte original) |

---

### Módulo 4: Eventos / Agenda
*Calendário escolar unificado (Portal Público read-only e Agenda do Dashboard), datas importantes e feriados letivos.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/eventos` | Público / Logado (`sanctum` opcional) | N/A | `EventoResource` (Coleção) | `eventosService.listar()` | No Portal Público: retorna todos os eventos institucionais (Especialista/Adm). Logado: retorna eventos institucionais + eventos pessoais do próprio usuário logado |
| `GET` | `/api/eventos/datas-importantes`| Público / Logado (`sanctum` opcional) | N/A | `EventoResource` (Coleção) | `eventosService.datasImportantes()` | Destaques importantes no topo do painel/portal |
| `POST` | `/api/eventos` | Logado (Qualquer perfil) | `StoreEventoRequest` | `EventoResource` | `eventosService.criar()` | Registra evento: se criado por Especialista/Adm é público/institucional; se criado por outros perfis é privado (visível apenas pelo próprio criador) |
| `PUT` | `/api/eventos/{id}` | Logado (Dono / Especialista / Adm) | `UpdateEventoRequest` | `EventoResource` | `eventosService.atualizar()` | Atualiza evento (próprio ou institucional) |
| `DELETE`| `/api/eventos/{id}` | Logado (Dono / Especialista / Adm) | N/A | Mensagem 200/204 | `eventosService.excluir()` | Remove evento (próprio ou institucional) |

> **Regra de Visibilidade dos Calendários:** O calendário do Portal Público é uma visão *read-only* alimentada pelos eventos que o **Especialista / Adm** cadastra. No Dashboard, qualquer usuário logado pode cadastrar compromissos no seu calendário, porém eventos criados por alunos/professores/bibliotecárias ficam visíveis **somente para o próprio usuário que os criou**, enquanto os eventos do Especialista/Adm são visíveis para toda a comunidade escolar.

---

### Módulo 5: Turmas / Boletim (Escopo Enxuto via CSV)
*Notas e Frequência alimentadas exclusivamente por arquivo CSV. Sem tarefas manuais ou correções avulsas.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/turmas/resumo-geral` | Especialista / Prof / Adm | N/A | `TurmaResumoResource` (Coleção) | `turmasService.obterResumoGeral()` | Indicadores agregados e KPIs de todas as turmas |
| `GET` | `/api/turmas` | Especialista / Prof / Adm | N/A | `TurmaResource` (Coleção) | `turmasService.listarTurmas()` | Listagem de turmas para consulta |
| `POST` | `/api/turmas` | Especialista / Adm | `StoreTurmaRequest` | `TurmaResource` | `turmasService.criarTurma()` | Cadastra nova turma escolar |
| `PUT` | `/api/turmas/{turma_id}` | Especialista / Adm | `UpdateTurmaRequest` | `TurmaResource` | `turmasService.atualizarTurma()` | Atualiza dados cadastrais da turma |
| `DELETE`| `/api/turmas/{turma_id}` | Especialista / Adm | N/A | Mensagem 204/422 | `turmasService.excluirTurma()` | Exclui turma (bloqueia se houver alunos ativos) |
| `GET` | `/api/turmas/{turma_id}/alunos` | Especialista / Prof / Adm | N/A | `AlunoTurmaResource` (Coleção) | `turmasService.listarAlunosTurma()` | Alunos matriculados na turma (consulta) |
| `GET` | `/api/turmas/{turma_id}/alunos-disponiveis` | Especialista / Adm | N/A | `UsuarioResource` (Coleção) | `turmasService.listarAlunosDisponiveis()` | Alunos elegíveis para matrícula na turma |
| `GET` | `/api/matriculas` | Especialista / Prof / Adm | N/A | `MatriculaResource` (Coleção) | `turmasService.listarMatriculas()` | Relação nominal de todos os matriculados ativos |
| `POST` | `/api/matriculas` | Especialista / Adm | `StoreMatriculaRequest` | `MatriculaResource` | `turmasService.vincularAluno()` | Matricula/vincula aluno na turma |
| `PATCH`| `/api/matriculas/{matricula_id}/cancelar` | Especialista / Adm | `CancelarMatriculaRequest` | `MatriculaResource` | `turmasService.cancelarMatricula()` | Cancela/desvincula matrícula de aluno |
| `POST` | `/api/turmas/{turma_id}/importar-relatorio` | Especialista / Adm | `ImportarRelatorioTurmaRequest` | `RelatorioImportadoResource` | `turmasService.importarRelatorioCSV()` | **Upload único do CSV** com notas/faltas consolidadas, heurística de primeiro/último nome e desambiguação de homônimos (suporta `mapeamentos_alunos`) |
| `DELETE`| `/api/turmas/{turma_id}/dados-csv` | Especialista / Adm | N/A | Mensagem 200 | `turmasService.excluirDadosCsv()` | Exclui notas e faltas carregadas via CSV da turma (suporta ?periodo_letivo=) |
| `GET` | `/api/turmas/{turma_id}/notas` | Especialista / Prof / Adm | N/A | `NotaResource` (Coleção) | `turmasService.listarNotasTurma()` | Consulta notas lançadas na turma com filtros de período, disciplina e aluno (`aluno_id`) |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/boletim` | Aluno / Prof / Esp / Adm | N/A | `BoletimResource` | `boletimService.obterBoletim()` | Boletim consolidado de notas e faltas por trimestre |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma` | Aluno / Prof / Esp / Adm | N/A | `ComparativoTurmaResource` | `boletimService.obterComparativoTurma()` | Dados comparativos do aluno vs média da turma por disciplina |

> **Regra de Escopo:** O Professor possui acesso **estritamente consultivo** aos dados da turma e dos alunos. Não há telas nem rotas para cadastro diário de tarefas ou chamada manual. A criação de turmas e a vinculação de alunos são privativas do Especialista e Administrador.

---

### Módulo 6: Gestão do Usuário (Configurações)
*Perfil do usuário e controle administrativo.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `PUT` | `/api/usuarios/{id}` | Logado (próprio perfil) | `UpdateUsuarioRequest` | `UsuarioResource` | `usuarioService.atualizarPerfil()` | Atualiza nickname, nome, telefone, data de nascimento e senha (e-mail é fixo/bloqueado) |
| `POST` | `/api/usuarios/{id}/avatar` | Logado (próprio perfil) | `UploadAvatarRequest` | `UsuarioResource` | `usuarioService.uploadAvatar()` | Envia e atualiza a foto de perfil (avatar) |
| `DELETE` | `/api/usuarios/{id}/avatar` | Logado (próprio perfil) | N/A | `UsuarioResource` | `usuarioService.removerAvatar()` | Remove a foto de perfil atual do usuário |
| `GET` | `/api/usuarios` | Adm | N/A | `UsuarioResource` (Coleção) | `usuarioService.listarTodos()` | Gestão administrativa de usuários |
| `PATCH`| `/api/usuarios/{id}/bloquear` | Adm | N/A | `UsuarioResource` | `usuarioService.alternarBloqueio()` | Ativa ou desativa acesso do usuário |
| `PATCH`| `/api/usuarios/{id}/papel` | Adm | `AlterarPapelRequest` | `UsuarioResource` | `usuarioService.alterarPapel()` | Atualiza o `UserRole` do usuário |

---

### Módulo 7: Geral (Painel Analítico / Dashboard)
*Cruzamento de dados estatísticos para a visão geral (`/dashboard/geral`).*

| Método | Endpoint | Acesso | API Resource (Back) | Serviço Front | Dados Retornados por Perfil |
|---|---|---|---|---|---|
| `GET` | `/api/dashboard/geral` | Especialista / Prof / Adm | `DashboardGeralResource` | `geralService()` / `fetchDashboardGeral()` | Indicadores agregados (KPIs), médias por turma (0-10) e últimas atualizações reais |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/resumo-global` | Aluno / Prof / Esp / Adm | `AlunoResumoGlobalResource` | `dashboardService.obterResumoAluno()` | Média geral, percentual de frequência e avisos |
| `GET` | `/api/turmas/{turma_id}/resumo-gerencial` | Especialista / Adm | `EspecialistaResumoGerencialResource` | `dashboardService.obterResumoEspecialista()` | Médias por componente, evasão e índice de frequência |
| `GET` | `/api/turmas/{turma_id}/alunos-criticos` | Especialista / Adm | `AlunoCriticoResource` | `dashboardService.obterAlunosCriticos()` | Alunos com risco de retenção por falta ou nota |
| `GET` | `/api/turmas/{turma_id}/desempenho-componentes` | Professor / Especialista / Adm | `DesempenhoComponenteResource` | `dashboardService.obterDesempenhoTurma()` | Médias consolidadas por disciplina da turma |

#### Especificação de Payload: `DashboardGeralResource`
Payload retornado em `/api/dashboard/geral` para Especialistas, Professores e Administradores:
```json
{
  "kpis": {
    "total_alunos": 128,
    "media_geral": 8.4,
    "frequencia_media": "94.2%",
    "noticias_publicadas": 12,
    "total_turmas": 3
  },
  "resumo_turmas": {
    "medias": [
      { "id": 1, "turma": "1º Ano A - Ensino Médio", "nota": 8.5 },
      { "id": 2, "turma": "2º Ano B - Ensino Médio", "nota": 7.9 }
    ],
    "frequencias": [
      { "id": 1, "turma": "1º Ano A - Ensino Médio", "percentual": 96 },
      { "id": 2, "turma": "2º Ano B - Ensino Médio", "percentual": 92 }
    ]
  },
  "ultimas_atualizacoes": [
    {
      "id": "noticia-1",
      "tipo": "noticia",
      "texto": "Nova notícia publicada: Feira de Ciências 2026",
      "tempoAtras": "há 2 horas"
    },
    {
      "id": "nota-1",
      "tipo": "notas",
      "texto": "Notas atualizadas — 1º Ano A - Ensino Médio",
      "tempoAtras": "há 1 dia"
    }
  ]
}
```
* **Nota sobre Escopo**: Para o `especialista` e `adm`, os dados abrangem todas as turmas ativas da instituição. Para o `professor`, os KPIs e listagens de turmas são calculados dinamicamente com base nas turmas e disciplinas sob sua regência docente (com fallback automático para a visão da escola caso ainda não possua turmas atribuídas).

