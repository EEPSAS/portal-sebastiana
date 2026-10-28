<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação de Disciplinas da grade curricular (incluindo Ciclos,
 * aulas semanais, carga anual de 40 semanas e campos pedagógicos).
 */
class DisciplinaResource extends JsonResource
{
    /**
     * Transforma a disciplina em array para resposta da API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $aulasSemanais = (int) ($this->aulas_semanais ?: intdiv(max(40, (int) $this->carga_horaria_anual), 40));
        $cargaAnual = (int) ($this->carga_horaria_anual ?: ($aulasSemanais * 40));

        return [
            // Identificador e dados obrigatórios da disciplina (Item 3.3)
            'id_disciplina' => $this->id_disciplina,
            'nome' => $this->nome,
            'nome_disciplina' => $this->nome,
            'codigo' => $this->codigo ?? null,
            'aulas_semanais' => $aulasSemanais,
            'carga_horaria_anual' => $cargaAnual,
            // Campos pedagógicos opcionais (Item 3.3)
            'descricao' => $this->descricao,
            'ementa' => $this->ementa,
            'habilidades_bncc' => $this->habilidades_bncc,
            'objetivo_geral' => $this->objetivo_geral,
            'objetivo_especifico' => $this->objetivo_especifico,
            // Ciclos aos quais a disciplina pertence (Item 3.1 e 3.2)
            'ciclos' => $this->whenLoaded('ciclos', fn () => $this->ciclos->map(fn ($c) => [
                'id_ciclo' => $c->id_ciclo,
                'nome' => $c->nome,
            ])->values()),
            // Professores vinculados à disciplina (Item 3.2a e 3.4a)
            'professores' => $this->whenLoaded('professores', fn () => $this->professores->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'email' => $p->email,
            ])->values()),
        ];
    }
}
