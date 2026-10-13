<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para padronização e controle dos dados de Empréstimo de Livros.
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
            'id' => $this->id_emprestimo ?? $this->id,
            'id_emprestimo' => $this->id_emprestimo ?? $this->id,
            // Livro associado à retirada
            'livro' => [
                'id' => $this->livro?->id_livro ?? $this->livro?->id,
                'id_livro' => $this->livro?->id_livro ?? $this->livro?->id,
                'titulo' => $this->livro?->titulo,
                'autor' => $this->livro?->autor,
                'capa_url' => $this->livro?->capa ?? $this->livro?->capa_url,
            ],
            // Usuário que solicitou o exemplar
            'usuario' => [
                'id' => $this->usuario?->id,
                'name' => $this->usuario?->name,
                'email' => $this->usuario?->email,
            ],
            // Prazos e controle temporal
            'data_emprestimo' => $this->data_emprestimo?->format('Y-m-d') ?? $this->data_emprestimo,
            'data_prevista_devolucao' => $this->data_prevista_devolucao?->format('Y-m-d') ?? $this->data_prevista_devolucao,
            'data_devolucao_real' => $this->data_devolucao_real?->format('Y-m-d') ?? $this->data_devolucao_real,
            // Estado atual do ciclo do livro (Pendente, Aprovado, Devolvido, Em Atraso)
            'status' => $this->status,
        ];
    }
}
