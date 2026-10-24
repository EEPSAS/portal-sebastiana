<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para entrega das configurações e da persona da Dona Nana para gestão.
 *
 * Papel Didático:
 * Expõe de forma limpa e estruturada os 4 campos do System Prompt, o avatar
 * e uma prévia montada do prompt final para conferência pedagógica do Especialista/Admin.
 */
class DonaNanaConfigResource extends JsonResource
{
    /**
     * Transforma a configuração da Dona Nana para o frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'personalidade' => $this->personalidade,
            'conhecimento_portal' => $this->conhecimento_portal,
            'historias_causos' => $this->historias_causos,
            'diretrizes_resposta' => $this->diretrizes_resposta,
            'avatar_url' => $this->avatar_url ?: '/img/escola-professora.jpeg',
            'modelo' => $this->modelo,
            'temperatura' => (float) $this->temperatura,
            'ativo' => (bool) $this->ativo,
            'prompt_montado' => $this->montarPromptCompleto(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
