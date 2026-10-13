<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação dos dados da Biblioteca pessoal do usuário.
 */
class BibliotecaResource extends JsonResource
{
    /**
     * Transforma os dados da biblioteca em resposta para a UI.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'usuario_id' => $this->user_id,
            'dados' => $this->dados,
        ];
    }
}
