<?php

use App\Services\HorarioService;

/**
 * Testes unitários das constantes e mapeamentos curriculares do HorarioService.
 */
test('HorarioService mantem carga anual multipla de 40 semanas para todas as disciplinas canonicas', function () {
    $reflexao = new ReflectionClass(HorarioService::class);
    $disciplinasAnuais = $reflexao->getConstant('DISCIPLINAS_ANUAIS');
    $nomesAlternativos = $reflexao->getConstant('NOMES_ALTERNATIVOS');

    expect($disciplinasAnuais)->toBeArray()->not->toBeEmpty();

    $somaTotalAnual = array_sum($disciplinasAnuais);
    // 25 aulas semanais * 40 semanas letivas = 1000 aulas anuais na grade padrão do Ensino Médio
    expect($somaTotalAnual)->toBe(1200);

    foreach ($disciplinasAnuais as $disciplina => $cargaAnual) {
        // Toda carga anual deve ser divisível por 40 para resultar em número inteiro de aulas semanais
        expect($cargaAnual % 40)->toBe(0, "A disciplina {$disciplina} possui carga não divisível por 40.");
    }

    // Todos os aliases alternativos devem apontar para uma chave canônica válida
    foreach ($nomesAlternativos as $alias => $canonico) {
        expect(array_key_exists($canonico, $disciplinasAnuais))
            ->toBeTrue("O alias '{$alias}' aponta para '{$canonico}' inexistente em DISCIPLINAS_ANUAIS.");
    }
});
