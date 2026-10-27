<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para entrega segura da resposta da assistente virtual Dona Nana.
 *
 * Papel Didático:
 * Padroniza o envelope JSON entregue ao frontend, garantindo que o texto gerado,
 * as sugestões de atalhos e os metadados da resposta sigam estritamente o contrato da API.
 */
class DonaNanaChatResource extends JsonResource
{
    /**
     * Transforma a resposta do diálogo para consumo no frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'resposta' => $this->resource['resposta'] ?? '',
            'sugestoes' => $this->resource['sugestoes'] ?? [],
            'autor' => 'Professora Sebastiana (Dona Nana)',
            'origem' => $this->resource['origem'] ?? 'gemini-3.8-flash',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
