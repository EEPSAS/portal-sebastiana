<?php

use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;

function prepararTurmaParaLancamentosManuais(): array
{
    $turma = Turma::factory()->create(['ano_letivo' => 2026]);
    $disciplina = Disciplina::factory()->create(['carga_horaria_anual' => 60]);
    $aluno = User::factory()->aluno()->create();
    $especialista = User::factory()->especialista()->create();

    Matricula::factory()->create([
        'turma_id' => $turma->id_turma,
        'usuario_id' => $aluno->id,
    ]);
    TurmaDisciplina::factory()->create([
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
    ]);

    return [$turma, $disciplina, $aluno, $especialista];
}

test('specialist can manually create a grade using the existing grade table and trigger academic alerts', function () {
    [$turma, $disciplina, $aluno, $especialista] = prepararTurmaParaLancamentosManuais();

    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/notas', [
            'turma_id' => $turma->id_turma,
            'disciplina_id' => $disciplina->id_disciplina,
            'usuario_id' => $aluno->id,
            'periodo_letivo' => '1º Trimestre',
            'tipo_avaliacao' => 'Avaliação manual',
            'valor_nota' => 27,
            'valor_maximo' => 30,
            'data_registro' => '2026-03-10',
        ])
        ->assertCreated()
        ->assertJsonPath('valor_nota', 27)
        ->assertJsonPath('usuario_id', $aluno->id);

    expect(Nota::query()->where('usuario_id', $aluno->id)->count())->toBe(1)
        ->and($aluno->notifications()->where('data->tipo', 'nota_destaque')->count())->toBe(1);
});

test('specialist can manually create individual attendance and trigger low attendance alerts', function () {
    [$turma, $disciplina, $aluno, $especialista] = prepararTurmaParaLancamentosManuais();

    $this->actingAs($especialista, 'sanctum')
        ->postJson('/api/frequencias', [
            'turma_id' => $turma->id_turma,
            'disciplina_id' => $disciplina->id_disciplina,
            'usuario_id' => $aluno->id,
            'data_aula' => '2026-03-10',
            'quantidade_aulas' => 5,
            'status_presenca' => 'Falta',
            'justificativa' => 'Lançamento manual de recuperação.',
        ])
        ->assertCreated()
        ->assertJsonPath('status_presenca', 'Falta')
        ->assertJsonPath('usuario_id', $aluno->id);

    expect(Frequencia::query()->where('usuario_id', $aluno->id)->count())->toBe(1)
        ->and($aluno->notifications()->where('data->tipo', 'frequencia_risco')->count())->toBe(1);
});

test('professor cannot create manual grades or attendance', function () {
    [$turma, $disciplina, $aluno] = prepararTurmaParaLancamentosManuais();
    $professor = User::factory()->professor()->create();
    $payload = [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
    ];

    $this->actingAs($professor, 'sanctum')
        ->postJson('/api/notas', [
            ...$payload,
            'periodo_letivo' => '1º Trimestre',
            'tipo_avaliacao' => 'Prova',
            'valor_nota' => 8,
            'valor_maximo' => 10,
        ])
        ->assertForbidden();

    $this->actingAs($professor, 'sanctum')
        ->postJson('/api/frequencias', [
            ...$payload,
            'data_aula' => '2026-03-10',
            'quantidade_aulas' => 1,
            'status_presenca' => 'Presente',
        ])
        ->assertForbidden();
});
