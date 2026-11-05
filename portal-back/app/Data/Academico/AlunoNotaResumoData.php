<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Data;

/**
 * Representação enxuta e tipada do estudante vinculado à nota.
 */
class AlunoNotaResumoData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
    ) {}
}
