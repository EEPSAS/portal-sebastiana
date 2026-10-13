<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use App\Models\User;

test('especialista pode consolidar chamada diaria em lote e aluno consulta sua frequencia', function () {
    $especialista = User::factory()->create(['role' => UserRole::ESPECIALISTA]);
    $aluno1 = User::factory()->create(['role' => UserRole::PADRAO]);
    $aluno2 = User::factory()->create(['role' => UserRole::PADRAO]);

    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    // Matricular alunos para entrarem nos relatórios da turma
    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno1->id, 'status_matricula' => 'Ativo']);
    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno2->id, 'status_matricula' => 'Ativo']);

    // Consolidar chamada diária em lote
    $response = $this->actingAs($especialista, 'sanctum')->postJson('/api/frequencias/consolidar-chamada', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'data_aula' => '2026-03-10',
        'quantidade_aulas' => 2,
        'chamada' => [
            [
                'usuario_id' => $aluno1->id,
                'status_presenca' => 'Presente',
            ],
            [
                'usuario_id' => $aluno2->id,
                'status_presenca' => 'Falta',
                'justificativa' => 'Atestado médico entregue',
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('total', 2);

    expect(Frequencia::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno1->id)
        ->value('status_presenca'))->toBe('Presente');

    expect(Frequencia::where('turma_id', $turma->id_turma)
        ->where('usuario_id', $aluno2->id)
        ->value('status_presenca'))->toBe('Falta');

    // Relatório de faltas
    $relatorio = $this->actingAs($especialista, 'sanctum')->getJson("/api/frequencias/relatorio-faltas?turma_id={$turma->id_turma}&disciplina_id={$disciplina->id_disciplina}");
    $relatorio->assertOk()
        ->assertJsonFragment(['aluno_id' => $aluno2->id, 'faltas' => 2]);

    // Aluno 1 consulta própria frequência
    $this->actingAs($aluno1, 'sanctum')->getJson('/api/frequencias/minha-frequencia')
        ->assertOk()
        ->assertJsonPath('resumo.presencas', 2)
        ->assertJsonPath('resumo.faltas', 0);
});

test('especialista e admin podem lancar notas, calcular medias e aluno consulta seu boletim', function () {
    $admin = User::factory()->create(['role' => UserRole::ADM]);
    $aluno = User::factory()->create(['role' => UserRole::PADRAO]);

    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Matemática']);

    // Matricular aluno
    Matricula::factory()->create(['turma_id' => $turma->id_turma, 'usuario_id' => $aluno->id, 'status_matricula' => 'Ativo']);

    // Lançar primeira nota (1º Bimestre)
    $resp1 = $this->actingAs($admin, 'sanctum')->postJson('/api/notas', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'tipo_avaliacao' => 'Prova Bimestral',
        'valor_nota' => 8.5,
        'valor_maximo' => 10.0,
    ]);

    $resp1->assertCreated()
        ->assertJsonPath('valor_nota', 8.5);

    // Lançar segunda nota (1º Bimestre)
    $this->actingAs($admin, 'sanctum')->postJson('/api/notas', [
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'usuario_id' => $aluno->id,
        'periodo_letivo' => '1º Bimestre',
        'tipo_avaliacao' => 'Trabalho Prático',
        'valor_nota' => 9.5,
        'valor_maximo' => 10.0,
    ])->assertCreated();

    // Calcular média do período (1º Bimestre: (8.5 + 9.5) / 2 = 9.0)
    $mediaResp = $this->actingAs($admin, 'sanctum')->getJson("/api/notas/media-periodo?turma_id={$turma->id_turma}&disciplina_id={$disciplina->id_disciplina}&periodo_letivo=1º Bimestre");
    $mediaResp->assertOk()
        ->assertJsonPath('periodo_letivo', '1º Bimestre')
        ->assertJsonFragment(['aluno_id' => $aluno->id, 'media' => 9, 'avaliacoes' => 2]);

    // Gerar boletim via admin
    $boletimAdmin = $this->actingAs($admin, 'sanctum')->getJson("/api/notas/boletim/{$aluno->id}");
    $boletimAdmin->assertOk()
        ->assertJsonFragment(['disciplina' => 'Matemática', 'media_final' => 9]);

    // Aluno consulta o seu próprio boletim
    $boletimAluno = $this->actingAs($aluno, 'sanctum')->getJson('/api/notas/meu-boletim');
    $boletimAluno->assertOk()
        ->assertJsonFragment(['disciplina' => 'Matemática', 'media_final' => 9]);

    // Aluno tenta gerar boletim de outro usuário -> deve falhar com 403
    $outroAluno = User::factory()->create(['role' => UserRole::PADRAO]);
    $this->actingAs($aluno, 'sanctum')->getJson("/api/notas/boletim/{$outroAluno->id}")
        ->assertForbidden();
});
