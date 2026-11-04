<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Representa um caso de homônimo ou similaridade de aluno detectado durante a leitura do CSV.
 */
class AmbiguidadeAlunoCsvData extends Data
{
    /**
     * @param  array<int, array{id: int, name: string, email: string, ja_matriculado: bool}>  $candidatos
     */
    public function __construct(
        public string $nome_csv,
        public array $candidatos,
    ) {}
}
