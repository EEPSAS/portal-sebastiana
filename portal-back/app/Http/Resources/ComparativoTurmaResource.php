<?php

namespace App\Http\Resources;

use App\Data\Academico\Boletim\ComparativoTurmaData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ComparativoTurmaResource
 *
 * Papel Didático:
 * Padroniza e blinda o retorno comparativo entre o desempenho individual do aluno e a média da turma
 * no endpoint GET /api/alunos/{aluno_id}/turmas/{turma_id}/comparativo-turma via ComparativoTurmaData (Spatie Data).
 */
class ComparativoTurmaResource extends JsonResource
{
    /**
     * Transforma os dados comparativos do aluno vs turma em array JSON tipado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dados = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return ComparativoTurmaData::fromServiceArray($dados)->toArray();
    }
}
