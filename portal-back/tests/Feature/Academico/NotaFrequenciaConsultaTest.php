<?php

use App\Enums\UserRole;
use App\Models\Disciplina;
use App\Models\Frequencia;
use App\Models\Matricula;
use App\Models\Nota;
use App\Models\Turma;
use Laravel\Sanctum\Sanctum;

/**
 * NotaFrequenciaConsultaTest - Testes dos Endpoints Consultivos de Notas e Frequências
 *
 * Papel Didático:
 * Verifica os endpoints ativos de consulta de boletim, médias por período e
 * relatórios de faltas, bem como a blindagem de validação via FormRequest
 * (CalcularMediaPeriodoRequest e GerarRelatorioFaltasRequest) e restrições RBAC.
 */
test('Especialista calcula media do periodo por turma e disciplina e recebe 422 para parametros invalidos', function () {
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    Matricula::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'status_matricula' => 'Ativo',
    ]);

    Nota::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 20.0,
    ]);
    Nota::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 24.0,
    ]);

    Sanctum::actingAs($especialista);

    // Valida blindagem FormRequest (CalcularMediaPeriodoRequest) quando parâmetros obrigatórios faltam
    $this->getJson('/api/notas/media-periodo')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['turma_id', 'disciplina_id', 'periodo_letivo']);

    // Consulta válida calcula média das avaliações (20 + 24) / 2 = 22
    $this->getJson("/api/notas/media-periodo?turma_id={$turma->id_turma}&disciplina_id={$disciplina->id_disciplina}&periodo_letivo=".urlencode('1º Trimestre'))
        ->assertOk()
        ->assertJsonPath('turma.id_turma', $turma->id_turma)
        ->assertJsonPath('disciplina.id_disciplina', $disciplina->id_disciplina)
        ->assertJsonPath('medias.0.aluno_id', $aluno->id)
        ->assertJsonPath('medias.0.media', 22)
        ->assertJsonPath('medias.0.avaliacoes', 2);
});

test('Aluno nao pode acessar media-periodo ou boletim de terceiros mas consulta meu-boletim com sucesso', function () {
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);
    $outroAluno = criarUsuarioComPapel(UserRole::ALUNO);
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create(['nome' => 'Matemática']);

    Nota::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '1º Trimestre',
        'valor_nota' => 22.0,
    ]);
    Nota::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '2º Trimestre',
        'valor_nota' => 20.0,
    ]);
    Nota::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'periodo_letivo' => '3º Trimestre',
        'valor_nota' => 25.0,
    ]);

    Sanctum::actingAs($aluno);

    // Aluno bloqueado nos endpoints de gestão de notas
    $this->getJson("/api/notas/media-periodo?turma_id={$turma->id_turma}&disciplina_id={$disciplina->id_disciplina}&periodo_letivo=1")
        ->assertForbidden();

    $this->getJson("/api/notas/boletim/{$outroAluno->id}")
        ->assertForbidden();

    // Aluno consulta seu próprio boletim (soma trimestral = 67.0 >= 60 -> Aprovado)
    $this->getJson('/api/notas/meu-boletim')
        ->assertOk()
        ->assertJsonPath('aluno.id', $aluno->id)
        ->assertJsonPath('disciplinas.0.disciplina', 'Matemática')
        ->assertJsonPath('disciplinas.0.media_final', 67)
        ->assertJsonPath('disciplinas.0.status', 'Aprovado');

    // Especialista consulta boletim nominal do aluno via /api/notas/boletim/{usuario}
    Sanctum::actingAs($especialista);
    $this->getJson("/api/notas/boletim/{$aluno->id}")
        ->assertOk()
        ->assertJsonPath('aluno.id', $aluno->id)
        ->assertJsonPath('disciplinas.0.media_final', 67);
});

test('Relatorio de faltas da turma e minha-frequencia calculam presencas, faltas e percentual com precisao', function () {
    $especialista = criarUsuarioComPapel(UserRole::ESPECIALISTA);
    $aluno = criarUsuarioComPapel(UserRole::ALUNO);
    $turma = Turma::factory()->create();
    $disciplina = Disciplina::factory()->create();

    Matricula::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'status_matricula' => 'Ativo',
    ]);

    Frequencia::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'data_aula' => '2026-03-10',
        'status_presenca' => 'Presente',
        'quantidade_aulas' => 3,
    ]);
    Frequencia::factory()->create([
        'usuario_id' => $aluno->id,
        'turma_id' => $turma->id_turma,
        'disciplina_id' => $disciplina->id_disciplina,
        'data_aula' => '2026-03-11',
        'status_presenca' => 'Falta',
        'quantidade_aulas' => 1,
    ]);

    Sanctum::actingAs($especialista);

    // Valida blindagem FormRequest (GerarRelatorioFaltasRequest) sem turma_id
    $this->getJson('/api/frequencias/relatorio-faltas')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['turma_id']);

    // Consulta consolidada da turma (3 presenças em 4 aulas = 75.0%)
    $this->getJson("/api/frequencias/relatorio-faltas?turma_id={$turma->id_turma}&disciplina_id={$disciplina->id_disciplina}")
        ->assertOk()
        ->assertJsonPath('turma.id_turma', $turma->id_turma)
        ->assertJsonPath('relatorio.0.aluno_id', $aluno->id)
        ->assertJsonPath('relatorio.0.total_aulas', 4)
        ->assertJsonPath('relatorio.0.presencas', 3)
        ->assertJsonPath('relatorio.0.faltas', 1)
        ->assertJsonPath('relatorio.0.percentual_presenca', 75);

    // Aluno bloqueado no relatório global de faltas, mas autorizado em /minha-frequencia
    Sanctum::actingAs($aluno);

    $this->getJson("/api/frequencias/relatorio-faltas?turma_id={$turma->id_turma}")
        ->assertForbidden();

    $this->getJson('/api/frequencias/minha-frequencia')
        ->assertOk()
        ->assertJsonPath('resumo.total_aulas', 4)
        ->assertJsonPath('resumo.presencas', 3)
        ->assertJsonPath('resumo.faltas', 1)
        ->assertJsonPath('resumo.percentual_presenca', 75)
        ->assertJsonCount(2, 'registros');
});
