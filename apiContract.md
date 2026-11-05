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
  "status_confirmacao": "confirmado",
  "turma": "1º Ano A - Ensino Médio",
  "turma_id": 1,
  "ativo": true,
  "permissoes": []
}
```
* **Nota sobre `turma` e `turma_id`**: Retorna a string com o `nome_identificador` e o ID numérico da turma ativa do aluno (matrícula com status `Ativo`). Caso o usuário não seja aluno ou não possua matrícula ativa vinculada, os valores retornados são `null`.
* **Nota sobre `nickname` (privado)**: o apelido só é retornado quando quem consulta é o próprio dono (`/api/user`, login, cadastro e atualização do próprio perfil). Para qualquer outro usuário (inclusive Adm em `/api/usuarios`) o valor vem `null`. Em `NoticiaResource`, `autor.nickname` passa a repetir o `name` institucional.
* **Nota sobre `avatar`**: em `/api/auth/google`, a foto do Google só é gravada se o usuário ainda não tiver avatar; uma foto enviada via `POST /api/usuarios/{id}/avatar` nunca é sobrescrita por novo login. Requer `php artisan storage:link` para servir `/storage/avatars/*`.

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
Suporta envio tanto em `application/json` quanto em `multipart/form-data` (quando houver upload binário de imagens):
```json
{
  "titulo": "string (obrigatório no POST, máx. 255)",
  "conteudo": "string (obrigatório no POST)",
  "categoria": "string | null ('Geral', 'Avisos', 'Pedagógico', 'Eventos', 'Biblioteca', 'Projetos')",
  "descricao": "string | null (máx. 500; se vazio, gerado dos 160 primeiros caracteres do conteúdo)",
  "foto": "file | null (imagem de capa, máx. 5MB, mimes: jpeg, png, jpg, webp, gif)",
  "miniatura_arquivo": "file | null (imagem de miniatura, máx. 5MB, mimes: jpeg, png, jpg, webp, gif)",
  "url_foto": "string | null (máx. 2048, fallback para imagem de capa externa)",
  "url_miniatura": "string | null (máx. 2048, fallback para miniatura externa)",
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
*Acervo escolar com 4 abas fundamentais no painel (Acervo de Livros, Videoaulas, Conteúdo Web e Planos de Estudos).*

#### 3.1 Acervo de Livros Físicos e Empréstimos
*Suporta autopreenchimento bibliográfico via busca na Google Books API v1 (`searchGoogleBooks` em `googleBooksService.js`) diretamente no modal de cadastro.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/livros` | Público / Logado (Leitura para Aluno e Prof) | N/A | `LivroResource` (Coleção) | `bibliotecaService.listarLivros()` | Catálogo da biblioteca (pré-carrega os 5 últimos cadastrados; busca completa via `?q=`) |
| `GET` | `/api/livros/{id}` | Público / Logado | N/A | `LivroResource` | `bibliotecaService.detalharLivro()` | Detalhes e disponibilidade do livro |
| `GET` | `/api/emprestimos` | Logado (gestores da biblioteca recebem histórico global; demais usuários recebem apenas os próprios registros) | N/A | `EmprestimoResource` (Coleção) | `bibliotecaService.listarEmprestimos()` | Histórico usado no Geral da Bibliotecária para circulação, devoluções e destaque mensal |
| `GET` | `/api/dashboard/biblioteca/top-livros` | Bibliotecária / Especialista / Adm | N/A | `TopLivrosEmprestadosResource` (proposto) | `bibliotecaService.obterTopLivrosMaisEmprestados()` (pendente) | **Solicitação à equipe backend:** retornar os três livros mais emprestados de todo o histórico; rota ainda não implementada |
| `POST` | `/api/livros` | Bibliotecária / Especialista / Adm | `StoreLivroRequest` | `LivroResource` | `bibliotecaService.cadastrarLivro()` | Cadastra exemplar no acervo (`codigo_livro`, `titulo`, `editora`, `autor`, `genero`, `data_lancamento`, `capa`, `quantidade_total`, `prateleira_localizacao`) |
| `POST` | `/api/livros/importar-csv` | Bibliotecária / Especialista / Adm | `ImportarLivrosCsvRequest` | `LivroResource` (Coleção) | `bibliotecaService.importarLivrosCSV()` | **Mass Assignment via CSV** (`titulo`, `editora`, `autor`, `genero`, `data_lancamento`, `codigo_livro`) |
| `PUT` | `/api/livros/{id}` | Bibliotecária / Especialista / Adm | `UpdateLivroRequest` | `LivroResource` | `bibliotecaService.editarLivro()` | Atualiza dados do exemplar |
| `DELETE` | `/api/livros/{id}` | Bibliotecária / Especialista / Adm | N/A | Mensagem 200/204 | `bibliotecaService.excluirLivro()` | Exclui exemplar do acervo |
| `POST` | `/api/emprestimos/solicitar` | Logado | `SolicitarEmprestimoRequest`| `EmprestimoResource` | `bibliotecaService.solicitarEmprestimo()` | Cria a solicitação e reserva atomicamente um exemplar disponível; avisa a Bibliotecária com notificação interna importante contendo aluno, livro e número do pedido |
| `GET` | `/api/emprestimos/meus-emprestimos` | Logado | N/A | `EmprestimoResource` (Coleção)| `bibliotecaService.meusEmprestimos()` | Consulta histórico pessoal |
| `PATCH` | `/api/emprestimos/{id}/cancelar` | Titular da solicitação pendente | N/A | `EmprestimoResource` | `bibliotecaService.cancelarSolicitacaoEmprestimo()` | Cancela somente solicitação em status `solicitado` e libera o exemplar reservado |
| `PATCH`| `/api/emprestimos/{id}/status` | Bibliotecária / Especialista / Adm | `AtualizarStatusEmprestimoRequest`| `EmprestimoResource` | `bibliotecaService.atualizarEmprestimo()` | Aprova, renova ou registra devolução |

**Reserva de exemplares:** a disponibilidade é decrementada no momento da solicitação. O estado interno `reserva_ativa` distingue solicitações antigas (ainda sem baixa de estoque) das novas; a migration inicializa empréstimos ativos antigos como reservados e solicitações pendentes antigas como não reservadas. Aprovar não decrementa novamente uma reserva ativa; pedidos antigos sem reserva descontam o estoque ao aprovar. Recusar/cancelar libera somente reservas ativas, e registrar devolução libera o exemplar emprestado. As mudanças de estoque e status são transacionais para evitar solicitações concorrentes do último exemplar.

#### Solicitação pendente: Top 3 de livros mais emprestados
O endpoint proposto ainda não está disponível e fica registrado para implementação futura pela equipe backend. Deve contar os empréstimos de todo o histórico, ordenar pela quantidade decrescente e retornar até três livros:
```json
{
  "data": [
    {
      "posicao": 1,
      "livro_id": 1,
      "titulo": "Dom Casmurro",
      "autor": "Machado de Assis",
      "genero": "Literatura Brasileira",
      "capa_url": "https://exemplo.com/capa.jpg",
      "total_emprestimos": 52
    }
  ]
}
```
Enquanto a rota não estiver pronta, o frontend apresenta dados demonstrativos apenas no Top 3. Os demais indicadores consultam o endpoint existente `/api/emprestimos`.

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
*Trilhas de estudo personalizadas agrupando livros do acervo, videoaulas do YouTube e conteúdos didáticos web. O aluno visualiza apenas seus próprios planos e os planos compartilhados pelos professores para sua turma ativa; somente o professor (ou adm) pode compartilhar planos com turmas vinculadas às suas disciplinas.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front (`src/services/biblioteca/planosService.js`) | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/planos-estudos` | Logado | N/A | `PlanoEstudoResource` (Coleção) | `planosService.listar()` | Lista os planos do usuário (e planos compartilhados com a turma ativa do aluno) |
| `POST` | `/api/planos-estudos` | Logado | `StorePlanoEstudoRequest` | `PlanoEstudoResource` | `planosService.criar()` | Cria um novo plano de estudos (`nome`, `disciplina_id`, `disciplina`, `conteudo`) |
| `GET` | `/api/planos-estudos/{id}` | Logado (Dono / Aluno da Turma / Adm) | N/A | `PlanoEstudoResource` | `planosService.obterPorId()` | Detalhes do plano completo com itens aninhados |
| `DELETE` | `/api/planos-estudos/{id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.excluir()` | Remove o plano (itens associados em cascata) |
| `POST` | `/api/planos-estudos/{id}/itens` | Logado (Dono/Adm) | `StorePlanoEstudoItemRequest` | `PlanoEstudoItemResource` | `planosService.adicionarItem()` | Adiciona conteúdo ao plano (com prevenção de duplicata) |
| `DELETE` | `/api/planos-estudos/{id}/itens/{item_id}` | Logado (Dono/Adm) | N/A | Mensagem 200 | `planosService.removerItem()` | Remove o conteúdo do plano (preserva fonte original) |
| `GET` | `/api/planos-estudos/turmas-lecionadas` | Professor / Adm | N/A | `TurmaResource` (Coleção) | `planosService.listarTurmasLecionadas()` | Lista turmas vinculadas ao professor (com suporte a busca `?q=` e filtro `?disciplina_id=`) |
| `POST` / `PUT` | `/api/planos-estudos/{id}/compartilhar` | Professor (Dono) / Adm | `CompartilharPlanoEstudoRequest` | `PlanoEstudoResource` | `planosService.compartilhar()` | Compartilha o plano exclusivamente com as turmas lecionadas pelo professor (`turma_ids`) |

---

### Módulo 4: Eventos / Agenda
*Calendário escolar unificado (Portal Público read-only e Agenda do Dashboard), datas importantes e feriados letivos.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/eventos` | Público / Logado (`sanctum` opcional) | N/A | `EventoResource` (Coleção) | `eventosService.listar()` | No Portal Público: retorna eventos institucionais (Especialista/Adm). Logado: retorna eventos institucionais + eventos de Professores + eventos pessoais do próprio usuário |
| `GET` | `/api/eventos/datas-importantes`| Público / Logado (`sanctum` opcional) | N/A | `EventoResource` (Coleção) | `eventosService.datasImportantes()` | Destaques importantes no topo do painel/portal |
| POST | /api/eventos | Logado (Qualquer perfil) | StoreEventoRequest | EventoResource | eventosService.criar() | Especialista/Adm cria evento institucional ou categorias restritas (Provas, Sábados Letivos, Feriados e Recessos) e pode destacar como importante (disparando notificação super-importante para toda a escola); Professor e Aluno criam exclusivamente eventos do tipo 'Eventos' |
| POST | /api/eventos/em-massa | Especialista / Adm | StoreEventoEmMassaRequest | EventoResource (Cole��o) | eventosService.criarEmMassa() | Cadastro em lote em transa��o �nica de S�bados Letivos e Feriados/Recessos via modal de tabela |
| `PUT` | `/api/eventos/{id}` | Logado (Dono / Especialista / Adm) | `UpdateEventoRequest` | `EventoResource` | `eventosService.atualizar()` | Atualiza evento próprio ou institucional; o criador é identificado pelo `criador.id` retornado no Resource |
| `DELETE`| `/api/eventos/{id}` | Logado (Dono / Especialista / Adm) | N/A | Mensagem 200/204 | `eventosService.excluir()` | Remove evento próprio ou institucional autorizado; a tela apresenta ações ao criador e a gestores |

> **Regra de Visibilidade dos Calendários:** O calendário do Portal Público é uma visão *read-only* alimentada pelos eventos que o **Especialista / Adm** cadastra. No Dashboard, qualquer usuário logado pode criar eventos. Eventos criados por **Professores** são visíveis a todos os usuários autenticados; eventos de **Alunos** e **Bibliotecárias** ficam visíveis somente ao autor. Eventos do Especialista/Adm continuam institucionais e visíveis para toda a comunidade escolar. A visibilidade compartilhada não concede permissão para editar ou excluir eventos de terceiros.

#### Horários semanais
*Grades por turma e ano letivo, consultadas na Agenda do Dashboard.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/horarios` | Especialista / Adm (todas as turmas), Professor (turmas vinculadas), Aluno (turma ativa própria) | N/A | `TurmaHorarioResource` (Coleção) | `horariosService.listar()` | Lista as turmas autorizadas, com horário concluído ou `null` quando ainda não foi gerado |
| `POST` | `/api/turmas/{turma_id}/horario/gerar` | Especialista / Adm | `GenerateHorarioRequest` (autorização; sem corpo) | `HorarioResource` | `horariosService.gerar()` | Gera a grade da turma selecionada; confere currículo, cargas anuais e disponibilidade docente no mesmo ano letivo |
| `PATCH` | `/api/horarios/{horario_id}/aulas/{aula_id}` | Especialista / Adm | `MoveHorarioAulaRequest` | `HorarioResource` | `horariosService.moverAula()` | Move uma aula para posição vazia ou troca com a aula ocupante e recusa violações docentes |

**Regras da grade:** 5 dias × 6 períodos (30 aulas semanais); o número semanal de aulas é a carga anual da disciplina dividida por 40. Geografia, Filosofia, Artes, Sociologia, Educação Física, Inglês, Biologia e Educação Digital têm 40 aulas anuais; Química, Física e História, 80; Sustentabilidade e Produção Cultural, 120; Português e Matemática, 200. O gerador confere todas as disciplinas e cargas em cada tentativa. Um professor não pode lecionar em duas turmas no mesmo período, ultrapassar 5 aulas diárias ou lecionar 3 períodos consecutivos na mesma turma. Evitar períodos consecutivos é preferência; a geração favorece concentrar as aulas do professor no mesmo dia. Sem combinação válida, retorna `422` e mantém a grade anterior.

**Saída: `TurmaHorarioResource`**
```json
{
  "turma": {
    "id_turma": 1,
    "nome_identificador": "1º Ano A - Ensino Médio",
    "ano_letivo": 2026
  },
  "horario": {
    "id": 8,
    "ano_letivo": 2026,
    "status": "concluido",
    "aulas": [
      {
        "id": 31,
        "dia_semana": 1,
        "aula_numero": 1,
        "disciplina": { "id_disciplina": 5, "nome": "Matemática" },
        "professor": { "id": 3, "name": "Carlos Silva" }
      }
    ]
  }
}
```
`dia_semana` usa `1` para segunda-feira até `5` para sexta-feira; `aula_numero` vai de `1` a `6`. Enquanto a requisição de geração está em andamento, a interface exibe `em_montagem`; após persistência integral, o horário fica `concluido`. A troca de posições usa os campos `destino_dia_semana` e `destino_aula_numero`.
As respostas seguem a configuração global `JsonResource::withoutWrapping()`: o detalhe é um objeto na raiz e `GET /api/horarios` retorna a coleção como array na raiz.

---

### Módulo 5: Turmas / Boletim (Escopo Enxuto via CSV)
*A importação consolidada por CSV permanece disponível. Como contingência aprovada, Especialista/Adm também podem lançar nota e frequência individualmente nas tabelas existentes; Professor continua estritamente consultivo.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/turmas/resumo-geral` | Especialista / Prof / Adm | N/A | `TurmaResumoResource` + `TurmaResumoData` (Coleção) | `turmasService.obterResumoGeral()` | Indicadores agregados e KPIs de todas as turmas (suporta `?ano_letivo=`, defaultando para o ano ativo; inclui `ciclo_id`, `ciclo_nome`, `taxa_absenteismo` e `distribuicao`) |
| `GET` | `/api/turmas` | Especialista / Prof / Adm | N/A | `TurmaResource` + `TurmaData` (Coleção) | `turmasService.listarTurmas()` | Listagem de turmas para consulta (inclui `periodo_letivo_id`, `ciclo_id` e `ciclo_nome`) |
| `POST` | `/api/turmas` | Especialista / Adm | `StoreTurmaRequest` + `SalvarTurmaData` | `TurmaResource` + `TurmaData` | `turmasService.criarTurma()` | Cadastra nova turma escolar vinculada obrigatoriamente a um Período Letivo cadastrado |
| `PUT` | `/api/turmas/{turma_id}` | Especialista / Adm | `UpdateTurmaRequest` + `SalvarTurmaData` | `TurmaResource` + `TurmaData` | `turmasService.atualizarTurma()` | Atualiza dados cadastrais da turma |
| `DELETE`| `/api/turmas/{turma_id}` | Especialista / Adm | N/A | Mensagem 204/422 | `turmasService.excluirTurma()` | Exclui turma (bloqueia se houver alunos ativos) |
| `GET` | `/api/turmas/{turma_id}/alunos` | Especialista / Prof / Adm | N/A | `AlunoTurmaResource` (Coleção) | `turmasService.listarAlunosTurma()` | Alunos matriculados na turma (consulta) |
| `GET` | `/api/turmas/{turma_id}/alunos-disponiveis` | Especialista / Adm | N/A | `UsuarioResource` (Coleção) | `turmasService.listarAlunosDisponiveis()` | Alunos elegíveis para matrícula na turma (sem matrícula ativa no mesmo ano letivo) |
| `GET` | `/api/matriculas` | Especialista / Prof / Adm | N/A | `MatriculaResource` (Coleção) | `turmasService.listarMatriculas()` | Relação nominal de todos os matriculados ativos |
| `POST` | `/api/matriculas` | Especialista / Adm | `StoreMatriculaRequest` | `MatriculaResource` | `turmasService.vincularAluno()` | Matricula/vincula aluno na turma |
| `POST` | `/api/turmas/{turma_id}/importar-relatorio` | Especialista / Adm | `ImportarRelatorioTurmaRequest` + `ImportarRelatorioInputData` + `RegistroNotaCsvData` | `RelatorioImportadoResource` + `RelatorioImportadoData` | `turmasService.importarRelatorioCSV()` | **Upload único do CSV** com notas/faltas consolidadas; exige estritamente arquivo no formato `.csv` (outros formatos retornam 422 de incompatibilidade); valida cada célula via `RegistroNotaCsvData` (descartando células inválidas com aviso em `dados.alertas`) e importa exclusivamente alunos previamente cadastrados com e-mail institucional oficial (`@aluno.mg.gov.br`) e matrícula ativa na turma. Suporta desambiguação de homônimos (`mapeamentos_alunos`) e conciliação de disciplinas (`mapeamentos_disciplinas` com `disciplina_id`, `ciclo_id`, `sugestao_disciplina_id`, `sugestao_disciplina_nome` e retorno de `catalogo_ciclos`), além de reconhecimento automático de múltiplos períodos letivos e resolução de divergências via `decisao_divergencias` (`'atualizar'` ou `'manter'`). |
| `POST` | `/api/notas` | Especialista / Adm | `StoreNotaRequest` | `NotaResource` + `NotaDiarioData` | `turmasService.lancarNotaManual()` | Registra nota individual existente na tabela `notas`; exige turma, aluno matriculado ativo, disciplina vinculada, período, avaliação, nota e valor máximo; data e observações são opcionais. Dispara os alertas acadêmicos aplicáveis. |
| `POST` | `/api/frequencias` | Especialista / Adm | `StoreFrequenciaManualRequest` | `FrequenciaResource` | `turmasService.lancarFrequenciaManual()` | Registra/atualiza a frequência de um aluno por turma, disciplina e data, com quantidade de aulas, situação e justificativa opcional; usa a tabela `frequencias` existente e atualiza os alertas acadêmicos aplicáveis. |
| `DELETE`| `/api/turmas/{turma_id}/dados-csv` | Especialista / Adm | N/A | Mensagem 200 | `turmasService.excluirDadosCsv()` | Exclui notas e faltas carregadas via CSV da turma (suporta ?periodo_letivo=) |
| `GET` | `/api/turmas/{turma_id}/notas` | Especialista / Prof / Adm | `FiltroNotasTurmaData` | `NotaResource` + `NotaDiarioData` (Coleção) | `turmasService.listarNotasTurma()` | Consulta notas lançadas na turma; blindado para exibir exclusivamente notas de alunos cadastrados com e-mail institucional oficial (`@aluno.mg.gov.br`), com filtros combinados de período (`periodo_letivo`), disciplina (`disciplina_id`) e aluno (`aluno_id`). Inclui `percentual_faltas`, `total_faltas`, `valor_maximo_periodo` e `situacao`. |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/boletim` | Aluno / Prof / Esp / Adm | N/A | `BoletimResource` + `BoletimAlunoData` | `boletimService.obterBoletim()` | Boletim consolidado de notas e faltas por trimestre validado ponta a ponta com `BoletimAlunoSchema` |
| `GET` | `/api/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma` | Aluno / Prof / Esp / Adm | N/A | `ComparativoTurmaResource` + `ComparativoTurmaData` | `boletimService.obterComparativoTurma()` | Dados comparativos do aluno vs média oficial da turma por disciplina validados com `ComparativoTurmaSchema` (inclui `frequencia_aluno_global`, `frequencia_turma_global`, e por matéria `frequencia_aluno` e `frequencia_turma`) |
| `GET` | `/api/professores` | Especialista / Adm | N/A | `ProfessorResource` (Coleção + `meta.pendentes_count`) | `professoresService.listarProfessores()` | Lista professores cadastrados, status de confirmação e disciplinas vinculadas |
| `GET` | `/api/professores/{professor}` | Especialista / Adm | N/A | `ProfessorResource` | `professoresService.obterProfessor()` | Detalhes de um professor e suas disciplinas |
| `PATCH` | `/api/professores/{professor}/confirmar` | Especialista / Adm | `ConfirmarProfessorRequest` | `ProfessorResource` | `professoresService.confirmarProfessor()` | Confirma o vínculo institucional do professor exigindo vínculo a ao menos 1 disciplina (`disciplina_ids`) |
| `PATCH` | `/api/professores/{professor}/recusar` | Especialista / Adm | N/A | `UsuarioResource` | `professoresService.recusarProfessor()` | Recusa a solicitação docente, revertendo o papel para `aluno` |
| `POST` | `/api/professores/{professor}/vincular-disciplina` | Especialista / Adm | `VincularProfessorDisciplinaRequest` | `ProfessorResource` | `professoresService.vincularDisciplinaProfessor()` | Vincula disciplina (existente ou recém-criada) ao professor confirmado |
| `DELETE` | `/api/professores/{professor}/desvincular-disciplina/{disciplina}` | Especialista / Adm | N/A | `ProfessorResource` | `professoresService.desvincularDisciplinaProfessor()` | Remove o vínculo de regência entre o professor e a disciplina |
| `GET` | `/api/ciclos` | Aluno / Prof / Esp / Adm | N/A | `CicloResource` + `CicloData` (Coleção + `disciplinas_sem_ciclo`) | `disciplinasService.listarDisciplinasPorCiclo()` | Especialista/Adm: lista todos os Ciclos Escolares com disciplinas e turmas completas. Professor: lista estritamente os ciclos, turmas e disciplinas sob sua regência docente. |
| `POST` | `/api/ciclos` | Especialista / Adm | `StoreCicloRequest` + `SalvarCicloData` | `CicloResource` + `CicloData` | `disciplinasService.criarCiclo()` | Cria um novo Ciclo Escolar (`nome` obrigatório até 100 e único; `descricao` opcional, **máx. 256 caracteres**, exibida abaixo do rótulo do ciclo) |
| `PUT` | `/api/ciclos/{ciclo}` | Especialista / Adm | `StoreCicloRequest` + `SalvarCicloData` | `CicloResource` + `CicloData` | `disciplinasService.atualizarCiclo()` | Renomeia o Ciclo e/ou altera o comentário (`nome`, `descricao` máx. 256) |
| `DELETE` | `/api/ciclos/{ciclo}` | Especialista / Adm | N/A | Sem conteúdo (`204`) | `disciplinasService.excluirCiclo()` | Remove o Ciclo **sem exclusão em cascata**: as disciplinas viram não vinculadas (retornam em `disciplinas_sem_ciclo` no `GET /api/ciclos`) e as turmas ficam com `ciclo_id = null`, preservando alocações, notas e frequência |
| `GET` | `/api/disciplinas` | Aluno / Prof / Esp / Adm | N/A | `DisciplinaResource` (Coleção) | `disciplinasService.listarDisciplinas()` | Lista disciplinas curriculares (para Professor: restrito às matérias sob sua regência; para Aluno: filtrado por ?vinculadas=1) |
| `POST` | `/api/disciplinas` | Especialista / Adm | `StoreDisciplinaRequest` | `DisciplinaResource` | `disciplinasService.criarDisciplina()` | Cadastra disciplina vinculando a ciclos existentes (`ciclo_ids`) e/ou criando novo ciclo (`novo_ciclo_nome`) |
| `PUT` | `/api/disciplinas/{disciplina}` | Especialista / Adm | `UpdateDisciplinaRequest` | `DisciplinaResource` | `disciplinasService.atualizarDisciplina()` | Atualiza disciplina, recalcula carga anual (40 semanas) e propaga herança para as turmas dos ciclos |
| `DELETE` | `/api/disciplinas/{disciplina}` | Especialista / Adm | N/A | Sem conteúdo (`204`) | `disciplinasService.excluirDisciplina()` | Remove disciplina do catálogo |
| `GET` | `/api/periodos-letivos` | Autenticado | N/A | `PeriodoLetivoResource` (Coleção) | `periodosLetivosService.listarPeriodosLetivos()` | Lista todos os anos letivos cadastrados com suas respectivas divisões |
| `GET` | `/api/periodos-letivos/ativo` | Autenticado | N/A | `PeriodoLetivoResource` | `periodosLetivosService.obterPeriodoLetivoAtivo()` | Retorna o período letivo ativo vigente e a divisão em andamento |
| `GET` | `/api/periodos-letivos/{id}` | Autenticado | N/A | `PeriodoLetivoResource` | `periodosLetivosService.obterPeriodoLetivo()` | Detalhes de um período letivo específico |
| `POST` | `/api/periodos-letivos` | Especialista / Adm | `StorePeriodoLetivoRequest` | `PeriodoLetivoResource` | `periodosLetivosService.criarPeriodoLetivo()` | Cria novo período letivo, etapas e sincroniza marcos oficiais com a Agenda |
| `PUT` | `/api/periodos-letivos/{id}` | Especialista / Adm | `UpdatePeriodoLetivoRequest` | `PeriodoLetivoResource` | `periodosLetivosService.atualizarPeriodoLetivo()` | Atualiza ano, tipo de divisão, pontuação e datas das etapas |
| `PATCH`| `/api/periodos-letivos/{id}/ativar` | Especialista / Adm | N/A | `PeriodoLetivoResource` | `periodosLetivosService.ativarPeriodoLetivo()` | Define o período como vigente/ativo desativando os anteriores |
| `DELETE`| `/api/periodos-letivos/{id}` | Especialista / Adm | N/A | Mensagem 200 | `periodosLetivosService.excluirPeriodoLetivo()` | Exclui período letivo (bloqueia se houver turmas no ano) |
| `POST` | `/api/periodos-letivos/{id}/sincronizar-agenda` | Especialista / Adm | N/A | Mensagem 200 | `periodosLetivosService.sincronizarAgendaPeriodo()` | Força a sincronização dos marcos escolares com o calendário institucional |

> **Regra de Escopo:** O Professor possui acesso **estritamente consultivo e isolado** aos dados das suas turmas e dos seus alunos (rotulada no frontend como **"Minhas Turmas"**). No módulo acadêmico, o professor visualiza única e exclusivamente as turmas e disciplinas a ele vinculadas, sem botões de criação, edição ou exclusão. Como contingência aprovada, Especialista/Adm podem lançar nota e frequência de um aluno individualmente; isso não habilita o professor nem cria uma chamada diária em lote. Cadastro manual de atividades e consolidação diária de chamada continuam fora de escopo. A criação de turmas e a vinculação de alunos são privativas do Especialista e Administrador. A importação de CSV é privativa do Especialista. No frontend, as disciplinas exibem obrigatoriamente a concatenação **`NOME + CICLO`**.

#### Especificação de Contratos Tipados (Spatie Laravel Data ↔ Zod)
Os endpoints do Módulo Acadêmico possuem dupla revalidação em runtime: **Spatie Laravel Data** (`app/Data/Academico/*`) na entrada/saída do Laravel e **Zod** (`src/utils/academicoSchemas.js`) nos serviços e formulários do React:

* **`TurmaResource` (`TurmaData` ↔ `TurmaSchema`)**:
  ```json
  {
    "id_turma": 1,
    "nome_identificador": "3º Ano - ADS",
    "ciclo_id": 3,
    "ciclo_nome": "3º Ano - Ensino Médio",
    "periodo_letivo_id": 1,
    "ano_letivo": 2026,
    "turno": "Integral",
    "capacidade_maxima": 40,
    "status": "Ativa",
    "total_alunos": 5,
    "total_disciplinas": 12
  }
  ```
* **`TurmaResumoResource` (`TurmaResumoData` ↔ `TurmaResumoSchema`)**:
  ```json
  {
    "id_turma": 1,
    "nome_identificador": "3º Ano - ADS",
    "ciclo_id": 3,
    "ciclo_nome": "3º Ano - Ensino Médio",
    "turno": "Integral",
    "ano_letivo": 2026,
    "status": "Ativa",
    "total_alunos": 5,
    "media_geral": 74.5,
    "taxa_presenca": 94.0,
    "taxa_absenteismo": 6.0,
    "total_avaliados": 5,
    "distribuicao": {
      "acima": 40.0,
      "na_media": 40.0,
      "abaixo": 20.0
    }
  }
  ```
* **`NotaResource` (`NotaDiarioData` ↔ `NotaDiarioSchema`)**:
  ```json
  {
    "id_nota": 10,
    "turma_id": 1,
    "disciplina_id": 4,
    "usuario_id": 12,
    "periodo_letivo": "1º Trimestre",
    "tipo_avaliacao": "Consolidado CSV",
    "valor_nota": 24.5,
    "valor_maximo": 30.0,
    "valor_maximo_periodo": 30.0,
    "percentual_faltas": 5.0,
    "total_faltas": 2,
    "situacao": "Acima da Média",
    "data_registro": "2026-05-15",
    "observacoes": null,
    "aluno": { "id": 12, "name": "Ana Ramos", "email": "ana.ramos@aluno.mg.gov.br" },
    "disciplina": { "id_disciplina": 4, "nome": "Desenvolvimento de Aplicativos" }
  }
  ```
* **`RelatorioImportadoResource` (`RelatorioImportadoData` ↔ `RelatorioImportadoSchema`)**:
  ```json
  {
    "status": "sucesso",
    "tipo_pendencia": null,
    "message": "Relatório da turma importado e sincronizado com sucesso.",
    "turma": { "id_turma": 1, "nome_identificador": "3º Ano - ADS" },
    "ambiguidades": [],
    "divergencias": [],
    "disciplinas_pendentes": [],
    "catalogo_disciplinas": [],
    "catalogo_ciclos": [],
    "dados": {
      "status": "sucesso",
      "tipo_pendencia": null,
      "message": "Relatório da turma importado e sincronizado com sucesso.",
      "linhas_lidas": 6,
      "periodo_aplicado": "1º Trimestre",
      "data_referencia": "2026-04-15",
      "alunos_identificados": 5,
      "alunos_ignorados": [],
      "total_ignorados": 0,
      "notas_sincronizadas": 10,
      "frequencias_sincronizadas": 5,
      "alertas": []
    }
  }
  ```
* **`BoletimResource` (`BoletimAlunoData` ↔ `BoletimAlunoSchema`)**:
  ```json
  {
    "turma_id": 1,
    "aluno_id": 12,
    "periodo_selecionado": "1º Trimestre",
    "boletim": [
      {
        "disciplina_id": 4,
        "nome_disciplina": "Desenvolvimento de Aplicativos",
        "nota_obtida": 25.5,
        "valor_maximo": 30.0,
        "somatorio_faltas": 2,
        "total_aulas": 20,
        "status": "Aprovado",
        "id": 4,
        "materia": "Desenvolvimento de Aplicativos",
        "pontos": 25.5,
        "cor": "#0d6efd"
      }
    ],
    "grafico_boletim": [
      { "id": 4, "materia": "Desenvolvimento de Aplicativos", "pontos": 25.5, "cor": "#0d6efd" }
    ]
  }
  ```

---

### Módulo 6: Gestão do Usuário (Configurações)
*Perfil do usuário e controle administrativo.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `PUT` | `/api/usuarios/{id}` | Logado (próprio perfil) / Adm | `UpdateUsuarioRequest` | `UsuarioResource` | `usuarioService.atualizarPerfil()` / `atualizarUsuario()` | Usuário comum atualiza nickname, telefone, data de nascimento e senha. Adm altera `role`, `comentario_admin` e emite notificação direta (`mensagem_notificacao` + `super_importante`) |
| `POST` | `/api/usuarios/{id}/avatar` | Logado (próprio perfil) | `UploadAvatarRequest` | `UsuarioResource` | `usuarioService.uploadAvatar()` | Envia e atualiza a foto de perfil (avatar) |
| `DELETE` | `/api/usuarios/{id}/avatar` | Logado (próprio perfil) | N/A | `UsuarioResource` | `usuarioService.removerAvatar()` | Remove a foto de perfil atual do usuário |
| `GET` | `/api/usuarios` | Adm | N/A | `UsuarioResource` (Coleção paginada, padrão 15 últimos) | `usuarioService.listarUsuarios()` | Lista os 15 últimos usuários cadastrados com filtro por `role`, `busca` por nome, autorizador e data de vínculo |
| `DELETE` | `/api/usuarios/{id}` | Adm | `DesvincularUsuarioRequest` | `UsuarioResource` | `usuarioService.desvincularUsuario()` | Exclusão lógica em 2 etapas (exige `confirmacao_nome` idêntico ao nome completo): inativa usuário, encerra vínculo ativo preservando histórico e revoga tokens Sanctum (logoff forçado) |
| `GET` | `/api/usuarios/pendentes-resumo` | Especialista / Adm | N/A | Envelope JSON (`alunos_pendentes`, `professores_pendentes`, `total_pendentes`) | `usuarioService.obterPendentesResumo()` | Retorna contadores e lista de aprovações de login pendentes (`@aluno` e `@educacao`) |
| `PATCH` | `/api/usuarios/{id}/confirmar-vinculo-aluno` | Especialista / Adm | `ConfirmarAlunoVinculoRequest` | `UsuarioResource` | `usuarioService.confirmarVinculoAluno()` | Aprova login institucional de estudante (`@aluno`) vinculando-o a uma turma (`turma_id`) |
| `PATCH`| `/api/usuarios/{id}/bloquear` | Adm | N/A | `UsuarioResource` | `usuarioService.alternarBloqueio()` | Ativa ou desativa acesso do usuário |
| `PATCH`| `/api/usuarios/{id}/papel` | Adm | `AlterarPapelRequest` | `UsuarioResource` | `usuarioService.alterarPapel()` | Atualiza o `UserRole` do usuário |

---

### Módulo 7: Geral (Painel Analítico / Dashboard)
*Cruzamento de dados estatísticos para a visão geral (`/dashboard/geral`).*

| Método | Endpoint | Acesso | API Resource (Back) | Serviço Front | Dados Retornados por Perfil |
|---|---|---|---|---|---|
| `GET` | `/api/dashboard/geral` | Especialista / Prof / Adm | `DashboardGeralResource` | `geralService()` / `fetchDashboardGeral()` | Indicadores agregados (KPIs), médias por turma (0-10), disciplinas do docente e últimas atualizações reais |
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
  "disciplinas_docente": ["Matemática", "Física"],
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

---

## Módulo Transversal: Notificações
*Caixa de notificações autenticada, mensagens manuais e alertas acadêmicos originados na importação CSV.*

| Método | Endpoint | Acesso | Form Request (Back) | API Resource (Back) | Serviço Front | Descrição |
|---|---|---|---|---|---|---|
| `GET` | `/api/notificacoes?page={n}&per_page={n}` | Logado | N/A | `NotificacaoResource` (paginada) | `notificacoesService.listarNotificacoes()` | Lista notificações não confirmadas do próprio usuário, da mais recente para a mais antiga; `per_page` é limitado a 100 |
| `GET` | `/api/notificacoes/super-importantes` | Logado | N/A | `NotificacaoResource` (Array JSON na raiz) | `notificacoesService.listarSuperImportantes()` | Lista notificações super-importantes não confirmadas para exibição no login |
| `POST` | `/api/notificacoes` | Professor / Especialista / Adm | `StoreNotificacaoRequest` | `NotificacaoResource` (Array JSON na raiz) | `notificacoesService.criarNotificacao()` | Cria mensagens para aluno, turma ou comunidade escolar; notificação individual é persistida somente para o aluno destinatário; professor só pode alcançar alunos/turmas sob sua regência e recebe 403 JSON explícito ao tentar comunicado geral; comunicado geral é restrito a Especialista/Adm |
| `PATCH` | `/api/notificacoes/{id}/lida` | Destinatário | N/A | `NotificacaoResource` | `notificacoesService.marcarNotificacaoLida()` | Confirma individualmente e retira a notificação da caixa pendente |
| `PATCH` | `/api/notificacoes/marcar-padrao-lidas` | Logado | N/A | Sem conteúdo (`204`) | `notificacoesService.marcarPadraoComoLidas()` | Confirma em massa somente notificações padrão; importantes/super-importantes exigem confirmação individual |

#### Entrada: `StoreNotificacaoRequest`
```json
{
  "titulo": "string (obrigatório, máx. 255)",
  "assunto": "string (obrigatório, máx. 5000)",
  "destinatario_tipo": "aluno | turma | geral",
  "aluno_id": "integer (obrigatório quando destinatario_tipo=aluno)",
  "turma_id": "integer (obrigatório quando destinatario_tipo=turma)",
  "super_importante": "boolean (opcional, padrão false)"
}
```
Para cada destinatário, o canal de banco nativo do Laravel cria um registro individual com `id`, `titulo`, `assunto`, `tipo`, `origem`, `prioridade`, `criador_id`, `criador_nome`, `destinatario_id`, `event_key`, `read_at` e `created_at`. O estado `read_at` é individual, mesmo quando a mensagem foi enviada para uma turma/comunidade.

#### Saída: `NotificacaoResource`
```json
{
  "id": "uuid",
  "titulo": "string",
  "assunto": "string",
  "tipo": "manual | frequencia_risco | nota_alerta | nota_destaque | lembrete",
  "origem": "usuario | sistema",
  "prioridade": "padrao | importante | super_importante",
  "criador_id": 3,
  "criador_nome": "Clara Mendes",
  "destinatario_id": 12,
  "read_at": null,
  "created_at": "2026-10-23T15:00:00.000000Z"
}
```

#### Gatilhos acadêmicos e lembretes
- Após a sincronização concluída de um CSV, a presença é avaliada por aluno, disciplina e período letivo. Ao atingir `75%` ou menos, é enviada uma notificação padrão ao aluno, ao professor da disciplina e à equipe pedagógica dentro das permissões existentes. Para CSVs com apenas totais de faltas, a projeção trimestral segue a carga horária usada pelo boletim.
- A nota consolidada por aluno, disciplina e período é normalizada pelo valor máximo. Abaixo de `60%` gera alerta; a partir de `80%` gera destaque individual. Alunos recebem somente seus próprios dados; professor/especialista/adm veem nome e nota apenas dentro do escopo autorizado.
- Os `event_key` estáveis impedem duplicação de alertas acadêmicos em reimportações equivalentes. Uma nova categoria de desempenho pode produzir um novo aviso para a mesma nota consolidada.
- O agendamento `app:enviar-lembretes-notificacoes` envia uma única lembrança após três dias somente para notificações manuais não confirmadas, ao destinatário e ao criador. Alertas acadêmicos do sistema e os próprios lembretes não entram nesse fluxo. O ambiente publicado deve executar o scheduler Laravel diariamente.
