<?php

namespace App\Data\Academico;

use App\Http\Resources\DisciplinaResource;
use App\Models\Ciclo;
use Spatie\LaravelData\Data;

/**
 * Data Object de saída para Ciclos Escolares, espelhado com CicloSchema (Zod) no frontend.
 */
class CicloData extends Data
{
    /**
     * @param  array<int, mixed>  $disciplinas
     * @param  array<int, array{id_turma: int, nome_identificador: string, turno: string, ano_letivo: int}>  $turmas
     */
    public function __construct(
        public int $id_ciclo,
        public string $nome,
        public ?string $descricao,
        public int $total_disciplinas,
        public int $total_turmas,
        public int $total_aulas_semanais,
        public int $carga_horaria_anual_total,
        public array $disciplinas,
        public array $turmas,
    ) {}

    /**
     * Converte o Model Ciclo (com ou sem eager loading) no contrato tipado da API.
     */
    public static function fromModel(Ciclo $ciclo): self
    {
        $disciplinas = $ciclo->relationLoaded('disciplinas')
            ? DisciplinaResource::collection($ciclo->disciplinas)->resolve()
            : [];

        $turmas = $ciclo->relationLoaded('turmas')
            ? $ciclo->turmas->map(fn ($t) => [
                'id_turma' => (int) $t->id_turma,
                'nome_identificador' => (string) $t->nome_identificador,
                'turno' => (string) ($t->turno ?? 'Integral'),
                'ano_letivo' => (int) $t->ano_letivo,
            ])->values()->all()
            : [];

        $somaAulasSemanais = $ciclo->relationLoaded('disciplinas')
            ? (int) $ciclo->disciplinas->sum(
                fn ($d) => $d->aulas_semanais ?: intdiv(max(40, (int) $d->carga_horaria_anual), 40)
            )
            : 0;

        return new self(
            id_ciclo: (int) $ciclo->id_ciclo,
            nome: (string) $ciclo->nome,
            descricao: $ciclo->descricao !== null ? (string) $ciclo->descricao : null,
            total_disciplinas: $ciclo->relationLoaded('disciplinas')
                ? $ciclo->disciplinas->count()
                : (int) ($ciclo->disciplinas_count ?? 0),
            total_turmas: $ciclo->relationLoaded('turmas')
                ? $ciclo->turmas->count()
                : (int) ($ciclo->turmas_count ?? 0),
            total_aulas_semanais: $somaAulasSemanais,
            carga_horaria_anual_total: $somaAulasSemanais * 40,
            disciplinas: $disciplinas,
            turmas: $turmas,
        );
    }
}
