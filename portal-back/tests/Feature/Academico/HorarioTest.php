<?php

use App\Enums\UserRole;
use App\Models\Ciclo;
use App\Models\Disciplina;
use App\Models\Horario;
use App\Models\HorarioAula;
use App\Models\Matricula;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;

function prepararCurriculoCompletoDoHorario(Turma $turma, User $professorA, User $professorB): void
{
    $disciplinas = [
        ['Geografia', 40, $professorB],
        ['Filosofia', 40, $professorB],
        ['Artes', 40, $professorB],
        ['Sociologia', 40, $professorB],
        ['Educação Física', 40, $professorB],
        ['Inglês', 40, $professorB],
        ['Biologia', 40, $professorB],
        ['Educação Digital', 40, $professorB],
        ['Química', 80, $professorB],
        ['Física', 80, $professorA],
        ['História', 80, $professorB],
        ['Sustentabilidade', 120, $professorA],
        ['Produção Cultural', 120, $professorB],
        ['Português', 200, $professorA],
        ['Matemática', 200, $professorA],
    ];

    foreach ($disciplinas as [$nome, $cargaAnual, $professor]) {
        $disciplina = Disciplina::query()->create([
            'nome' => $nome,
            'carga_horaria_anual' => $cargaAnual,
        ]);
        TurmaDisciplina::query()->create([
            'turma_id' => $turma->id_turma,
            'disciplina_id' => $disciplina->id_disciplina,
            'professor_id' => $professor->id,
        ]);
    }
}

test('especialista gera uma grade semanal completa com as cargas e restrições docentes', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $professorA = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $professorB = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    prepararCurriculoCompletoDoHorario($turma, $professorA, $professorB);

    $response = $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar");

    $response->assertCreated()
        ->assertJsonPath('status', 'concluido')
        ->assertJsonCount(30, 'aulas');

    $aulas = collect($response->json('aulas'));
    expect($aulas->groupBy('disciplina.nome')->map->count()->all())->toEqualCanonicalizing([
        'Geografia' => 1,
        'Filosofia' => 1,
        'Artes' => 1,
        'Sociologia' => 1,
        'Educação Física' => 1,
        'Inglês' => 1,
        'Biologia' => 1,
        'Educação Digital' => 1,
        'Química' => 2,
        'Física' => 2,
        'História' => 2,
        'Sustentabilidade' => 3,
        'Produção Cultural' => 3,
        'Português' => 5,
        'Matemática' => 5,
    ]);

    $cargasDiarias = $aulas->groupBy(fn (array $aula) => $aula['professor']['id'].'-'.$aula['dia_semana']);
    expect($cargasDiarias->max(fn ($grupo) => $grupo->count()))->toBeLessThanOrEqual(5);

    $professoresPorPosicao = $aulas->mapWithKeys(fn (array $aula) => [
        $aula['dia_semana'].'-'.$aula['aula_numero'] => $aula['professor']['id'],
    ]);
    for ($dia = 1; $dia <= 5; $dia++) {
        for ($periodo = 1; $periodo <= 4; $periodo++) {
            $professor = $professoresPorPosicao->get("{$dia}-{$periodo}");
            if ($professor === null) {
                continue;
            }
            expect($professor !== $professoresPorPosicao->get("{$dia}-".($periodo + 1))
                || $professor !== $professoresPorPosicao->get("{$dia}-".($periodo + 2)))->toBeTrue();
        }
    }

    expect(Horario::query()->where('turma_id', $turma->id_turma)->where('ano_letivo', 2026)->count())->toBe(1);
});

test('geração rejeita currículos incompletos e não cria uma grade inválida', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $professor = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $disciplina = Disciplina::factory()->create([
        'nome' => 'Matemática',
        'carga_horaria_anual' => 200,
    ]);
    TurmaDisciplina::query()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professor->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('curriculo');

    expect(Horario::query()->where('turma_id', $turma->id_turma)->exists())->toBeFalse();
});

test('geração respeita períodos já ocupados por professores em outras turmas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $professorA = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $professorB = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    prepararCurriculoCompletoDoHorario($turma, $professorA, $professorB);
    $turmaExistente = Turma::factory()->create(['ano_letivo' => 2026]);
    $disciplina = Disciplina::factory()->create();
    $horarioExistente = Horario::query()->create([
        'turma_id' => $turmaExistente->id_turma,
        'ano_letivo' => 2026,
        'status' => 'concluido',
    ]);
    HorarioAula::query()->create([
        'horario_id' => $horarioExistente->id,
        'dia_semana' => 1,
        'aula_numero' => 1,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professorA->id,
    ]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar")
        ->assertCreated();

    $aulaOcupada = collect($response->json('aulas'))->first(
        fn (array $aula) => $aula['dia_semana'] === 1 && $aula['aula_numero'] === 1
    );
    expect($aulaOcupada['professor']['id'])->not->toBe($professorA->id);
});

test('aluno e professor consultam somente as turmas que lhes pertencem', function () {
    $aluno = User::factory()->create(['role' => UserRole::ALUNO]);
    $professor = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $turmaDoAluno = Turma::factory()->create(['nome_identificador' => 'Turma do aluno']);
    $turmaDoProfessor = Turma::factory()->create(['nome_identificador' => 'Turma do professor']);
    $turmaAlheia = Turma::factory()->create(['nome_identificador' => 'Turma alheia']);
    Matricula::query()->create([
        'turma_id' => $turmaDoAluno->id_turma,
        'usuario_id' => $aluno->id,
        'data_matricula' => '2026-02-01',
        'status_matricula' => 'Ativo',
    ]);
    $disciplina = Disciplina::factory()->create();
    TurmaDisciplina::query()->create([
        'turma_id' => $turmaDoProfessor->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professor->id,
    ]);

    $horariosDoAluno = $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/horarios')
        ->assertOk()
        ->assertJsonCount(1);
    expect($horariosDoAluno->json('0.turma.id_turma'))->toBe($turmaDoAluno->id_turma);

    $horariosDoProfessor = $this->actingAs($professor, 'sanctum')
        ->getJson('/api/horarios')
        ->assertOk()
        ->assertJsonCount(1);
    expect($horariosDoProfessor->json('0.turma.id_turma'))->toBe($turmaDoProfessor->id_turma);

    expect($turmaAlheia->id_turma)->not->toBe($turmaDoAluno->id_turma);
});

test('bibliotecária não pode consultar nem gerar horários', function () {
    $bibliotecaria = User::factory()->create(['role' => UserRole::BIBLIOTECARIA]);
    $turma = Turma::factory()->create();

    $this->actingAs($bibliotecaria, 'sanctum')
        ->getJson('/api/horarios')
        ->assertForbidden();

    $this->actingAs($bibliotecaria, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar")
        ->assertForbidden();
});

test('mover aula rejeita sobreposição com professor em outra turma sem alterar as aulas', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $professorA = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $professorB = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $disciplinaA = Disciplina::factory()->create();
    $disciplinaB = Disciplina::factory()->create();
    $turmaA = Turma::factory()->create(['ano_letivo' => 2026]);
    $turmaB = Turma::factory()->create(['ano_letivo' => 2026]);
    $horarioA = Horario::query()->create([
        'turma_id' => $turmaA->id_turma,
        'ano_letivo' => 2026,
        'status' => 'concluido',
    ]);
    $horarioB = Horario::query()->create([
        'turma_id' => $turmaB->id_turma,
        'ano_letivo' => 2026,
        'status' => 'concluido',
    ]);
    $aulaOrigem = HorarioAula::query()->create([
        'horario_id' => $horarioA->id,
        'dia_semana' => 1,
        'aula_numero' => 1,
        'disciplina_id' => $disciplinaA->id_disciplina,
        'professor_id' => $professorA->id,
    ]);
    HorarioAula::query()->create([
        'horario_id' => $horarioA->id,
        'dia_semana' => 3,
        'aula_numero' => 1,
        'disciplina_id' => $disciplinaB->id_disciplina,
        'professor_id' => $professorB->id,
    ]);
    HorarioAula::query()->create([
        'horario_id' => $horarioB->id,
        'dia_semana' => 3,
        'aula_numero' => 1,
        'disciplina_id' => $disciplinaA->id_disciplina,
        'professor_id' => $professorA->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/horarios/{$horarioA->id}/aulas/{$aulaOrigem->id}", [
            'destino_dia_semana' => 3,
            'destino_aula_numero' => 1,
        ])
        ->assertUnprocessable()
        ->assertJsonPath('errors.horario.0', 'Este professor já está em aula em outra turma nesse período.');

    expect($aulaOrigem->fresh()->dia_semana)->toBe(1)
        ->and($aulaOrigem->fresh()->aula_numero)->toBe(1);
});

test('movimentação valida o dia e o período de destino', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $horario = Horario::query()->create([
        'turma_id' => $turma->id_turma,
        'ano_letivo' => $turma->ano_letivo,
        'status' => 'concluido',
    ]);
    $professor = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $disciplina = Disciplina::factory()->create();
    $aula = HorarioAula::query()->create([
        'horario_id' => $horario->id,
        'dia_semana' => 1,
        'aula_numero' => 1,
        'disciplina_id' => $disciplina->id_disciplina,
        'professor_id' => $professor->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/horarios/{$horario->id}/aulas/{$aula->id}", [
            'destino_dia_semana' => 6,
            'destino_aula_numero' => 7,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['destino_dia_semana', 'destino_aula_numero']);
});

test('movimentação troca as posições ocupadas e persiste a nova grade', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $horario = Horario::query()->create([
        'turma_id' => $turma->id_turma,
        'ano_letivo' => $turma->ano_letivo,
        'status' => 'concluido',
    ]);
    $professores = User::factory()->count(2)->sequence(
        ['role' => UserRole::PROFESSOR],
        ['role' => UserRole::PROFESSOR],
    )->create();
    $disciplinas = Disciplina::factory()->count(2)->create();
    $aulaOrigem = HorarioAula::query()->create([
        'horario_id' => $horario->id,
        'dia_semana' => 1,
        'aula_numero' => 1,
        'disciplina_id' => $disciplinas[0]->id_disciplina,
        'professor_id' => $professores[0]->id,
    ]);
    $aulaDestino = HorarioAula::query()->create([
        'horario_id' => $horario->id,
        'dia_semana' => 2,
        'aula_numero' => 1,
        'disciplina_id' => $disciplinas[1]->id_disciplina,
        'professor_id' => $professores[1]->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/horarios/{$horario->id}/aulas/{$aulaOrigem->id}", [
            'destino_dia_semana' => 2,
            'destino_aula_numero' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('status', 'concluido');

    expect($aulaOrigem->fresh()->dia_semana)->toBe(2)
        ->and($aulaDestino->fresh()->dia_semana)->toBe(1);
});

test('movimentação impede três aulas seguidas do mesmo professor', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $turma = Turma::factory()->create();
    $horario = Horario::query()->create([
        'turma_id' => $turma->id_turma,
        'ano_letivo' => $turma->ano_letivo,
        'status' => 'concluido',
    ]);
    $professorA = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $professorB = User::factory()->create(['role' => UserRole::PROFESSOR]);
    $disciplinaA = Disciplina::factory()->create();
    $disciplinaB = Disciplina::factory()->create();
    foreach ([1, 2, 4] as $periodo) {
        HorarioAula::query()->create([
            'horario_id' => $horario->id,
            'dia_semana' => 1,
            'aula_numero' => $periodo,
            'disciplina_id' => $disciplinaA->id_disciplina,
            'professor_id' => $professorA->id,
        ]);
    }
    $aulaMovida = HorarioAula::query()->create([
        'horario_id' => $horario->id,
        'dia_semana' => 1,
        'aula_numero' => 3,
        'disciplina_id' => $disciplinaB->id_disciplina,
        'professor_id' => $professorB->id,
    ]);

    $this->actingAs($especialista, 'sanctum')
        ->patchJson("/api/horarios/{$horario->id}/aulas/{$aulaMovida->id}", [
            'destino_dia_semana' => 1,
            'destino_aula_numero' => 4,
        ])
        ->assertUnprocessable()
        ->assertJsonPath('errors.horario.0', 'O mesmo professor não pode dar três aulas seguidas na mesma turma.');

    expect($aulaMovida->fresh()->aula_numero)->toBe(3);
});

test('geração de horário em turma com ciclo remove vínculos órfãos homônimos e gera grade sem falso erro de duplicidade', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA, 'status_confirmacao' => 'confirmado']);
    $profLuiza = User::factory()->create(['name' => 'Luiza', 'role' => UserRole::PROFESSOR, 'status_confirmacao' => 'confirmado']);
    $profAdao = User::factory()->create(['name' => 'Adao', 'role' => UserRole::PROFESSOR, 'status_confirmacao' => 'confirmado']);

    $cicloAntigo = Ciclo::query()->create(['nome' => '1º Ano - Ensino Médio']);
    $cicloRegular = Ciclo::query()->create(['nome' => '1º Ano - Regular']);

    $turma = Turma::factory()->create([
        'nome_identificador' => '1º Ano',
        'ciclo_id' => $cicloRegular->id_ciclo,
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    // Disciplinas residuais/órfãs (de outro ciclo ou catálogo legado) já presas em turma_disciplinas
    $portuguesLegado = Disciplina::query()->create(['nome' => 'Língua Portuguesa e Literatura', 'aulas_semanais' => 3]);
    $matematicaOutroCiclo = Disciplina::query()->create(['nome' => 'Matemática', 'aulas_semanais' => 4]);
    $portuguesLegado->ciclos()->sync([$cicloAntigo->id_ciclo]);

    TurmaDisciplina::query()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $portuguesLegado->id_disciplina,
        'professor_id' => $profLuiza->id,
    ]);
    TurmaDisciplina::query()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $matematicaOutroCiclo->id_disciplina,
        'professor_id' => $profAdao->id,
    ]);

    // Disciplinas oficiais do ciclo atual ("1º Ano - Regular")
    $portuguesCiclo = Disciplina::query()->create(['nome' => 'Língua Portuguesa', 'aulas_semanais' => 4]);
    $matematicaCiclo = Disciplina::query()->create(['nome' => 'Matemática', 'aulas_semanais' => 4]);
    $sociologiaCiclo = Disciplina::query()->create(['nome' => 'Sociologia', 'aulas_semanais' => 1]);

    $portuguesCiclo->ciclos()->sync([$cicloRegular->id_ciclo]);
    $portuguesCiclo->professores()->sync([$profLuiza->id]);

    $matematicaCiclo->ciclos()->sync([$cicloRegular->id_ciclo]);
    $matematicaCiclo->professores()->sync([$profAdao->id]);

    $sociologiaCiclo->ciclos()->sync([$cicloRegular->id_ciclo]);
    $sociologiaCiclo->professores()->sync([$profAdao->id]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar");

    $response->assertCreated()
        ->assertJsonPath('status', 'concluido')
        ->assertJsonCount(9, 'aulas');

    // Garante que os vínculos órfãos foram eliminados de turma_disciplinas
    $idsVinculados = TurmaDisciplina::query()
        ->where('turma_id', $turma->id_turma)
        ->pluck('disciplina_id')
        ->all();

    expect($idsVinculados)->toEqualCanonicalizing([
        $portuguesCiclo->id_disciplina,
        $matematicaCiclo->id_disciplina,
        $sociologiaCiclo->id_disciplina,
    ]);
});

test('limpeza de vínculos órfãos persiste mesmo quando alguma disciplina do ciclo ainda está sem professor', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA, 'status_confirmacao' => 'confirmado']);
    $profLuiza = User::factory()->create(['role' => UserRole::PROFESSOR, 'status_confirmacao' => 'confirmado']);

    $cicloRegular = Ciclo::query()->create(['nome' => '1º Ano - Regular']);
    $turma = Turma::factory()->create([
        'nome_identificador' => '1º Ano',
        'ciclo_id' => $cicloRegular->id_ciclo,
        'ano_letivo' => 2026,
        'status' => 'Ativa',
    ]);

    // Vínculo órfão homônimo
    $fisicaOrfa = Disciplina::query()->create(['nome' => 'Física', 'aulas_semanais' => 2]);
    TurmaDisciplina::query()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $fisicaOrfa->id_disciplina,
        'professor_id' => $profLuiza->id,
    ]);

    // Disciplinas do ciclo (Física ainda sem professor vinculado)
    $portugues = Disciplina::query()->create(['nome' => 'Língua Portuguesa', 'aulas_semanais' => 4]);
    $portugues->ciclos()->sync([$cicloRegular->id_ciclo]);
    $portugues->professores()->sync([$profLuiza->id]);

    $fisicaCiclo = Disciplina::query()->create(['nome' => 'Física', 'aulas_semanais' => 2]);
    $fisicaCiclo->ciclos()->sync([$cicloRegular->id_ciclo]);

    $response = $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/turmas/{$turma->id_turma}/horario/gerar")
        ->assertUnprocessable();

    $errosCurriculo = $response->json('errors.curriculo');
    expect($errosCurriculo)->toBe(['Vincule um professor válido à disciplina Física.'])
        ->and(TurmaDisciplina::where('turma_id', $turma->id_turma)->where('disciplina_id', $fisicaOrfa->id_disciplina)->exists())
        ->toBeFalse();
});

test('vincular professor a disciplina sem ciclo não polui turmas governadas por ciclo escolar', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA, 'status_confirmacao' => 'confirmado']);
    $professor = User::factory()->create(['role' => UserRole::PROFESSOR, 'status_confirmacao' => 'confirmado']);

    $ciclo = Ciclo::query()->create(['nome' => '1º Ano - Regular']);
    $turmaComCiclo = Turma::factory()->create([
        'nome_identificador' => '1º Ano',
        'ciclo_id' => $ciclo->id_ciclo,
        'status' => 'Ativa',
    ]);

    $disciplinaSemCiclo = Disciplina::query()->create(['nome' => 'Geografia', 'aulas_semanais' => 2]);

    $this->actingAs($especialista, 'sanctum')
        ->postJson("/api/professores/{$professor->id}/vincular-disciplina", [
            'disciplina_id' => $disciplinaSemCiclo->id_disciplina,
        ])
        ->assertOk();

    expect(TurmaDisciplina::where('turma_id', $turmaComCiclo->id_turma)
        ->where('disciplina_id', $disciplinaSemCiclo->id_disciplina)
        ->exists())->toBeFalse();
});
