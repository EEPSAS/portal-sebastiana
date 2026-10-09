<?php

use App\Http\Controllers\AlunoDashboardController;
use App\Http\Controllers\AtividadeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DisciplinaController;
use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\EspecialistaDashboardController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\FrequenciaController;
use App\Http\Controllers\LivroController;
use App\Http\Controllers\MatriculaController;
use App\Http\Controllers\NotaController;
use App\Http\Controllers\NoticiaController;
use App\Http\Controllers\RadioatividadeController;
use App\Http\Controllers\RemessaDocenteController;
use App\Http\Controllers\SubmissaoController;
use App\Http\Controllers\TurmaController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rota nomeada 'login' para responder a redirecionamentos de autenticação
Route::get('/login', function () {
    return response()->json([
        'message' => 'Não autenticado. Por favor, realize o login via POST em /api/auth/login ou /api/login com seu email e senha.',
    ], 401);
})->name('login');

// Endpoints diretos de autenticação
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/register', [AuthController::class, 'register'])->name('api.register');

// Conteúdos públicos
// Notícias e acervo de livros são conteúdos públicos para consulta
Route::get('/noticias', [NoticiaController::class, 'index']);
Route::get('/noticias/{noticia}', [NoticiaController::class, 'show']);

Route::get('/livros', [LivroController::class, 'index']);
Route::get('/livros/{livro}', [LivroController::class, 'show']);
Route::get('/livros/{livro}/disponibilidade', [LivroController::class, 'verificarDisponibilidade']);

// Endpoints sob o prefixo /auth
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');

    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// Rotas protegidas (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('roleModel.permissions');
        $userData = $user->toArray();
        $userData['permissoes'] = $user->getPermissionsSlugs();

        return response()->json($userData);
    });

    Route::apiResource('noticias', NoticiaController::class)->except(['index', 'show']);
    Route::apiResource('radioatividades', RadioatividadeController::class);

    // Calendário e Eventos
    Route::get('/eventos/datas-importantes', [EventoController::class, 'datasImportantes']);
    Route::apiResource('eventos', EventoController::class);

    // Módulo Acadêmico: Turmas
    Route::get('/turmas/{turma}/alunos', [TurmaController::class, 'alunos']);
    Route::get('/turmas/{turma}/disciplinas', [TurmaController::class, 'disciplinas']);
    Route::post('/turmas/{turma}/disciplinas', [TurmaController::class, 'vincularDisciplina']);
    Route::delete('/turmas/{turma}/disciplinas/{disciplina}', [TurmaController::class, 'desvincularDisciplina']);
    Route::apiResource('turmas', TurmaController::class);

    // Dashboard do Especialista (Inteligência Acadêmica e Gestão Pedagógica)
    Route::post('/turmas/{turma_id}/importar-relatorio', [EspecialistaDashboardController::class, 'importarRelatorio']);
    Route::get('/turmas/{turma_id}/resumo-gerencial', [EspecialistaDashboardController::class, 'resumoGerencial']);
    Route::get('/turmas/{turma_id}/desempenho-componentes', [EspecialistaDashboardController::class, 'desempenhoComponentes']);
    Route::get('/turmas/{turma_id}/alunos-criticos', [EspecialistaDashboardController::class, 'alunosCriticos']);
    Route::get('/turmas/{turma_id}/disciplinas/{disciplina_id}/analise-detalhada', [EspecialistaDashboardController::class, 'analiseDetalhada']);
    Route::get('/turmas/{turma_id}/disciplinas/{disciplina_id}/alunos-risco', [EspecialistaDashboardController::class, 'alunosRisco']);

    // Dashboard do Aluno (Visão Individual e Acadêmica)
    Route::get('/alunos/{aluno_id}/turmas/{turma_id}/resumo-global', [AlunoDashboardController::class, 'resumoGlobal']);
    Route::get('/alunos/{aluno_id}/turmas/{turma_id}/boletim', [AlunoDashboardController::class, 'boletim']);
    Route::get('/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma', [AlunoDashboardController::class, 'comparativoTurma']);
    Route::get('/alunos/{aluno_id}/turmas/{turma_id}/disciplinas/{disciplina_id}/desempenho', [AlunoDashboardController::class, 'desempenhoDisciplina']);

    // Módulo Acadêmico: Disciplinas
    Route::post('/disciplinas/{disciplina}/vincular-professor', [DisciplinaController::class, 'vincularProfessor']);
    Route::apiResource('disciplinas', DisciplinaController::class);

    // Módulo Acadêmico: Matrículas
    Route::post('/matriculas', [MatriculaController::class, 'matricularAluno']);
    Route::patch('/matriculas/{matricula}/transferir', [MatriculaController::class, 'transferirTurma']);
    Route::patch('/matriculas/{matricula}/cancelar', [MatriculaController::class, 'cancelarMatricula']);
    Route::get('/alunos/{usuario}/turmas', [MatriculaController::class, 'listarTurmasDoAluno']);
    Route::get('/me/turmas', [MatriculaController::class, 'minhasTurmas']);

    // Módulo Acadêmico: Remessas Docentes
    Route::post('/remessas', [RemessaDocenteController::class, 'enviarRemessa']);
    Route::get('/remessas/minhas', [RemessaDocenteController::class, 'consultarRemessaPropria']);
    Route::get('/remessas/pendentes', [RemessaDocenteController::class, 'listarRemessasPendentes']);
    Route::patch('/remessas/{remessa}/anexado', [RemessaDocenteController::class, 'marcarComoAnexado']);
    Route::patch('/remessas/{remessa}/rejeitado', [RemessaDocenteController::class, 'marcarComoRejeitado']);

    // Módulo Acadêmico: Frequência
    Route::post('/frequencias/consolidar-chamada', [FrequenciaController::class, 'consolidarChamadaDiaria']);
    Route::put('/frequencias/{frequencia}', [FrequenciaController::class, 'atualizarPresencaIndividual']);
    Route::patch('/frequencias/{frequencia}', [FrequenciaController::class, 'atualizarPresencaIndividual']);
    Route::get('/frequencias/relatorio-faltas', [FrequenciaController::class, 'gerarRelatorioFaltas']);
    Route::get('/frequencias/minha-frequencia', [FrequenciaController::class, 'consultarFrequenciaPropria']);

    // Módulo Acadêmico: Notas e Avaliações
    Route::post('/notas', [NotaController::class, 'lancarNotaOficial']);
    Route::put('/notas/{nota}', [NotaController::class, 'atualizarNota']);
    Route::patch('/notas/{nota}', [NotaController::class, 'atualizarNota']);
    Route::delete('/notas/{nota}', [NotaController::class, 'deletarNota']);
    Route::get('/notas/media-periodo', [NotaController::class, 'calcularMediaPeriodo']);
    Route::get('/notas/boletim/{usuario}', [NotaController::class, 'gerarBoletim']);
    Route::get('/notas/meu-boletim', [NotaController::class, 'consultarNotaPropria']);
    // Gestão de Livros (Criação, Edição, Deleção)
    Route::post('/livros', [LivroController::class, 'store']);
    Route::put('/livros/{livro}', [LivroController::class, 'update']);
    Route::patch('/livros/{livro}', [LivroController::class, 'update']);
    Route::delete('/livros/{livro}', [LivroController::class, 'destroy']);

    // Empréstimos de Livros
    Route::get('/emprestimos/meus-emprestimos', [EmprestimoController::class, 'meusEmprestimos']);
    Route::post('/emprestimos/solicitar', [EmprestimoController::class, 'solicitar']);
    Route::patch('/emprestimos/{emprestimo}/aprovar', [EmprestimoController::class, 'aprovar']);
    Route::patch('/emprestimos/{emprestimo}/renovar', [EmprestimoController::class, 'renovar']);
    Route::patch('/emprestimos/{emprestimo}/devolver', [EmprestimoController::class, 'registrarDevolucao']);
    Route::patch('/emprestimos/{emprestimo}/status', [EmprestimoController::class, 'atualizarStatus']);
    Route::apiResource('emprestimos', EmprestimoController::class)->only(['index', 'show']);

    // Módulo de Atividades (Tarefas / Trabalhos)
    Route::get('/turmas/{turma}/disciplinas/{disciplina}/atividades', [AtividadeController::class, 'listarPorTurmaEDisciplina']);
    Route::patch('/atividades/{atividade}/encerrar', [AtividadeController::class, 'encerrarRecebimentoManualmente']);
    Route::apiResource('atividades', AtividadeController::class);

    // Módulo de Submissões (Entregas de Atividades)
    Route::get('/atividades/{atividade}/submissoes', [SubmissaoController::class, 'index']);
    Route::post('/atividades/{atividade}/submissoes', [SubmissaoController::class, 'store']);
    Route::get('/atividades/{atividade}/minha-submissao', [SubmissaoController::class, 'minhaSubmissao']);
    Route::get('/submissoes/{submissao}', [SubmissaoController::class, 'show']);
    Route::put('/submissoes/{submissao}', [SubmissaoController::class, 'update']);
    Route::patch('/submissoes/{submissao}', [SubmissaoController::class, 'update']);
    Route::delete('/submissoes/{submissao}', [SubmissaoController::class, 'destroy']);
    Route::patch('/submissoes/{submissao}/avaliar', [SubmissaoController::class, 'avaliar']);
    Route::patch('/submissoes/{submissao}/feedback', [SubmissaoController::class, 'feedback']);

    // Gestão de Papéis e Permissões (Administrador)
    Route::get('/papeis', [UsuarioController::class, 'papeis']);
    Route::get('/permissoes', [UsuarioController::class, 'permissoes']);

    // Gestão de Usuários (Administrador)
    Route::patch('/usuarios/{usuario}/bloquear', [UsuarioController::class, 'bloquear']);
    Route::patch('/usuarios/{usuario}/papel', [UsuarioController::class, 'alterarPapel']);
    Route::post('/usuarios/{usuario}/permissoes', [UsuarioController::class, 'atribuirPermissoes']);
    Route::apiResource('usuarios', UsuarioController::class);
});
