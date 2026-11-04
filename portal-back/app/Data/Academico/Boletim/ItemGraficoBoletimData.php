<?php

namespace App\Data\Academico\Boletim;

use Spatie\LaravelData\Data;

/**
 * Representa a fatia gráfica de uma matéria no resumo visual do Boletim do Aluno.
 */
class ItemGraficoBoletimData extends Data
{
    public function __construct(
        public int $id,
        public string $materia,
        public float $pontos,
        public string $cor,
    ) {}
}
