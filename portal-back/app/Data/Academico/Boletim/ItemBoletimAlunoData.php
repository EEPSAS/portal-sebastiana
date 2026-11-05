<?php

namespace App\Data\Academico\Boletim;

use Spatie\LaravelData\Data;

/**
 * Representa uma linha disciplinar no Boletim Escolar consolidado do estudante.
 * Espelhado 1:1 com ItemBoletimAlunoSchema (Zod).
 */
class ItemBoletimAlunoData extends Data
{
    public function __construct(
        public int $disciplina_id,
        public string $nome_disciplina,
        public float $nota_obtida,
        public float $valor_maximo,
        public int $somatorio_faltas,
        public int $total_aulas,
        public string $status,
        public int $id,
        public string $materia,
        public float $pontos,
        public string $cor,
    ) {}
}
