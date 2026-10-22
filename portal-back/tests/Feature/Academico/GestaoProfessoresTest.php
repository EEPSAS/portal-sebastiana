<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Especialista da instituição
    $this->especialista = User::factory()->create([
        'name' => 'Clara Especialista',
        'email' => 'clara@sebastiana.edu.br',
        'role' => UserRole::ESPECIALISTA,
        'ativo' => true,
        'status_confirmacao' => 'confirmado',
    ]);

    // Turma e disciplina de teste
    $this->turma = Turma::create([
        'nome_identificador' => '1º Ano A - Regular',
        'ano_letivo' => 2026,
        'turno' => 'Matutino',
        'status' => 'Ativa',
    ]);

    $this->disciplina = Disciplina::create([
        'nome' => 'Física Quântica Básica',
        'carga_horaria_anual' => 80,
    ]);

    // Adiciona a disciplina na turma
    TurmaDisciplina::create([
        'turma_id' => $this->turma->id_turma,
        'disciplina_id' => $this->disciplina->id_disciplina,
        'professor_id' => null,
    ]);
});

test('especialista pode listar professores com status e contagem de pendencias', function () {
    // Professor pendente
    User::factory()->create([
        'name' => 'Prof. Pendente',
        'email' => 'prof.pendente@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'pendente',
    ]);

    // Professor confirmado
    User::factory()->create([
        'name' => 'Prof. Confirmado',
        'email' => 'prof.confirmado@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);

    $response = $this->actingAs($this->especialista)
        ->getJson('/api/professores');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'email',
                    'status_confirmacao',
                    'total_disciplinas',
                    'disciplinas',
                ],
            ],
            'meta' => [
                'total',
                'pendentes_count',
            ],
        ]);

    expect($response->json('meta.pendentes_count'))->toBeGreaterThanOrEqual(1);
});

test('especialista pode confirmar um professor que pertence a escola', function () {
    $professorPendente = User::factory()->create([
        'name' => 'Prof. Novo',
        'email' => 'prof.novo@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'pendente',
    ]);

    $response = $this->actingAs($this->especialista)
        ->patchJson("/api/professores/{$professorPendente->id}/confirmar");

    $response->assertStatus(200)
        ->assertJsonPath('data.status_confirmacao', 'confirmado');

    $professorPendente->refresh();
    expect($professorPendente->status_confirmacao)->toBe('confirmado')
        ->and($professorPendente->confirmado_em)->not->toBeNull();
});

test('especialista nao pode vincular disciplina a professor pendente sem confirmacao previa', function () {
    $professorPendente = User::factory()->create([
        'name' => 'Prof. Sem Confirmar',
        'email' => 'prof.semconfirmar@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'pendente',
    ]);

    $response = $this->actingAs($this->especialista)
        ->postJson("/api/professores/{$professorPendente->id}/vincular-disciplina", [
            'disciplina_id' => $this->disciplina->id_disciplina,
        ]);

    $response->assertStatus(422)
        ->assertJsonFragment([
            'message' => 'Não é permitido vincular disciplinas a um professor com confirmação pendente. Confirme o professor primeiro.',
        ]);
});

test('especialista pode vincular disciplina a professor confirmado e reflete nas turmas', function () {
    $professorConfirmado = User::factory()->create([
        'name' => 'Prof. Confirmado',
        'email' => 'prof.confirmado@educacao.mg.gov.br',
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);

    $response = $this->actingAs($this->especialista)
        ->postJson("/api/professores/{$professorConfirmado->id}/vincular-disciplina", [
            'disciplina_id' => $this->disciplina->id_disciplina,
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.total_disciplinas', 1)
        ->assertJsonPath('data.disciplinas.0.id_disciplina', $this->disciplina->id_disciplina);

    // Valida propagação para turma_disciplinas
    $turmaDisciplina = TurmaDisciplina::where('turma_id', $this->turma->id_turma)
        ->where('disciplina_id', $this->disciplina->id_disciplina)
        ->first();

    expect($turmaDisciplina)->not->toBeNull()
        ->and($turmaDisciplina->professor_id)->toBe($professorConfirmado->id);
});

test('especialista pode desvincular disciplina do professor', function () {
    $professor = User::factory()->create([
        'role' => UserRole::PROFESSOR,
        'status_confirmacao' => 'confirmado',
    ]);

    $professor->disciplinasDocente()->attach($this->disciplina->id_disciplina);
    TurmaDisciplina::where('disciplina_id', $this->disciplina->id_disciplina)
        ->update(['professor_id' => $professor->id]);

    $response = $this->actingAs($this->especialista)
        ->deleteJson("/api/professores/{$professor->id}/desvincular-disciplina/{$this->disciplina->id_disciplina}");

    $response->assertStatus(200)
        ->assertJsonPath('data.total_disciplinas', 0);

    $turmaDisciplina = TurmaDisciplina::where('disciplina_id', $this->disciplina->id_disciplina)->first();
    expect($turmaDisciplina->professor_id)->toBeNull();
});

test('usuario comum aluno nao pode acessar endpoints de gestao de professores', function () {
    $aluno = User::factory()->create([
        'role' => UserRole::ALUNO,
        'email' => 'aluno@aluno.mg.gov.br',
    ]);

    $response = $this->actingAs($aluno)
        ->getJson('/api/professores');

    $response->assertStatus(403);
});
