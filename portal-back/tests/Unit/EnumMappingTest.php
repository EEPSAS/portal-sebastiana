<?php

use App\Enums\EmprestimoStatus;
use App\Enums\TipoEvento;
use App\Enums\UserRole;

/**
 * Testes unitários puros dos Enums de domínio do Portal Sebastiana.
 * Verifica rótulos legíveis, níveis hierárquicos e resolução flexível de strings.
 */
test('UserRole mapeia rotulos e niveis hierarquicos corretamente', function () {
    expect(UserRole::ALUNO->label())->toBe('Aluno')
        ->and(UserRole::PROFESSOR->label())->toBe('Professor')
        ->and(UserRole::BIBLIOTECARIA->label())->toBe('Bibliotecária')
        ->and(UserRole::PADRAO->label())->toBe('Usuário Padrão')
        ->and(UserRole::ESPECIALISTA->label())->toBe('Especialista')
        ->and(UserRole::ADM->label())->toBe('Administrador')
        ->and(UserRole::ALUNO->nivel())->toBe(1)
        ->and(UserRole::PROFESSOR->nivel())->toBe(1)
        ->and(UserRole::BIBLIOTECARIA->nivel())->toBe(1)
        ->and(UserRole::ESPECIALISTA->nivel())->toBe(2)
        ->and(UserRole::ADM->nivel())->toBe(3);
});

test('EmprestimoStatus retorna rotulos amigaveis para todos os estados do ciclo de vida', function () {
    expect(EmprestimoStatus::SOLICITADO->label())->toBe('Solicitado')
        ->and(EmprestimoStatus::APROVADO->label())->toBe('Aprovado')
        ->and(EmprestimoStatus::DEVOLVIDO->label())->toBe('Devolvido')
        ->and(EmprestimoStatus::RENOVADO->label())->toBe('Renovado')
        ->and(EmprestimoStatus::RECUSADO->label())->toBe('Recusado')
        ->and(EmprestimoStatus::ATRASADO->label())->toBe('Atrasado');
});

test('TipoEvento resolve slugs, variacoes sem acento e valores legados via tryFromLoose', function (string $entrada, TipoEvento $esperado, bool $restrito) {
    $resolvido = TipoEvento::tryFromLoose($entrada);

    expect($resolvido)->toBe($esperado)
        ->and($resolvido?->isRestrito())->toBe($restrito);
})->with([
    'evento canônico' => ['Eventos', TipoEvento::EVENTOS, false],
    'alias reunião' => ['reunião', TipoEvento::EVENTOS, false],
    'legado data comemorativa' => ['datas comemorativas', TipoEvento::EVENTOS, false],
    'provas sem acento' => ['avaliacao', TipoEvento::PROVAS_E_TRABALHOS, true],
    'sabado letivo sem acento' => ['sabado letivo', TipoEvento::SABADO_LETIVO, true],
    'feriado simples' => ['feriado', TipoEvento::FERIADOS_E_RECESSOS, true],
]);

test('TipoEvento retorna null para entradas vazias ou desconhecidas', function () {
    expect(TipoEvento::tryFromLoose(null))->toBeNull()
        ->and(TipoEvento::tryFromLoose(''))->toBeNull()
        ->and(TipoEvento::tryFromLoose('tipo_inexistente_xyz'))->toBeNull()
        ->and(TipoEvento::values())->toHaveCount(4);
});
