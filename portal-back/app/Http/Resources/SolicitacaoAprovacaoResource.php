<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Expõe só os dados escolares necessários para a análise do pedido. */
class SolicitacaoAprovacaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'approval_status' => $this->approval_status,
            'created_at' => $this->created_at,
        ];
    }
}
