<?php

namespace App\Http\Resources;

use App\Data\Academico\Csv\RelatorioImportadoData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para resposta do processamento do CSV pelo Especialista.
 * Delega a tipagem e validação estrutural do envelope ao RelatorioImportadoData (Spatie Laravel Data).
 */
class RelatorioImportadoResource extends JsonResource
{
    /**
     * @param  mixed  $resource  Dados do resultado do processamento
     * @param  string  $message  Mensagem informativa do resultado
     */
    public function __construct(
        $resource,
        protected string $message = 'Relatório da turma importado e sincronizado com sucesso.'
    ) {
        parent::__construct($resource);
    }

    /**
     * Transforma os dados em resposta estruturada 1:1 com RelatorioImportadoSchema (Zod).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return RelatorioImportadoData::fromResultado($payload, $this->message)->toArray();
    }
}
