<?php

namespace App\Http\Resources;

use App\Data\Academico\NotaDiarioData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource responsável por padronizar o retorno dos lançamentos de notas via NotaDiarioData (Spatie Data).
 */
class NotaResource extends JsonResource
{
    /**
     * Transforma os dados da nota em um array estritamente tipado para o frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return NotaDiarioData::fromModel($this->resource)->toArray();
    }
}
