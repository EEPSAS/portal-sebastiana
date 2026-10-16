<?php

namespace Database\Factories;

use App\Models\Livro;
use App\Models\PlanoEstudo;
use App\Models\PlanoEstudoItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para geração de Itens de Planos de Estudos (livros, videoaulas e conteúdos web).
 *
 * @extends Factory<PlanoEstudoItem>
 */
class PlanoEstudoItemFactory extends Factory
{
    protected $model = PlanoEstudoItem::class;

    /**
     * Define o estado padrão (videoaula) para o item do plano.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $videoId = fake()->regexify('[A-Za-z0-9_-]{11}');

        return [
            'plano_estudo_id' => PlanoEstudo::factory(),
            'livro_id' => null,
            'tipo' => 'videoaula',
            'conteudo_id' => $videoId,
            'titulo' => fake()->sentence(4),
            'descricao' => fake()->sentence(8),
            'url' => "https://www.youtube.com/watch?v={$videoId}",
            'thumbnail' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg",
            'fonte' => fake()->company(),
            'duracao' => '15:30',
        ];
    }

    /**
     * Estado para item do tipo livro vinculado à tabela livros.
     */
    public function livro(): static
    {
        return $this->state(function () {
            $livro = Livro::factory()->create();

            return [
                'livro_id' => $livro->id_livro,
                'tipo' => 'livro',
                'conteudo_id' => (string) $livro->id_livro,
                'titulo' => $livro->titulo,
                'descricao' => $livro->autor,
                'url' => null,
                'thumbnail' => $livro->capa,
                'fonte' => $livro->editora,
                'duracao' => null,
            ];
        });
    }
}
