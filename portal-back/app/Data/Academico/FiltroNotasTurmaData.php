<?php

namespace App\Data\Academico;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Data Object que valida os filtros cumulativos de consulta ao Diário Escolar (GET /api/turmas/{turma}/notas).
 */
class FiltroNotasTurmaData extends Data
{
    public function __construct(
        #[Nullable, StringType, Max(80)]
        public ?string $periodo_letivo = null,

        #[Nullable, IntegerType, Min(1)]
        public ?int $disciplina_id = null,

        #[Nullable, IntegerType, Min(1)]
        public ?int $aluno_id = null,

        #[Nullable, IntegerType, Min(1)]
        public ?int $usuario_id = null,
    ) {}

    /**
     * Unifica o identificador do estudante caso tenha sido enviado como aluno_id ou usuario_id.
     */
    public function obterIdEstudante(): ?int
    {
        return $this->aluno_id ?? $this->usuario_id;
    }
}
