<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Representa uma coluna de disciplina do CSV que aguarda conciliação manual pelo Especialista.
 * Usa as chaves canônicas sugestao_disciplina_id e sugestao_disciplina_nome.
 */
class DisciplinaPendenteCsvData extends Data
{
    public function __construct(
        public string $nome_csv,
        public ?int $sugestao_disciplina_id = null,
        public ?string $sugestao_disciplina_nome = null,
    ) {}
}
