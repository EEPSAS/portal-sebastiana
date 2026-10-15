<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para padronização de Eventos e Datas do Calendário Escolar.
 */
class EventoResource extends JsonResource
{
    /**
     * Transforma o evento em dados consistentes para o calendário/agenda.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Identificador do evento
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            // Datas e horários
            'data_inicio' => $this->data_inicio?->format('Y-m-d') ?? $this->data_inicio,
            'data_fim' => $this->data_fim?->format('Y-m-d') ?? $this->data_fim,
            'hora_inicio' => $this->hora_inicio,
            'hora_fim' => $this->hora_fim,
            'dia_inteiro' => (bool) $this->dia_inteiro,
            // Categoria e sinalizadores visuais
            'tipo' => $this->tipo,
            'importante' => (bool) $this->importante,
            'is_aniversario' => (bool) $this->is_aniversario,
            'local' => $this->local,
            'cor' => $this->cor,
            // Autor do cadastro
            'criador' => [
                'id' => $this->criador?->id,
                'name' => $this->criador?->name,
            ],
        ];
    }
}
