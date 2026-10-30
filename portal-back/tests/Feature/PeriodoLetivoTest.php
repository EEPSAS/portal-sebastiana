<?php

use App\Enums\UserRole;
use App\Models\Evento;
use App\Models\PeriodoLetivo;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function criarUsuarioPapel(UserRole $role): User
{
    return User::factory()->create([
        'role' => $role,
        'status_confirmacao' => 'confirmado',
    ]);
}

test('especialista cria periodo letivo com 3 trimestres e sincroniza marcos na agenda', function () {
    $especialista = criarUsuarioPapel(UserRole::ESPECIALISTA);
    Sanctum::actingAs($especialista);

    $payload = [
        'ano' => 2027,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100.00,
        'data_inicio' => '2027-02-08',
        'data_fim' => '2027-12-17',
        'ativo' => true,
        'divisoes' => [
            [
                'numero' => 1,
                'nome' => '1º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => '2027-02-08',
                'data_fim' => '2027-04-30',
                'ordem' => 1,
            ],
            [
                'numero' => 2,
                'nome' => '2º Trimestre',
                'pontos' => 30.00,
                'data_inicio' => '2027-05-03',
                'data_fim' => '2027-08-31',
                'ordem' => 2,
            ],
            [
                'numero' => 3,
                'nome' => '3º Trimestre',
                'pontos' => 40.00,
                'data_inicio' => '2027-09-01',
                'data_fim' => '2027-12-17',
                'ordem' => 3,
            ],
        ],
    ];

    $response = $this->postJson('/api/periodos-letivos', $payload);

    $response->assertCreated()
        ->assertJsonPath('ano', 2027)
        ->assertJsonPath('tipo_divisao', 'trimestre')
        ->assertJsonPath('total_pontos', 100)
        ->assertJsonPath('ativo', true)
        ->assertJsonCount(3, 'divisoes');

    $this->assertDatabaseHas('periodos_letivos', ['ano' => 2027, 'ativo' => 1]);
    $this->assertDatabaseCount('periodo_letivo_divisoes', 3);

    // Confere marcos sincronizados no calendário institucional
    $marcos = Evento::where('descricao', 'like', '%[Marco Escolar - Ano Letivo 2027]%')->get();
    expect($marcos->count())->toBeGreaterThanOrEqual(5); // Início ano, 3 trimestres, encerramento ano
});

test('validação bloqueia periodo letivo quando soma dos pontos das divisões diverge do total', function () {
    Sanctum::actingAs(criarUsuarioPapel(UserRole::ESPECIALISTA));

    $payload = [
        'ano' => 2028,
        'tipo_divisao' => 'trimestre',
        'total_pontos' => 100.00,
        'data_inicio' => '2028-02-07',
        'data_fim' => '2028-12-15',
        'divisoes' => [
            ['numero' => 1, 'nome' => '1º Tri', 'pontos' => 30.00, 'data_inicio' => '2028-02-07', 'data_fim' => '2028-04-30'],
            ['numero' => 2, 'nome' => '2º Tri', 'pontos' => 30.00, 'data_inicio' => '2028-05-02', 'data_fim' => '2028-08-31'],
            ['numero' => 3, 'nome' => '3º Tri', 'pontos' => 35.00, 'data_inicio' => '2028-09-01', 'data_fim' => '2028-12-15'], // Soma 95 != 100
        ],
    ];

    $this->postJson('/api/periodos-letivos', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('total_pontos');
});

test('validação bloqueia quando quantidade de etapas nao corresponde ao tipo escolhido', function () {
    Sanctum::actingAs(criarUsuarioPapel(UserRole::ESPECIALISTA));

    $payload = [
        'ano' => 2028,
        'tipo_divisao' => 'bimestre', // Exige 4 bimestres
        'total_pontos' => 100.00,
        'data_inicio' => '2028-02-07',
        'data_fim' => '2028-12-15',
        'divisoes' => [
            ['numero' => 1, 'nome' => '1º Bim', 'pontos' => 50.00, 'data_inicio' => '2028-02-07', 'data_fim' => '2028-06-30'],
            ['numero' => 2, 'nome' => '2º Bim', 'pontos' => 50.00, 'data_inicio' => '2028-08-01', 'data_fim' => '2028-12-15'],
        ],
    ];

    $this->postJson('/api/periodos-letivos', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('divisoes');
});

test('especialista define novo periodo como ativo desativando o anterior', function () {
    Sanctum::actingAs(criarUsuarioPapel(UserRole::ESPECIALISTA));

    $periodo1 = PeriodoLetivo::factory()->ativo()->comTrimestres()->create(['ano' => 2025]);
    $periodo2 = PeriodoLetivo::factory()->comTrimestres()->create(['ano' => 2026, 'ativo' => false]);

    expect($periodo1->fresh()->ativo)->toBeTrue();
    expect($periodo2->fresh()->ativo)->toBeFalse();

    $this->patchJson("/api/periodos-letivos/{$periodo2->id_periodo_letivo}/ativar")
        ->assertOk()
        ->assertJsonPath('ativo', true);

    expect($periodo1->fresh()->ativo)->toBeFalse();
    expect($periodo2->fresh()->ativo)->toBeTrue();
});

test('aluno e professor conseguem consultar periodo letivo ativo mas nao podem criar', function () {
    PeriodoLetivo::factory()->ativo()->comTrimestres()->create(['ano' => 2026]);

    // Aluno consulta
    Sanctum::actingAs(criarUsuarioPapel(UserRole::ALUNO));
    $this->getJson('/api/periodos-letivos/ativo')
        ->assertOk()
        ->assertJsonPath('ano', 2026);

    // Aluno tenta criar
    $this->postJson('/api/periodos-letivos', ['ano' => 2029])
        ->assertForbidden();

    // Professor tenta criar
    Sanctum::actingAs(criarUsuarioPapel(UserRole::PROFESSOR));
    $this->postJson('/api/periodos-letivos', ['ano' => 2029])
        ->assertForbidden();
});

test('exclusão de periodo letivo é bloqueada caso existam turmas vinculadas ao ano', function () {
    Sanctum::actingAs(criarUsuarioPapel(UserRole::ESPECIALISTA));

    $periodo = PeriodoLetivo::factory()->comTrimestres()->create(['ano' => 2026]);
    Turma::factory()->create(['ano_letivo' => 2026]);

    $this->deleteJson("/api/periodos-letivos/{$periodo->id_periodo_letivo}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('periodo');

    $this->assertDatabaseHas('periodos_letivos', ['id_periodo_letivo' => $periodo->id_periodo_letivo]);
});
