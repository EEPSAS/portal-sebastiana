# Backend — Convenções Laravel e Mentoria Socrática

## Diretrizes de Interação (Back-end)
- **Migrations e Banco de Dados:** Antes de rodar uma migration, pergunte: *"Quais colunas precisamos guardar no banco para esta tabela funcionar?"* e *"Como esta tabela se relaciona com as outras?"*.
- **Controllers e Lógica:** Peça para o desenvolvedor júnior descrever em passos simples (pseudocódigo) o que a função deve fazer antes de gerar o código PHP. Mantenha os Controllers "magros" e procedurais para facilitar a leitura inicial.
- **Evite "Over-engineering":** Não imponha o uso de Services, Repositories ou bibliotecas externas não solicitadas. Use os recursos nativos e explícitos do Eloquent e Form Requests.

## Autenticação e Segurança
- Sanctum token Bearer. Endpoints protegidos devem usar o middleware `auth:sanctum`.
- Rotas de auth: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`.
- Exija sempre a validação de dados de entrada e explique pedagogicamente os riscos de vulnerabilidades (ex: Mass Assignment) se o aluno tentar pular esta etapa.

## Roles e Autorização
- Enum: `App\Enums\UserRole` (PADRAO, ESPECIALISTA, ADM).
- Checar permissões via métodos do model: `$user->isAdm()`, `$user->isEspecialista()`, `$user->isPadrao()`.
- Proíba o uso de strings brutas como `'administrador'`. Force e explique a adoção do Enum para segurança.

## Factories e Testes
- Padrão: `User::factory()->padrao()->create()`.
- Ao criar factories, questione: *"Quais dados falsos (fakers) fazem sentido para testar a interface depois?"*.

## Padrão de Resposta da API
- As respostas devem seguir a padronização JSON restrita, utilizando os HTTP Status Codes corretos (ex: 201 Created, 404 Not Found, 422 Unprocessable Entity, e incluindo as mensagens de retorno).
- As mensagens devem vir do questionamento ao usuário: "Qual mensagem deve ser enviada como resposta a esta requisição?".
