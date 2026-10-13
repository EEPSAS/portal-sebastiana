<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para resposta do processamento do CSV pelo Especialista.
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
     * Transforma os dados em resposta estruturada.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'message' => $this->message,
            'turma' => [
                'id_turma' => $this->resource['turma']['id_turma'] ?? null,
                'nome_identificador' => $this->resource['turma']['nome_identificador'] ?? null,
            ],
            'dados' => $this->resource['dados'] ?? [],
        ];
    }
}
