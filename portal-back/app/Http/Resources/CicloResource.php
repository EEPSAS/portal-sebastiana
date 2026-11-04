<?php

namespace App\Http\Resources;

use App\Data\Academico\CicloData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação de Ciclos Escolares (ex: 1º Ano, 2º Ano, 3º Ano),
 * delegando a tipagem estrita ao CicloData (Spatie Laravel Data).
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
        return CicloData::fromModel($this->resource)->toArray();
    }
}
