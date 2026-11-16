<?php

use App\Http\Controllers\Controller;

/**
 * Testes de Arquitetura (Pest Arch) para garantir padrões estruturais do backend:
 * - Todos os Controllers devem herdar da classe base Controller;
 * - Todos os arquivos em App\Enums devem ser Enums nativos do PHP;
 * - Nenhuma instrução de debug (dd, dump, ray) deve permanecer no código;
 * - Nenhum código ativo em App\ deve depender de Models arquivados fora de escopo.
 */
arch('controllers estendem a classe base Controller')
    ->expect('App\Http\Controllers')
    ->toExtend(Controller::class)
    ->ignoring(Controller::class);

arch('namespace App\Enums contem exclusivamente enums')
    ->expect('App\Enums')
    ->toBeEnums();

arch('codigo de producao nao utiliza funcoes de debug esquecidas')
    ->expect(['dd', 'dump', 'ray', 'var_dump'])
    ->not->toBeUsedIn('App');

arch('codigo ativo nao referencia models arquivados fora de escopo')
    ->expect([
        'App\Models\Atividade',
        'App\Models\Submissao',
        'App\Models\RemessaDocente',
        'App\Models\Radioatividade',
    ])
    ->not->toBeUsedIn('App');
