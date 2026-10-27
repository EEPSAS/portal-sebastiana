<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para envelope de resposta de autenticação (Login e Register).
 */
class AuthUserResource extends JsonResource
{
    /**
     * @param  mixed  $resource  Model User
     * @param  string|null  $token  Token Sanctum gerado
     * @param  string  $message  Mensagem amigável de sucesso
     */
    public function __construct(
        $resource,
        protected ?string $token = null,
        protected string $message = 'Autenticação realizada com sucesso.',
        protected ?string $approvalStatus = null
    ) {
        parent::__construct($resource);
    }

    /**
     * Transforma a resposta de login/registro em payload padronizado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'message' => $this->message,
            'token' => $this->token,
            'token_type' => 'Bearer',
            'approval_status' => $this->approvalStatus ?? $this->resource->approval_status,
            'user' => new UsuarioResource($this->resource),
        ];
    }
}
