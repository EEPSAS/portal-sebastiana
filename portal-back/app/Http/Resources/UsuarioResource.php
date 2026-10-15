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
            // Identificador e dados cadastrais
            'id' => $this->id,
            'name' => $this->name,
            'nickname' => $this->nickname,
            'email' => $this->email,
            'telefone' => $this->telefone,
            // URL resolvida pública do avatar ou URL do Google OAuth
            'avatar' => $this->avatar_url ?? $this->avatar,
            'data_nascimento' => $this->data_nascimento?->format('Y-m-d'),
            'google_vinculado' => ! empty($this->google_id),
            'tem_senha' => ! empty($this->password),
            // Controle de papel, turma vinculada e permissões
            'role' => $roleValue,
            'role_label' => $roleLabel,
            // Nome da turma ativa do aluno (ou null caso não seja aluno ou não possua turma ativa)
            'turma' => $this->turma_ativa?->nome_identificador,
            'ativo' => (bool) $this->ativo,
            'permissoes' => method_exists($this->resource, 'getPermissionsSlugs')
                ? $this->getPermissionsSlugs()
                : [],
        ];
    }
}
