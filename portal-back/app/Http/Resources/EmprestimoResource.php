<?php

namespace App\Http\Resources;

use App\Models\Emprestimo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para padronização e controle dos dados de Empréstimo de Livros.
 *
 * @mixin Emprestimo
 */
class EmprestimoResource extends JsonResource
{
    /**
     * Transforma o registro de empréstimo em resposta formatada para a UI.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Identificador do empréstimo
            'id' => $this->id_emprestimo,
            'id_emprestimo' => $this->id_emprestimo,
            // Livro associado à retirada
            'livro' => [
                'id' => $this->livro?->id_livro,
                'id_livro' => $this->livro?->id_livro,
                'titulo' => $this->livro?->titulo,
                'autor' => $this->livro?->autor,
                'capa_url' => $this->livro?->capa,
            ],
            // Usuário que solicitou o exemplar (BackedEnum serializa nativamente para string no JSON)
            'usuario' => [
                'id' => $this->usuario?->id,
                'name' => $this->usuario?->name,
                'email' => $this->usuario?->email,
                'role' => $this->usuario?->role,
            ],
            // Prazos e controle temporal
            'data_emprestimo' => $this->data_emprestimo?->format('Y-m-d'),
            'data_prevista_devolucao' => $this->data_prevista_devolucao?->format('Y-m-d'),
            'data_devolucao_real' => $this->data_devolucao_real?->format('Y-m-d'),
            // Estado atual do ciclo do livro (Solicitado, Entregue, Renovado, Devolvido, Atrasado, Recusado)
            'status' => $this->status,
        ];
    }
}
