<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Data Object que valida individualmente cada célula/registro acadêmico (nota ou falta)
 * extraído da planilha CSV antes de entrar no lote transacional de persistência.
 */
class RegistroNotaCsvData extends Data
{
    public function __construct(
        #[Required, IntegerType, Min(1)]
        public int $usuario_id,

        #[Required, StringType, Max(255)]
        public string $nome_aluno,

        #[Required, IntegerType, Min(1)]
        public int $disciplina_id,

        #[Required, StringType, Max(255)]
        public string $nome_disciplina,

        #[Required, StringType, Max(100)]
        public string $periodo_letivo,

        #[Required, StringType, In(['nota', 'falta'])]
        public string $tipo_registro,

        #[Nullable, StringType, Max(80)]
        public ?string $tipo_avaliacao = 'Diário Consolidado',

        // Escala oficial da rede estadual vai de 0 até 100 pontos no consolidado/recuperação
        #[Nullable, Numeric, Min(0), Max(100)]
        public ?float $valor_nota = null,

        // Limite seguro de faltas acumuladas por componente curricular no ano letivo
        #[Nullable, IntegerType, Min(0), Max(400)]
        public ?int $quantidade_faltas = null,
    ) {}
}
