<?php

namespace App\Http\Resources;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação e blindagem dos dados de Usuário.
 */
class UsuarioResource extends JsonResource
{
    /**
     * Transforma o model User em formato seguro para a API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Obtém o valor em string e o label amigável do papel
        $roleValue = $this->role instanceof UserRole ? $this->role->value : (string) $this->role;
        $roleLabel = $this->role instanceof UserRole ? $this->role->label() : ucfirst($roleValue);

        return [
            // Identificador do usuário
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // Controle de papel e permissões
            'role' => $roleValue,
            'role_label' => $roleLabel,
            'ativo' => (bool) $this->ativo,
            'permissoes' => method_exists($this->resource, 'getPermissionsSlugs')
                ? $this->getPermissionsSlugs()
                : [],
        ];
    }
}
