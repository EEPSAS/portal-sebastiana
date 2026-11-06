<?php

namespace App\Http\Resources;

use App\Data\Academico\TurmaData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação e consulta de Turmas Escolares.
 * Delega a serialização tipada ao TurmaData (Spatie Laravel Data) para paridade 1:1 de contrato.
 */
class TurmaResource extends JsonResource
{
    /**
     * Transforma os dados da turma para consumo validado no frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return TurmaData::fromModel($this->resource)->toArray();
    }
}
