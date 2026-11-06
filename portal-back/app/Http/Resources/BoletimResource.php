<?php

namespace App\Http\Resources;

use App\Data\Academico\Boletim\BoletimAlunoData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para formatação do Boletim Escolar consolidado do Aluno.
 * Delega a serialização tipada ao BoletimAlunoData (Spatie Laravel Data), espelhado com BoletimAlunoSchema (Zod).
 */
class BoletimResource extends JsonResource
{
    /**
     * Transforma os dados consolidados do boletim para o frontend.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dados = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return BoletimAlunoData::fromServiceArray($dados)->toArray();
    }
}
