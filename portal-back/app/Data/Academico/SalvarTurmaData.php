<?php

namespace App\Data\Academico;

use App\Models\PeriodoLetivo;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Data Object de entrada validada para criação de Turma Escolar via Spatie Laravel Data.
 * Garante tipagem estrita e regras declarativas antes da persistência no Eloquent.
 */
class SalvarTurmaData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public string $nome_identificador,

        #[Nullable, IntegerType, Exists('ciclos', 'id_ciclo')]
        public ?int $ciclo_id = null,

        #[Nullable, IntegerType, Exists('periodos_letivos', 'id_periodo_letivo')]
        public ?int $periodo_letivo_id = null,

        #[Required, StringType, In(['Matutino', 'Vespertino', 'Noturno', 'Integral'])]
        public string $turno = 'Integral',

        #[Required, IntegerType, Min(2000), Max(2100)]
        public int $ano_letivo = 2026,

        #[Nullable, IntegerType, Min(1), Max(100)]
        public ?int $capacidade_maxima = 40,

        #[Nullable, StringType, In(['Ativa', 'Inativa', 'Concluída'])]
        public ?string $status = 'Ativa',
    ) {}

    /**
     * Regras complementares dependentes do estado do banco (vínculo com Período Letivo).
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'ano_letivo' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    // Se houver períodos letivos cadastrados, exige correspondência com um deles
                    if (PeriodoLetivo::count() > 0 && ! PeriodoLetivo::where('ano', $value)->exists()) {
                        $fail('O ano letivo selecionado não corresponde a nenhum Período Letivo cadastrado.');
                    }
                },
            ],
        ];
    }

    /**
     * Mensagens didáticas em português para feedback na interface.
     *
     * @return array<string, string>
     */
    public static function messages(...$args): array
    {
        return [
            'nome_identificador.required' => 'O nome identificador da turma é obrigatório.',
            'ciclo_id.exists' => 'O ciclo escolar selecionado é inválido.',
            'periodo_letivo_id.exists' => 'O período letivo informado é inválido.',
            'turno.required' => 'O turno da turma é obrigatório.',
            'turno.in' => 'O turno deve ser Matutino, Vespertino, Noturno ou Integral.',
            'ano_letivo.required' => 'O ano letivo é obrigatório.',
            'status.in' => 'O status deve ser Ativa, Inativa ou Concluída.',
        ];
    }
}
