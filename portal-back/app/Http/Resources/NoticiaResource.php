<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoticiaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoria' => $this->categoria,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'conteudo' => $this->conteudo,
            'url_foto' => $this->imagem,
            'url_miniatura' => $this->miniatura,
            'data_publicacao' => $this->dataPublicacao,
            'destaque' => $this->destaque,
            'autor' => $this->whenLoaded('autor'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
