<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * DashboardGeralResource
 *
 * Papel Didático:
 * Encapsula e padroniza a entrega dos indicadores analíticos consolidados
 * da instituição/docência consumidos pela página /dashboard/geral.
 * Garante que apenas os campos acordados em apiContract.md sejam expostos.
 */
class DashboardGeralResource extends JsonResource
{
    /**
     * Transforma os dados consolidados do painel em array JSON.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Linha superior com os 4 Small Cards de KPIs
            'kpis' => [
                'total_alunos' => (int) ($this->resource['kpis']['total_alunos'] ?? 0),
                'media_geral' => isset($this->resource['kpis']['media_geral'])
                    ? round((float) $this->resource['kpis']['media_geral'], 1)
                    : 0.0,
                'frequencia_media' => (string) ($this->resource['kpis']['frequencia_media'] ?? '100%'),
                'noticias_publicadas' => (int) ($this->resource['kpis']['noticias_publicadas'] ?? 0),
                'total_turmas' => (int) ($this->resource['kpis']['total_turmas'] ?? 0),
            ],

            // Seção intermediária: Médias de notas e Frequências por turma
            'resumo_turmas' => [
                'medias' => $this->resource['resumo_turmas']['medias'] ?? [],
                'frequencias' => $this->resource['resumo_turmas']['frequencias'] ?? [],
            ],

            // Seção inferior: Feed dinâmico de últimas atualizações escolares
            'ultimas_atualizacoes' => $this->resource['ultimas_atualizacoes'] ?? [],
        ];
    }
}
