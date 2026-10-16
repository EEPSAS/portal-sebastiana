<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para padronização e encapsulamento dos dados de Livro do acervo escolar.
 *
 * @property int $id
 * @property string $titulo
 * @property string $autor
 * @property string|null $isbn
 * @property int|null $ano_publicacao
 * @property string|null $genero
 * @property int $quantidade_total
 * @property int $quantidade_disponivel
 * @property string|null $localizacao
 * @property string|null $capa_url
 */
class LivroResource extends JsonResource
{
    /**
     * Transforma o model Livro em um array estruturado para resposta da API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Sincroniza data_lancamento e data_publicacao para manter paridade no contrato
        $dataLancamento = $this->data_lancamento?->format('Y-m-d')
            ?? $this->data_publicacao?->format('Y-m-d')
            ?? $this->data_lancamento
            ?? $this->data_publicacao;

        return [
            // Identificador primário do livro (id e id_livro para compatibilidade)
            'id' => $this->id_livro ?? $this->id,
            'id_livro' => $this->id_livro ?? $this->id,
            'codigo_livro' => $this->codigo_livro,
            // Informações bibliográficas definitivas do catálogo
            'titulo' => $this->titulo,
            'autor' => $this->autor,
            'editora' => $this->editora,
            'isbn' => $this->isbn ?? $this->codigo_livro,
            'data_lancamento' => $dataLancamento,
            'data_publicacao' => $dataLancamento,
            'ano_publicacao' => $this->ano_publicacao ?? ($dataLancamento ? (int) substr((string) $dataLancamento, 0, 4) : null),
            'genero' => $this->genero,
            'prateleira_localizacao' => $this->prateleira_localizacao,
            'localizacao' => $this->prateleira_localizacao ?? $this->localizacao,
            'capa' => $this->capa,
            'capa_url' => $this->capa ?? $this->capa_url,
            // Controle de estoque físico e empréstimos
            'quantidade_total' => (int) $this->quantidade_total,
            'quantidade_disponivel' => (int) $this->quantidade_disponivel,
            'disponivel' => (int) $this->quantidade_disponivel > 0,
        ];
    }
}
