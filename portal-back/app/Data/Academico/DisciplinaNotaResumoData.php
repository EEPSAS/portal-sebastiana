<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Data;

/**
 * Representação enxuta e tipada do componente curricular vinculado à nota e à carga horária de frequência.
 */
class DisciplinaNotaResumoData extends Data
{
    public function __construct(
        public int $id_disciplina,
        public string $nome,
        public ?int $carga_horaria_anual = null,
        public ?int $aulas_semanais = null,
    ) {}
}
