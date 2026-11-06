<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Data Object de entrada validada para criação/edição de Ciclo Escolar.
 */
class SalvarCicloData extends Data
{
    public function __construct(
        #[Required, StringType, Max(100)]
        public string $nome,

        #[Nullable, StringType, Max(256)]
        public ?string $descricao = null,
    ) {}
}
