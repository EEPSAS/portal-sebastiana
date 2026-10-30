<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serialização completa do Período Letivo
 */
class PeriodoLetivoResource extends JsonResource
{
    /**
     * Transforma o recurso em array JSON padronizado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tipoLabel = match ($this->tipo_divisao) {
            'bimestre' => 'Bimestral (4 divisões)',
            'trimestre' => 'Trimestral (3 divisões)',
            'semestre' => 'Semestral (2 divisões)',
            default => ucfirst((string) $this->tipo_divisao),
        };

        $divisaoAtual = $this->relationLoaded('divisoes')
            ? $this->obterDivisaoAtual()
            : null;

        return [
            'id_periodo_letivo' => $this->id_periodo_letivo,
            'ano' => (int) $this->ano,
            'tipo_divisao' => $this->tipo_divisao,
            'tipo_divisao_label' => $tipoLabel,
            'total_pontos' => (float) $this->total_pontos,
            'data_inicio' => $this->data_inicio ? $this->data_inicio->format('Y-m-d') : null,
            'data_fim' => $this->data_fim ? $this->data_fim->format('Y-m-d') : null,
            'ativo' => (bool) $this->ativo,
            'status' => $this->status,
            'total_turmas' => $this->relationLoaded('turmas')
                ? $this->turmas->count()
                : ($this->turmas_count ?? 0),
            'divisao_atual' => $divisaoAtual ? [
                'id_divisao' => $divisaoAtual->id_divisao,
                'numero' => (int) $divisaoAtual->numero,
                'nome' => $divisaoAtual->nome,
                'pontos' => (float) $divisaoAtual->pontos,
                'data_inicio' => $divisaoAtual->data_inicio ? $divisaoAtual->data_inicio->format('Y-m-d') : null,
                'data_fim' => $divisaoAtual->data_fim ? $divisaoAtual->data_fim->format('Y-m-d') : null,
            ] : null,
            'divisoes' => $this->relationLoaded('divisoes')
                ? PeriodoLetivoDivisaoResource::collection($this->divisoes)
                : [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
