<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * NoticiaResource - Blindagem de Saída do Módulo de Notícias
 *
 * Papel Didático:
 * Garante que apenas as chaves contratadas no apiContract.md sejam expostas
 * ao frontend, formatando datas e URLs de forma previsível e segura.
 */
class NoticiaResource extends JsonResource
{
    /**
     * Converte o Model Noticia em um array JSON padronizado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Tratamento seguro de formatação de data ISO
        $dataRef = $this->data_publicacao ?? $this->dataPublicacao ?? $this->created_at;
        $dataIso = null;

        if ($dataRef instanceof \DateTimeInterface) {
            $dataIso = $dataRef->toISOString();
        } elseif (is_string($dataRef) && ! empty($dataRef)) {
            try {
                $dataIso = Carbon::parse($dataRef)->toISOString();
            } catch (\Throwable) {
                $dataIso = (string) $dataRef;
            }
        }

        return [
            'id' => $this->id,
            'categoria' => $this->categoria ?? 'Geral',
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'conteudo' => $this->conteudo,
            'url_foto' => $this->url_foto ?? $this->imagem,
            'url_miniatura' => $this->url_miniatura ?? $this->miniatura ?? $this->url_foto ?? $this->imagem,
            'data_publicacao' => $dataIso,
            'destaque' => (bool) $this->destaque,
            'autor' => $this->whenLoaded('autor', function () {
                return [
                    'id' => $this->autor->id,
                    'name' => $this->autor->name,
                    // Apelido é privado do dono: o público vê sempre o nome institucional
                    'nickname' => $this->autor->name,
                ];
            }),
            'created_at' => $this->created_at instanceof \DateTimeInterface ? $this->created_at->toISOString() : (string) $this->created_at,
            'updated_at' => $this->updated_at instanceof \DateTimeInterface ? $this->updated_at->toISOString() : (string) $this->updated_at,
        ];
    }
}
