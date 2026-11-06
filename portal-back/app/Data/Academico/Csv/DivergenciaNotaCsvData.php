<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Representa uma divergência entre a nota já registrada no banco e a nova nota vinda do CSV.
 */
class DivergenciaNotaCsvData extends Data
{
    public function __construct(
        public int $usuario_id,
        public string $nome_aluno,
        public int $disciplina_id,
        public string $nome_disciplina,
        public string $periodo_letivo,
        public float $nota_atual,
        public float $nova_nota,
    ) {}
}
