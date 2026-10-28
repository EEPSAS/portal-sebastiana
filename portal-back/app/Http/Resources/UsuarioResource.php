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
    // Quando true, o apelido é entregue mesmo sem usuário autenticado na requisição (login/cadastro)
    protected bool $exibirApelido = false;

    /**
     * Libera o apelido na resposta. Use apenas quando o recurso representa o próprio usuário logado.
     */
    public function comApelido(): static
    {
        $this->exibirApelido = true;

        return $this;
    }

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
        $isAdmSolicitante = (bool) $request->user()?->isAdm();

        return [
            // Identificador e dados cadastrais
            'id' => $this->id,
            'name' => $this->name,
            // Apelido privado: só o próprio usuário (ou a resposta de login dele) o recebe
            'nickname' => ($this->exibirApelido || (int) $request->user()?->id === (int) $this->id)
                ? $this->nickname
                : null,
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
            // Nome e identificador numérico da turma ativa do aluno (ou null caso não seja aluno ou não possua turma ativa)
            'turma' => $this->turma_ativa?->nome_identificador,
            'turma_id' => $this->turma_ativa?->id_turma,
            'ativo' => (bool) $this->ativo,
            'status_confirmacao' => $this->status_confirmacao ?? 'confirmado',
            'confirmado_em' => $this->confirmado_em?->toISOString(),
            // Metadados de vínculo e auditoria administrativa (Itens 1.3.4 a 1.3.8)
            'autorizado_por_id' => $this->autorizado_por_id,
            'autorizado_por_nome' => $this->relationLoaded('autorizadoPor')
                ? ($this->autorizadoPor?->name ?? 'Sistema / Automático')
                : null,
            'data_vinculo' => ($this->confirmado_em ?? $this->created_at)?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'comentario_admin' => $isAdmSolicitante ? $this->comentario_admin : null,
            'vinculos' => $this->whenLoaded('vinculos', fn () => $this->vinculos->map(fn ($v) => [
                'id_vinculo' => $v->id_vinculo,
                'role_no_vinculo' => $v->role_no_vinculo,
                'autorizado_por_id' => $v->autorizado_por_id,
                'autorizado_por_nome' => $v->relationLoaded('autorizadoPor') ? $v->autorizadoPor?->name : null,
                'iniciado_em' => $v->iniciado_em?->toISOString(),
                'encerrado_em' => $v->encerrado_em?->toISOString(),
                'observacoes' => $v->observacoes,
            ])->values()),
            'permissoes' => method_exists($this->resource, 'getPermissionsSlugs')
                ? $this->getPermissionsSlugs()
                : [],
        ];
    }
}
