<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('diretriz 1: controle de usuarios lista os 15 ultimos, filtra por role/nome, edita com notificacao super-importante e exclui em 2 etapas preservando historico', function () {
    $admin = User::factory()->create([
        'name' => 'Administrador Geral',
        'role' => UserRole::ADM,
        'status_confirmacao' => 'confirmado',
    ]);

    // Cria 18 usuários para validar o limite padrão de 15 registros
    User::factory()->count(17)->create([
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'confirmado',
    ]);

    $alvo = User::factory()->create([
        'name' => 'Carlos Drummond de Andrade',
        'email' => 'carlos.drummond@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
        'autorizado_por_id' => $admin->id,
        'confirmado_em' => now(),
    ]);

    Sanctum::actingAs($admin);

    // 1.3.1: Carregamento padrão retorna 15 usuários
    $resLista = $this->getJson('/api/usuarios');
    $resLista->assertOk();
    expect(count($resLista->json('data')))->toBe(15);

    // 1.3.2: Filtro por Role e busca pelo nome
    $resBusca = $this->getJson('/api/usuarios?role=professor&busca=Drummond');
    $resBusca->assertOk();
    expect($resBusca->json('data.0.name'))->toBe('Carlos Drummond de Andrade');

    // 1.3.8: Editar usuário (Role, comentário administrativo e notificação SUPER-IMPORTANTE)
    $resUpdate = $this->putJson("/api/usuarios/{$alvo->id}", [
        'role' => 'especialista',
        'comentario_admin' => 'Promovido à coordenação pedagógica.',
        'mensagem_notificacao' => 'Favor comparecer à reunião da diretoria.',
        'super_importante' => true,
    ]);
    $resUpdate->assertOk()
        ->assertJsonPath('role', 'especialista')
        ->assertJsonPath('comentario_admin', 'Promovido à coordenação pedagógica.');

    expect($alvo->fresh()->notifications()->count())->toBe(1);

    // 1.3.6: Exclusão em 2 etapas exige digitação exata do nome completo (estilo GitHub)
    $resFalha = $this->deleteJson("/api/usuarios/{$alvo->id}", [
        'confirmacao_nome' => 'Nome Incorreto',
    ]);
    $resFalha->assertStatus(422);

    $resExclusao = $this->deleteJson("/api/usuarios/{$alvo->id}", [
        'confirmacao_nome' => 'Carlos Drummond de Andrade',
    ]);
    $resExclusao->assertOk();

    // 1.3.7: Verifica inativação lógica sem exclusão física do usuário
    $alvoAtualizado = $alvo->fresh();
    expect($alvoAtualizado)->not->toBeNull()
        ->and($alvoAtualizado->ativo)->toBeFalse()
        ->and($alvoAtualizado->status_confirmacao)->toBe('inativo');
});

test('diretriz 2: aprovacao de login de aluno exige turma e de professor exige disciplina', function () {
    $especialista = User::factory()->create([
        'role' => UserRole::ESPECIALISTA,
        'status_confirmacao' => 'confirmado',
    ]);

    $alunoPendente = User::factory()->create([
        'name' => 'Estudante Novo',
        'email' => 'estudante.novo@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'pendente',
    ]);

    $profPendente = User::factory()->create([
        'name' => 'Docente Novo',
        'email' => 'docente.novo@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'pendente',
    ]);

    $turma = Turma::create([
        'nome_identificador' => '1º Ano A',
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $disciplina = Disciplina::create([
        'nome' => 'Língua Portuguesa',
        'aulas_semanais' => 5,
    ]);

    Sanctum::actingAs($especialista);

    // Verifica resumo de aprovações pendentes (Item 2.4)
    $resResumo = $this->getJson('/api/usuarios/pendentes-resumo');
    $resResumo->assertOk()
        ->assertJsonPath('alunos_pendentes', 1)
        ->assertJsonPath('professores_pendentes', 1)
        ->assertJsonPath('total_pendentes', 2);

    // 2.3.1: Aprovação do aluno vinculando à turma
    $resAluno = $this->patchJson("/api/usuarios/{$alunoPendente->id}/confirmar-vinculo-aluno", [
        'turma_id' => $turma->id_turma,
    ]);
    $resAluno->assertOk();
    expect($alunoPendente->fresh()->status_confirmacao)->toBe('confirmado')
        ->and($alunoPendente->fresh()->turma_ativa?->id_turma)->toBe($turma->id_turma);

    // 2.3.2: Aprovação do professor vinculando à disciplina
    $resProf = $this->patchJson("/api/professores/{$profPendente->id}/confirmar", [
        'disciplina_ids' => [$disciplina->id_disciplina],
    ]);
    $resProf->assertOk();
    expect($profPendente->fresh()->status_confirmacao)->toBe('confirmado')
        ->and($profPendente->fresh()->disciplinasDocente()->count())->toBe(1);
});

test('diretriz 3: disciplinas por ciclos calculam carga anual (40 semanas), propagam para turmas do ciclo e conciliam CSV', function () {
    $especialista = User::factory()->create([
        'role' => UserRole::ESPECIALISTA,
        'status_confirmacao' => 'confirmado',
    ]);

    $professor = User::factory()->create([
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);

    $aluno = User::factory()->create([
        'name' => 'Helena Soares',
        'email' => 'helena.soares@aluno.mg.gov.br',
        'role' => UserRole::ALUNO,
        'status_confirmacao' => 'confirmado',
    ]);

    Sanctum::actingAs($especialista);

    // 3.1, 3.2, 3.3: Cria disciplina criando novo Ciclo ("1º Ano") e calculando 4 * 40 = 160 aulas anuais
    $resDisc = $this->postJson('/api/disciplinas', [
        'nome' => 'Biologia Molecular',
        'aulas_semanais' => 4,
        'novo_ciclo_nome' => '1º Ano',
        'ementa' => 'Estudo das células e genética.',
        'habilidades_bncc' => 'EM13CNT201',
        'objetivo_geral' => 'Compreender os processos celulares.',
        'objetivo_especifico' => 'Analisar DNA e RNA.',
        'professor_ids' => [$professor->id],
    ]);

    $resDisc->assertCreated()
        ->assertJsonPath('aulas_semanais', 4)
        ->assertJsonPath('carga_horaria_anual', 160);

    $ciclo = Ciclo::where('nome', '1º Ano')->firstOrFail();

    // 3.2a: Cria turma associada ao Ciclo "1º Ano" e verifica se herdou a disciplina e o professor
    $resTurma = $this->postJson('/api/turmas', [
        'nome_identificador' => '1º Ano B - Integral',
        'ciclo_id' => $ciclo->id_ciclo,
        'turno' => 'Integral',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);
    $resTurma->assertCreated();
    $turmaId = $resTurma->json('id_turma');

    $turma = Turma::findOrFail($turmaId);
    expect($turma->turmaDisciplinas()->where('professor_id', $professor->id)->count())->toBe(1);

    // Matricula a aluna na turma para testar conciliação de CSV (3.4d)
    $this->postJson('/api/matriculas', [
        'turma_id' => $turmaId,
        'usuario_id' => $aluno->id,
    ])->assertCreated();

    $csvConteudo = implode("\n", [
        'Aluno;Biologia Molecular;Robótica Educacional',
        'Helena Soares;9,0;8,5',
    ]);
    $arquivo = UploadedFile::fake()->createWithContent('notas.csv', $csvConteudo);

    // Primeira chamada com exigir_conciliacao_disciplinas = 1 deve detectar "Robótica Educacional" como pendente
    $resCsvPendente = $this->post("/api/turmas/{$turmaId}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
        'exigir_conciliacao_disciplinas' => '1',
    ], ['Accept' => 'application/json']);

    $resCsvPendente->assertOk()
        ->assertJsonPath('status', 'pendente_confirmacao')
        ->assertJsonPath('tipo_pendencia', 'conciliacao_disciplinas');

    // Segunda chamada aprovando a criação da nova disciplina "Robótica Educacional"
    $arquivoConfirmado = UploadedFile::fake()->createWithContent('notas.csv', $csvConteudo);
    $resCsvAprovado = $this->post("/api/turmas/{$turmaId}/importar-relatorio", [
        'arquivo' => $arquivoConfirmado,
        'periodo_letivo' => '1º Trimestre',
        'exigir_conciliacao_disciplinas' => '1',
        'mapeamentos_disciplinas' => json_encode([
            'Robótica Educacional' => [
                'acao' => 'criar_nova',
                'nome_nova' => 'Robótica Educacional',
                'aulas_semanais' => 2,
            ],
        ]),
    ], ['Accept' => 'application/json']);

    $resCsvAprovado->assertOk()
        ->assertJsonPath('status', 'sucesso');

    $novaDisc = Disciplina::where('nome', 'Robótica Educacional')->first();
    expect($novaDisc)->not->toBeNull()
        ->and($novaDisc->aulas_semanais)->toBe(2)
        ->and($novaDisc->carga_horaria_anual)->toBe(80);
});

test('conciliacao csv de disciplinas vincula a nova disciplina ao ciclo_id e atualiza a turma', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA->value]);
    Sanctum::actingAs($especialista);

    $ciclo = Ciclo::create(['nome' => 'Ensino Fundamental II']);

    // Turma sem ciclo inicial
    $turma = Turma::create([
        'nome_identificador' => 'Turma 701 Teste',
        'turno' => 'Vespertino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
        'ciclo_id' => null,
    ]);

    $csvConteudo = "Aluno;Programacao Web\nCarlos Drummond;8,5";
    $arquivo = UploadedFile::fake()->createWithContent('notas_ciclo.csv', $csvConteudo);

    $res = $this->post("/api/turmas/{$turma->id_turma}/importar-relatorio", [
        'arquivo' => $arquivo,
        'periodo_letivo' => '1º Trimestre',
        'exigir_conciliacao_disciplinas' => '1',
        'mapeamentos_disciplinas' => json_encode([
            'Programacao Web' => [
                'acao' => 'criar_nova',
                'nome_nova' => 'Programação Web',
                'aulas_semanais' => 3,
                'ciclo_id' => $ciclo->id_ciclo,
            ],
        ]),
    ], ['Accept' => 'application/json']);

    $res->assertOk()->assertJsonPath('status', 'sucesso');

    $disciplina = Disciplina::where('nome', 'Programação Web')->first();
    expect($disciplina)->not->toBeNull()
        ->and($disciplina->aulas_semanais)->toBe(3)
        ->and($disciplina->ciclos->pluck('id_ciclo')->all())->toContain($ciclo->id_ciclo);

    // Turma agora deve ter o ciclo vinculado
    $turma->refresh();
    expect($turma->ciclo_id)->toBe($ciclo->id_ciclo);
});

test('integracao entre modulos: planos de estudos filtram disciplinas vinculadas, salvam conteudo e restringem compartilhamento por turmas do professor', function () {
    $ciclo1 = Ciclo::create(['nome' => '1º Ano Médio']);
    $ciclo2 = Ciclo::create(['nome' => '2º Ano Médio']);

    $turma1 = Turma::create([
        'nome_identificador' => 'Turma 101',
        'ciclo_id' => $ciclo1->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $turma2 = Turma::create([
        'nome_identificador' => 'Turma 201',
        'ciclo_id' => $ciclo2->id_ciclo,
        'turno' => 'Vespertino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $discMat = Disciplina::create([
        'nome' => 'Matemática Avançada',
        'aulas_semanais' => 3,
    ]);
    $discMat->ciclos()->sync([$ciclo1->id_ciclo]);

    $discHist = Disciplina::create([
        'nome' => 'História Contemporânea',
        'aulas_semanais' => 2,
    ]);
    $discHist->ciclos()->sync([$ciclo2->id_ciclo]);

    $profCarlos = User::factory()->create([
        'name' => 'Prof. Carlos',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);
    $profCarlos->disciplinasDocente()->sync([$discMat->id_disciplina]);

    $profMarina = User::factory()->create([
        'name' => 'Profa. Marina',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);
    $profMarina->disciplinasDocente()->sync([$discHist->id_disciplina]);

    $discMat->sincronizarComTurmasDosCiclos();
    $discHist->sincronizarComTurmasDosCiclos();

    Sanctum::actingAs($profCarlos);

    // 1. GET /api/disciplinas?vinculadas=1 retorna apenas as disciplinas do professor
    $resDisc = $this->getJson('/api/disciplinas?vinculadas=1');
    $resDisc->assertOk();
    $ids = collect($resDisc->json())->pluck('id_disciplina')->all();
    expect($ids)->toContain($discMat->id_disciplina)
        ->and($ids)->not->toContain($discHist->id_disciplina);

    // 2. POST /api/planos-estudos com disciplina_id e conteudo (upgrade)
    $resPlano = $this->postJson('/api/planos-estudos', [
        'nome' => 'Trilha Especial de Funções',
        'disciplina_id' => $discMat->id_disciplina,
        'conteudo' => 'Informática e Modelagem Matemática',
        'descricao' => 'Plano focado em funções e algoritmos.',
    ]);
    $resPlano->assertCreated()
        ->assertJsonPath('nome', 'Trilha Especial de Funções')
        ->assertJsonPath('disciplina_id', $discMat->id_disciplina)
        ->assertJsonPath('disciplina', 'Matemática Avançada')
        ->assertJsonPath('conteudo', 'Informática e Modelagem Matemática');

    $planoId = $resPlano->json('id');

    // 3. GET /api/planos-estudos/turmas-lecionadas retorna apenas as turmas do professor Carlos (Turma 101)
    $resTurmasProf = $this->getJson('/api/planos-estudos/turmas-lecionadas');
    $resTurmasProf->assertOk();
    $turmasArray = $resTurmasProf->json('data') ?? $resTurmasProf->json();
    $turmaIdsProf = collect($turmasArray)->pluck('id_turma')->all();
    expect($turmaIdsProf)->toContain($turma1->id_turma)
        ->and($turmaIdsProf)->not->toContain($turma2->id_turma);

    // 4. Compartilhar com turma onde o professor NÃO leciona deve ser rejeitado com 422
    $resInvalido = $this->putJson("/api/planos-estudos/{$planoId}/compartilhar", [
        'turma_ids' => [$turma2->id_turma],
    ]);
    $resInvalido->assertStatus(422)
        ->assertJsonValidationErrors(['turma_ids']);

    // 5. Compartilhar com sua turma vinculada (Turma 101) deve ser aprovado com 200
    $resValido = $this->putJson("/api/planos-estudos/{$planoId}/compartilhar", [
        'turma_ids' => [$turma1->id_turma],
    ]);
    $resValido->assertOk()
        ->assertJsonPath('turma_ids.0', $turma1->id_turma);

    // 6. GET /api/turmas na visão do professor retorna apenas a Turma 101
    $resTurmas = $this->getJson('/api/turmas');
    $resTurmas->assertOk();
    $turmasVisiveis = collect($resTurmas->json())->pluck('id_turma')->all();
    expect($turmasVisiveis)->toContain($turma1->id_turma)
        ->and($turmasVisiveis)->not->toContain($turma2->id_turma);
});

test('separacao de jornadas e isolamento estrito entre especialista e professor', function () {
    $ciclo1 = Ciclo::firstOrCreate(['nome' => '1º Ano EM']);
    $ciclo2 = Ciclo::firstOrCreate(['nome' => '2º Ano EM']);

    $turma1 = Turma::create([
        'nome_identificador' => '1º Ano A',
        'ciclo_id' => $ciclo1->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $turma2 = Turma::create([
        'nome_identificador' => '2º Ano A',
        'ciclo_id' => $ciclo2->id_ciclo,
        'turno' => 'Matutino',
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    $discQuimica = Disciplina::create([
        'nome' => 'Química Orgânica',
        'aulas_semanais' => 2,
    ]);
    $discQuimica->ciclos()->sync([$ciclo1->id_ciclo]);

    $discBiologia = Disciplina::create([
        'nome' => 'Biologia Celular',
        'aulas_semanais' => 2,
    ]);
    $discBiologia->ciclos()->sync([$ciclo2->id_ciclo]);

    $profQuimica = User::factory()->create([
        'name' => 'Prof. Walter',
        'email' => 'walter.quimica@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);
    $profQuimica->disciplinasDocente()->sync([$discQuimica->id_disciplina]);

    $especialista = User::factory()->create([
        'name' => 'Especialista Mariana',
        'email' => 'mariana.esp@sebastiana.edu.br',
        'role' => UserRole::ESPECIALISTA,
        'status_confirmacao' => 'confirmado',
    ]);

    $discQuimica->sincronizarComTurmasDosCiclos();
    $discBiologia->sincronizarComTurmasDosCiclos();

    // 1. Visão do Professor: /api/ciclos retorna estritamente os ciclos e disciplinas sob sua regência
    Sanctum::actingAs($profQuimica);
    $resCiclosProf = $this->getJson('/api/ciclos');
    $resCiclosProf->assertOk();
    $ciclosData = $resCiclosProf->json('data') ?? [];
    $cicloNomes = collect($ciclosData)->pluck('nome')->all();

    expect($cicloNomes)->toContain('1º Ano EM')
        ->and($cicloNomes)->not->toContain('2º Ano EM');

    // 2. Visão do Professor: /api/disciplinas (sem parâmetros) retorna apenas Química Orgânica
    $resDiscProf = $this->getJson('/api/disciplinas');
    $resDiscProf->assertOk();
    $discIdsProf = collect($resDiscProf->json())->pluck('id_disciplina')->all();
    expect($discIdsProf)->toContain($discQuimica->id_disciplina)
        ->and($discIdsProf)->not->toContain($discBiologia->id_disciplina);

    // 3. Segurança de Turma: Professor não pode visualizar notas de turma que não leciona (Turma 2) -> 403 Forbidden
    $resNotasProibidas = $this->getJson("/api/turmas/{$turma2->id_turma}/notas");
    $resNotasProibidas->assertForbidden();

    // 4. Segurança de Turma: Professor pode visualizar notas da turma onde leciona (Turma 1) -> 200 OK
    $resNotasPermitidas = $this->getJson("/api/turmas/{$turma1->id_turma}/notas");
    $resNotasPermitidas->assertOk();

    // 5. Visão do Especialista: Acesso integral a todos os ciclos e disciplinas
    Sanctum::actingAs($especialista);
    $resCiclosEsp = $this->getJson('/api/ciclos');
    $resCiclosEsp->assertOk();
    $todosCiclosNomes = collect($resCiclosEsp->json('data'))->pluck('nome')->all();
    expect($todosCiclosNomes)->toContain('1º Ano EM')
        ->and($todosCiclosNomes)->toContain('2º Ano EM');
});
