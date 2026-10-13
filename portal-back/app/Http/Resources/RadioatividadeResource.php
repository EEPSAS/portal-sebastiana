<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para episódios da Radioatividade (podcast do Terceirão).
 */
class RadioatividadeResource extends JsonResource
{
    /**
     * Transforma os dados do episódio para resposta da API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'audio_url' => $this->audio_url,
            'data_publicacao' => $this->data_publicacao?->format('Y-m-d') ?? $this->data_publicacao,
            'criador' => [
                'id' => $this->criador?->id,
                'name' => $this->criador?->name,
            ],
        ];
    }
}
