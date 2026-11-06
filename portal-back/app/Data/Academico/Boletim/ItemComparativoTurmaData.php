<?php

namespace App\Data\Academico\Boletim;

use Spatie\LaravelData\Data;

/**
 * Representa uma disciplina pareada no comparativo individual do aluno vs média da turma.
 */
class ItemComparativoTurmaData extends Data
{
    public function __construct(
        public int $disciplina_id,
        public string $nome_disciplina,
        public float $nota_aluno,
        public int $faltas_aluno,
        public ?float $frequencia_aluno,
        public float $media_turma,
        public float $media_faltas_turma,
        public ?float $frequencia_turma,
        public float $valor_maximo,
    ) {}
}
