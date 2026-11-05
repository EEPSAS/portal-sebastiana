<?php

namespace App\Http\Resources;

use App\Data\Academico\TurmaResumoData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource que encapsula os indicadores analíticos agregados de uma turma escolar.
 * Utiliza TurmaResumoData (Spatie Laravel Data) para garantir contrato estrito com Zod no frontend.
 */
class TurmaResumoResource extends JsonResource
{
    /**
     * Transforma os indicadores da turma para consumo no frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dados = is_array($this->resource) ? $this->resource : $this->resource->toArray();

        return TurmaResumoData::fromResumoArray($dados)->toArray();
    }
}
