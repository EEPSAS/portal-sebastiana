<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Data;

/**
 * Sub-estrutura tipada para a distribuição percentual de rendimento da turma.
 */
class DistribuicaoDesempenhoData extends Data
{
    public function __construct(
        public float $acima,
        public float $na_media,
        public float $abaixo,
    ) {}
}
