<?php

namespace App\Data\Auditoria;

use App\Enums\UserRole;
use App\Models\RegistroAcao;
use Spatie\LaravelData\Data;

/**
 * Data Object tipado para serialização de um Registro de Ação na API.
 * Espelha 1:1 o schema `RegistroAcaoSchema` (Zod) do frontend e o `apiContract.md`.
 */
class RegistroAcaoData extends Data
{
    /**
     * @param  array<string, mixed>|null  $metadados
     */
    public function __construct(
        public int $id_registro_acao,
        public string $entidade_tipo,
        public string $entidade_id,
        public string $acao,
        public string $descricao,
        public ?int $executado_por_id,
        public string $executado_por_nome,
        public string $executado_por_role,
        public string $executado_por_role_label,
        public ?array $metadados,
        public ?string $created_at,
        public string $tempo_atras,
    ) {}

    /**
     * Converte o model `RegistroAcao` em payload tipado com rótulo de cargo e tempo relativo em pt-BR.
     */
    public static function fromModel(RegistroAcao $registro): self
    {
        $roleValue = (string) $registro->executado_por_role;
        $roleLabel = match ($roleValue) {
            UserRole::ESPECIALISTA->value => 'Especialista Pedagógico',
            UserRole::ADM->value => 'Administrador',
            UserRole::PROFESSOR->value => 'Professor',
            UserRole::BIBLIOTECARIA->value => 'Bibliotecária',
            UserRole::ALUNO->value => 'Aluno',
            UserRole::PADRAO->value => 'Usuário Padrão',
            'sistema' => 'Sistema',
            default => ucfirst($roleValue),
        };

        $tempoAtras = $registro->created_at !== null
            ? $registro->created_at->diffForHumans()
            : 'agora';

        return new self(
            id_registro_acao: (int) $registro->id_registro_acao,
            entidade_tipo: (string) $registro->entidade_tipo,
            entidade_id: (string) $registro->entidade_id,
            acao: (string) $registro->acao,
            descricao: (string) $registro->descricao,
            executado_por_id: $registro->executado_por_id !== null ? (int) $registro->executado_por_id : null,
            executado_por_nome: (string) $registro->executado_por_nome,
            executado_por_role: $roleValue,
            executado_por_role_label: $roleLabel,
            metadados: $registro->metadados,
            created_at: $registro->created_at?->toISOString(),
            tempo_atras: $tempoAtras,
        );
    }
}
