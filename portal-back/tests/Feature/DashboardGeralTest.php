<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('especialista pode acessar /api/dashboard/geral com dados consolidados reais', function () {
    $especialista = User::where('email', 'clara.mendes@sebastiana.edu.br')->first();

    $response = $this->actingAs($especialista, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertOk()
        ->assertJsonStructure([
            'kpis' => [
                'total_alunos',
                'media_geral',
                'frequencia_media',
                'noticias_publicadas',
                'total_turmas',
            ],
            'resumo_turmas' => [
                'medias' => [
                    '*' => ['id', 'turma', 'nota'],
                ],
                'frequencias' => [
                    '*' => ['id', 'turma', 'percentual'],
                ],
            ],
            'ultimas_atualizacoes',
        ]);

    expect($response->json('kpis.total_alunos'))->toBeGreaterThanOrEqual(1)
        ->and($response->json('kpis.total_turmas'))->toBeGreaterThanOrEqual(1)
        ->and($response->json('resumo_turmas.medias'))->not->toBeEmpty();
});

test('professor pode acessar /api/dashboard/geral com dados de suas turmas lecionadas', function () {
    $professor = User::where('email', 'carlos.silva@sebastiana.edu.br')->first();

    $response = $this->actingAs($professor, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertOk()
        ->assertJsonStructure([
            'kpis' => [
                'total_alunos',
                'media_geral',
                'frequencia_media',
                'noticias_publicadas',
                'total_turmas',
            ],
            'resumo_turmas' => [
                'medias',
                'frequencias',
            ],
            'ultimas_atualizacoes',
        ]);

    expect($response->json('kpis.total_turmas'))->toBeGreaterThanOrEqual(1);
});

test('aluno comum nao pode acessar /api/dashboard/geral recebendo erro 403', function () {
    $aluno = User::where('email', 'yasmin.teixeira@sebastiana.edu.br')->first();

    $response = $this->actingAs($aluno, 'sanctum')
        ->getJson('/api/dashboard/geral');

    $response->assertForbidden();
});

test('requisicao nao autenticada em /api/dashboard/geral retorna 401', function () {
    $response = $this->getJson('/api/dashboard/geral');

    $response->assertUnauthorized();
});
