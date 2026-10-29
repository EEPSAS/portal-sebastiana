<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação de Ciclos Escolares (ex: 1º Ano, 2º Ano, 3º Ano)
 * e suas respectivas disciplinas e turmas vinculadas.
 */
class CicloResource extends JsonResource
{
    /**
     * Transforma o Ciclo em array padronizado para a API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $disciplinas = $this->relationLoaded('disciplinas')
            ? DisciplinaResource::collection($this->disciplinas)
            : [];

        $turmas = $this->relationLoaded('turmas')
            ? $this->turmas->map(fn ($t) => [
                'id_turma' => $t->id_turma,
                'nome_identificador' => $t->nome_identificador,
                'turno' => $t->turno,
                'ano_letivo' => (int) $t->ano_letivo,
            ])->values()
            : [];

        $somaAulasSemanais = $this->relationLoaded('disciplinas')
            ? (int) $this->disciplinas->sum(fn ($d) => $d->aulas_semanais ?: intdiv(max(40, (int) $d->carga_horaria_anual), 40))
            : 0;

        return [
            'id_ciclo' => $this->id_ciclo,
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'total_disciplinas' => $this->relationLoaded('disciplinas')
                ? $this->disciplinas->count()
                : ($this->disciplinas_count ?? 0),
            'total_turmas' => $this->relationLoaded('turmas')
                ? $this->turmas->count()
                : ($this->turmas_count ?? 0),
            'total_aulas_semanais' => $somaAulasSemanais,
            'carga_horaria_anual_total' => $somaAulasSemanais * 40,
            'disciplinas' => $disciplinas,
            'turmas' => $turmas,
        ];
    }
}
