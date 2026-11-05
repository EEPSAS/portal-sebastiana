<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Data;

/**
 * Representação enxuta e tipada do componente curricular vinculado à nota.
 */
class DisciplinaNotaResumoData extends Data
{
    public function __construct(
        public int $id_disciplina,
        public string $nome,
    ) {}
}
