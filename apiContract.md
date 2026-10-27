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
| `GET` | `/api/noticias` | Público | N/A | `NoticiaResource` (Coleção) | `noticiasService.listar()` | Lista notícias publicadas (com paginação) |
| `GET` | `/api/noticias/{id}` | Público | N/A | `NoticiaResource` | `noticiasService.obterPorId()` | Detalhes de uma notícia específica |
| `POST` | `/api/noticias` | Especialista / Adm | `StoreNoticiaRequest` | `NoticiaResource` | `noticiasService.criar()` | Cria nova notícia escolar |
| `PUT` | `/api/noticias/{id}` | Especialista / Adm | `UpdateNoticiaRequest` | `NoticiaResource` | `noticiasService.atualizar()` | Atualiza notícia existente |
| `DELETE` | `/api/noticias/{id}` | Especialista / Adm | N/A | Mensagem 200/204 | `noticiasService.excluir()` | Remove notícia |

---

### Módulo 3: Biblioteca Escolar
*Acervo escolar com 4 abas fundamentais no painel (Acervo de Livros, Videoaulas, Conteúdo Web e Planos de Estudos).*

#### 3.1 Acervo de Livros Físicos e Empréstimos
*Suporta autopreenchimento bibliográfico via busca na Google Books API v1 (`searchGoogleBooks` em `googleBooksService.js`) diretamente no modal de cadastro.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/livros` | Público / Logado (Leitura para Aluno e Prof) | N/A | `LivroResource` (Coleção) | `bibliotecaService.listarLivros()` | Catálogo da biblioteca (pré-carrega os 5 últimos cadastrados; busca completa via `?q=`) |
| `GET` | `/api/livros/{id}` | Público / Logado | N/A | `LivroResource` | `bibliotecaService.detalharLivro()` | Detalhes e disponibilidade do livro |
| `POST` | `/api/livros` | Bibliotecária / Especialista / Adm | `StoreLivroRequest` | `LivroResource` | `bibliotecaService.cadastrarLivro()` | Cadastra exemplar no acervo (`codigo_livro`, `titulo`, `editora`, `autor`, `genero`, `data_lancamento`, `capa`, `quantidade_total`, `prateleira_localizacao`) |
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

#### 3.3 Conteúdo Web (Google Programmable Search Engine - CSE)
*Pesquisa de artigos, referências didáticas e materiais pedagógicos na web via widget oficial incorporado do Google.*
* **Integração**: Carregamento único do script `https://cse.google.com/cse.js?cx=a4b2ccff7fbbe46ad` e renderização explícita via `google.search.cse.element.render` (`overlayResults: false` e `linkTarget: '_blank'`) em `ConteudoWebAba.jsx`, exibindo os resultados diretamente dentro da página (não requer chave de API para a busca web).
* **Integração com Planos de Estudos**: Permite acessar cada resultado encontrado e salvá-lo no plano de estudos do usuário (`tipo: 'conteudo_web'`, `conteudo_id`, `titulo`, `url`, `fonte`, `descricao`, `thumbnail`).

#### 3.4 Planos de Estudos (Integração da Biblioteca e Compartilhamento por Turma)
*Trilhas de estudo personalizadas agrupando livros do acervo, videoaulas do YouTube e conteúdos didáticos web. O aluno visualiza apenas seus próprios planos e os planos compartilhados pelos professores para sua turma ativa; somente o professor (ou adm) pode compartilhar planos com turmas do 1º, 2º ou 3º ano.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front (`src/services/biblioteca/planosService.js`) | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/planos-estudos` | Logado | N/A | `PlanoEstudoResource` (Coleção) | `planosService.listar()` | Lista os planos do usuário (e planos compartilhados com a turma ativa do aluno) |
| `POST` | `/api/planos-estudos` | Logado | `StorePlanoEstudoRequest` | `PlanoEstudoResource` | `planosService.criar()` | Cria um novo plano de estudos |
| `GET` | `/api/planos-estudos/{id}` | Logado (Dono / Aluno da Turma / Adm) | N/A | `PlanoEstudoResource` | `planosService.obterPorId()` | Detalhes do plano completo com itens aninhados |
| `DELETE` | `/api/planos-estudos/{id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.excluir()` | Remove o plano (itens associados em cascata) |
| `POST` | `/api/planos-estudos/{id}/itens` | Logado (Dono/Adm) | `StorePlanoEstudoItemRequest` | `PlanoEstudoItemResource` | `planosService.adicionarItem()` | Adiciona conteúdo ao plano (com prevenção de duplicata) |
| `DELETE` | `/api/planos-estudos/{id}/itens/{item_id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.removerItem()` | Remove o conteúdo do plano (preserva fonte original) |
| `GET` | `/api/me/turmas-lecionadas` | Professor / Adm | N/A | `TurmaResource` (Coleção) | `planosService.listarTurmasLecionadas()` | Lista turmas vinculadas ao professor (com suporte a busca `?q=`) |
| `POST` | `/api/planos-estudos/{id}/compartilhar` | Professor (Dono) / Adm | `CompartilharPlanoEstudoRequest` | `PlanoEstudoResource` | `planosService.compartilhar()` | Compartilha (sincroniza) o plano com turmas de 1º, 2º ou 3º ano (`turma_ids`) |

---

### Módulo 4: Eventos / Agenda
*Calendário escolar, datas importantes e feriados letivos.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/eventos` | Público / Logado | N/A | `EventoResource` (Coleção) | `eventosService.listar()` | Lista eventos e datas do calendário |
| `GET` | `/api/eventos/datas-importantes`| Público / Logado | N/A | `EventoResource` (Coleção) | `eventosService.datasImportantes()` | Destaques no topo do painel/portal |
| `POST` | `/api/eventos` | Especialista / Adm | `StoreEventoRequest` | `EventoResource` | `eventosService.criar()` | Registra evento escolar |
| `PUT` | `/api/eventos/{id}` | Especialista / Adm | `UpdateEventoRequest` | `EventoResource` | `eventosService.atualizar()` | Atualiza evento |
| `DELETE`| `/api/eventos/{id}` | Especialista / Adm | N/A | Mensagem 200/204 | `eventosService.excluir()` | Remove evento |

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
| `PATCH`| `/api/matriculas/{matricula_id}/cancelar` | Especialista / Adm | N/A | `MatriculaResource` | `turmasService.cancelarMatricula()` | Cancela/desvincula matrícula de aluno |
| `POST` | `/api/turmas/{turma_id}/importar-relatorio` | Especialista | `ImportarRelatorioTurmaRequest` | `RelatorioImportadoResource` | `turmasService.importarRelatorioCSV()` | **Upload único do CSV** com notas/faltas consolidadas, heurística de primeiro/último nome e desambiguação de homônimos (suporta `mapeamentos_alunos`) |
| `DELETE`| `/api/turmas/{turma_id}/dados-csv` | Especialista / Adm | N/A | Mensagem 200 | `turmasService.excluirDadosCsv()` | Exclui notas e faltas carregadas via CSV da turma (suporta ?periodo_letivo=) |
| `GET` | `/api/turmas/{turma_id}/notas` | Especialista / Prof / Adm | N/A | `NotaResource` (Coleção) | `turmasService.listarNotasTurma()` | Consulta notas lançadas na turma com filtros de período, disciplina e aluno (`aluno_id`) |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/boletim` | Aluno / Prof / Esp / Adm | N/A | `BoletimResource` | `boletimService.obterBoletim()` | Boletim consolidado de notas e faltas |

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
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/resumo-global` | Aluno | `AlunoResumoGlobalResource` | `dashboardService.obterResumoAluno()` | Média geral, percentual de frequência e avisos |
| `GET` | `/api/turmas/{turma_id}/resumo-gerencial` | Especialista / Adm | `EspecialistaResumoGerencialResource` | `dashboardService.obterResumoEspecialista()` | Médias por componente, evasão e índice de frequência |
| `GET` | `/api/turmas/{turma_id}/alunos-criticos` | Especialista / Adm | `AlunoCriticoResource` (Coleção) | `dashboardService.obterAlunosCriticos()` | Alunos com risco de retenção por falta ou nota |
| `GET` | `/api/turmas/{turma_id}/desempenho-componentes` | Professor / Especialista | `DesempenhoComponenteResource` | `dashboardService.obterDesempenhoTurma()` | Médias consolidadas por disciplina da turma |
