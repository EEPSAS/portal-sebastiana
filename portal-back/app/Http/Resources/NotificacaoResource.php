<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificacaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $dados = $this->data;

        return [
            'id' => $this->id,
            'titulo' => $dados['titulo'],
            'assunto' => $dados['assunto'],
            'tipo' => $dados['tipo'],
            'origem' => $dados['origem'],
            'prioridade' => $dados['prioridade'],
            'criador_id' => $dados['criador_id'],
            'criador_nome' => $dados['criador_nome'],
            'destinatario_id' => $dados['destinatario_id'],
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
