# Backend — Contexto, Convenções e Mentoria Socrática (`portal-back/AGENTS.md`)

> **Diretriz Máxima Pedagógica:** As diretrizes pedagógicas e a postura de **Tutor Técnico Sênior** em `../AGENTS.md` são obrigatórias e têm precedência soberana sobre quaisquer automações ou regras genéricas deste repositório.

---

## 1. Contexto Fundamental do Backend
* **Arquitetura**: API RESTful pura desenvolvida em **PHP 8.5+** com **Laravel 12/13**, autenticação via **Laravel Sanctum** e respostas estritamente em **JSON**.
* **Escopo Oficial**: O backend atende aos 7 módulos do sistema descritos no [`apiContract.md`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/apiContract.md).
* **Turmas / Boletim (Escopo Enxuto)**:
  * Notas e faltas são alimentadas exclusivamente pela importação do relatório consolidado em CSV pelo **Especialista** (`POST /api/turmas/{turma_id}/importar-relatorio`).
  * O papel de **Professor** possui acesso estritamente de consulta aos dados das turmas e alunos.
  * **Proibição:** Não crie tabelas, controllers ou rotas para lançamento avulso de tarefas, submissões ou chamada diária manual.

---

## 2. Blindagem Arquitetural Obrigatória (Requests & Resources)

Para garantir segurança, previsibilidade de payload e código limpo, é mandatória a seguinte estrutura:

1. **Entrada de Dados (`app/Http/Requests/`)**:
   * Toda requisição que envia dados (POST, PUT, PATCH) deve utilizar uma **Form Request dedicada**.
   * A validação deve ser semântica e explícita, bloqueando *Mass Assignment* e campos indevidos.
   * O controller recebe dados validados via `$request->validated()`.
2. **Saída de Dados (`app/Http/Resources/`)**:
   * Toda resposta JSON com dados deve encapsular os models em um **Eloquent API Resource** (`app/Http/Resources/`).
   * **É terminantemente proibido retornar models Eloquent brutos ou arrays soltos diretamente dos controllers.**
   * O Resource garante que apenas os campos acordados no contrato de API sejam expostos ao frontend.

---

## 3. Protocolo de Governança com `apiContract.md` e Cláusula 'PRENTYS'

O arquivo [`apiContract.md`](file:///c:/Users/prent/OneDrive/Documentos/repositorios/portal-sebastiana/apiContract.md) na raiz do monorepo é a fonte única da verdade técnica:

1. **Gatilho de Atualização (Delta Check)**:
   * Sempre que um **Model** (dados, métodos, relacionamentos, casts ou colunas), Form Request ou Resource for alterado, o trecho afetado no `apiContract.md` deve ser atualizado.
2. **Loop de Consistência (Até 3 Tentativas)**:
   * O agente simula a requisição HTTP correspondente (verificando correspondência 1:1 entre a chamada do front, a Form Request e o API Resource).
   * A verificação é restrita **somente ao trecho do Model afetado** durante a interação.
3. **Cláusula de Interrupção ('PRENTYS')**:
   * Se a correspondência exata não for obtida após a 3ª tentativa:
     1. Interromper imediatamente o loop de código;
     2. Emitir log simples e objetivo indicando onde os campos divergem;
     3. Informar ao usuário:
        > ⚠️ **Atenção:** Consistência de contrato não atingida após 3 tentativas. Favor requisitar a intervenção do professor: **'PRENTYS'**.

---

## 4. Diretrizes de Mentoria Socrática no Backend

1. **Migrations e Banco de Dados**:
   * Antes de rodar ou criar uma migration, formule perguntas socráticas de decisão ao desenvolvedor júnior:
     * *"Quais colunas precisamos guardar no banco para esta tabela funcionar?"*
     * *"Como esta tabela se relaciona com as outras?"*
   * Apresente opções estruturadas em lote (até 5 perguntas) com a opção recomendada em destaque.
2. **Controllers Magros e Procedurais**:
   * Peça para o desenvolvedor descrever em pseudocódigo o que o método deve fazer antes de gerar o código PHP.
   * Mantenha os controllers enxutos: a Form Request valida, o Model/Resource processa e formata.
3. **Evite Over-engineering**:
   * Não imponha Services, Repositories, DTOs ou padrões complexos quando os recursos nativos do Eloquent e Form Requests resolverem com clareza.
4. **Comentários Didáticos Obrigatórios (pt-BR)**:
   * Combine PHPDoc blocks nas assinaturas de métodos com **comentários didáticos curtos em pt-BR** nas linhas de lógica interna, explicando o *porquê* daquela instrução para os estudantes.

---

## 5. Autenticação, Segurança e Roles

* **Sanctum**: Endpoints protegidos exigem `auth:sanctum`.
* **Enum de Roles**: Uso estrito de `App\Enums\UserRole` (`ALUNO = 'aluno'`, `PROFESSOR = 'professor'`, `BIBLIOTECARIA = 'bibliotecaria'`, `ESPECIALISTA = 'especialista'`, `ADM = 'adm'`).
* **Checagem de Permissões**: Use métodos semânticos do model User (`$user->isAdm()`, `$user->isEspecialista()`, `$user->isProfessor()`, `$user->isBibliotecaria()`, `$user->isAluno()`). Proíba o uso de strings brutas como `'administrador'` em regras de negócio.

---

## 6. Ferramentas, Formatação e Testes do Ecossistema Laravel

### 6.1 Artisan
* Use comandos Artisan com `--no-interaction` (ex.: `php artisan make:model Livro -mfc --no-interaction`).
* Sempre gere a **Factory** e o **Resource** ao criar um novo Model (perguntando antes quais dados *fakers* fazem sentido para os testes).

### 6.2 Formatação Obrigatória (Laravel Pint)
* Após editar arquivos PHP, execute obrigatoriamente:
  ```powershell
  vendor/bin/pint --dirty --format agent
  ```
  Não finalize tarefas com código desformatado.

### 6.3 Testes Automatizados (Pest)
* O projeto utiliza **Pest** para testes de feature e unidade.
* Crie testes com: `php artisan make:test --pest NomeDoTeste`.
* Execute suítes compactas: `php artisan test --compact`.
* Nunca exclua testes existentes sem aprovação explícita.

### 6.4 Definição de Pronto (DoD)
Nenhuma tarefa de código no backend é considerada pronta sem:
1. Validação prévia de campos e regras com o desenvolvedor júnior;
2. Form Request + API Resource implementados;
3. Execução de `pint` sem erros de estilo;
4. Execução de testes Pest sem falhas no escopo;
5. Atualização do `apiContract.md`;
6. Bloco de **Fechamento Explicativo** (O que foi feito / Por que foi feito / Como foi feito).
