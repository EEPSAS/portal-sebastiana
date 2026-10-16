<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para serialização de um item de Plano de Estudos.
 *
 * Papel Didático:
 * Padroniza a resposta JSON enviada ao frontend para qualquer tipo de material
 * (livros do acervo, videoaulas do YouTube e pesquisas pedagógicas no Google Books).
 */
class PlanoEstudoItemResource extends JsonResource
{
    /**
     * Transforma o recurso em um array para retorno via JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plano_estudo_id' => $this->plano_estudo_id,
            'livro_id' => $this->livro_id,
            'tipo' => $this->tipo,
            'conteudo_id' => $this->conteudo_id,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'url' => $this->url,
            'thumbnail' => $this->thumbnail,
            'fonte' => $this->fonte,
            'duracao' => $this->duracao,
            'created_at' => $this->created_at?->toISOString() ?? $this->created_at,
        ];
    }
}
