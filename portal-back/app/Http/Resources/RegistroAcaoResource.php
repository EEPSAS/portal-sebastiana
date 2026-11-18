<?php

namespace App\Http\Resources;

use App\Data\Auditoria\RegistroAcaoData;
use App\Models\RegistroAcao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serialização padronizada e blindada de registros de ação.
 *
 * @mixin RegistroAcao
 */
class RegistroAcaoResource extends JsonResource
{
    /**
     * Transforma o model `RegistroAcao` no contrato oficial via `RegistroAcaoData`.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return RegistroAcaoData::fromModel($this->resource)->toArray();
    }
}
