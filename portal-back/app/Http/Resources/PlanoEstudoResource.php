<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para padronização e serialização de Planos de Estudos.
 *
 * Papel Didático:
 * Encapsula os dados do plano e agrega contadores reais por tipo de material
 * (livros, videoaulas e conteúdos web), além de incluir a lista de itens quando carregada.
 */
class PlanoEstudoResource extends JsonResource
{
    /**
     * Transforma o plano em um array estruturado para resposta da API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Se a relação itens estiver carregada, calcula em memória para máxima performance
        if ($this->relationLoaded('itens')) {
            $livrosCount = $this->itens->where('tipo', 'livro')->count();
            $videoaulasCount = $this->itens->where('tipo', 'videoaula')->count();
            $conteudosWebCount = $this->itens->where('tipo', 'conteudo_web')->count();
            $totalItens = $this->itens->count();
        } else {
            // Caso contrário, realiza a agregação no banco de dados de forma enxuta
            $livrosCount = (int) ($this->livros_count ?? $this->itens()->where('tipo', 'livro')->count());
            $videoaulasCount = (int) ($this->videoaulas_count ?? $this->itens()->where('tipo', 'videoaula')->count());
            $conteudosWebCount = (int) ($this->conteudos_web_count ?? $this->itens()->where('tipo', 'conteudo_web')->count());
            $totalItens = (int) ($this->total_itens ?? ($livrosCount + $videoaulasCount + $conteudosWebCount));
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nome' => $this->nome,
            'disciplina' => $this->disciplina,
            'descricao' => $this->descricao,
            'ativo' => (bool) $this->ativo,
            // Contadores reais exigidos no requisito da integração
            'livros_count' => $livrosCount,
            'videoaulas_count' => $videoaulasCount,
            'conteudos_web_count' => $conteudosWebCount,
            'total_itens' => $totalItens,
            // Lista detalhada de itens incluída quando solicitada (ex: show)
            'itens' => PlanoEstudoItemResource::collection($this->whenLoaded('itens')),
            'created_at' => $this->created_at?->toISOString() ?? $this->created_at,
            'updated_at' => $this->updated_at?->toISOString() ?? $this->updated_at,
        ];
    }
}
