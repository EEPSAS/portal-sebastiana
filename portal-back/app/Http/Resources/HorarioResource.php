<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HorarioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ano_letivo' => (int) $this->ano_letivo,
            'status' => $this->status,
            'aulas' => HorarioAulaResource::collection($this->whenLoaded('aulas')),
        ];
    }
}
