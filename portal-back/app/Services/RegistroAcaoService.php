<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\RegistroAcao;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Serviço central responsável por persistir a trilha de ações nas entidades do sistema.
 *
 * Papel Didático:
 * Garante formato consistente, captura o snapshot imutável de nome/papel do executor
 * e permite propagar uma ação composta para múltiplas entidades afetadas em uma única chamada.
 */
class RegistroAcaoService
{
    /**
     * Grava um registro de ação para uma entidade persistida no banco.
     *
     * @param  array<string, mixed>  $metadados
     */
    public function registrar(
        Model $entidade,
        string $acao,
        string $descricao,
        ?User $executor = null,
        array $metadados = []
    ): ?RegistroAcao {
        $chave = $entidade->getKey();
        if (! $entidade->exists || $chave === null || $chave === '') {
            return null;
        }

        // Caso o chamador não passe o executor explicitamente, resolve o usuário autenticado da requisição atual
        if ($executor === null) {
            $usuarioReq = request()->user();
            $executor = $usuarioReq instanceof User ? $usuarioReq : null;
        }

        $rawRole = $executor?->getAttribute('role');
        $roleExecutor = $rawRole instanceof UserRole
            ? $rawRole->value
            : (is_string($rawRole) && $rawRole !== '' ? $rawRole : 'sistema');

        // Limita a descrição para caber com segurança na coluna VARCHAR(255)
        $descricaoSegura = mb_strimwidth(trim($descricao), 0, 255, '...');

        return RegistroAcao::create([
            'entidade_tipo' => $entidade::class,
            'entidade_id' => (string) $chave,
            'acao' => $acao,
            'descricao' => $descricaoSegura,
            'executado_por_id' => $executor?->id,
            'executado_por_nome' => $executor !== null ? $executor->name : 'Sistema',
            'executado_por_role' => $roleExecutor,
            'metadados' => empty($metadados) ? null : $metadados,
        ]);
    }

    /**
     * Propaga o mesmo registro de ação para todas as entidades válidas afetadas por uma operação composta.
     *
     * @param  array<int, Model|null>  $entidades
     * @param  array<string, mixed>  $metadados
     */
    public function registrarPropagado(
        array $entidades,
        string $acao,
        string $descricao,
        ?User $executor = null,
        array $metadados = []
    ): void {
        $chavesProcessadas = [];

        foreach ($entidades as $entidade) {
            if (! $entidade instanceof Model) {
                continue;
            }

            $chave = $entidade->getKey();
            if (! $entidade->exists || $chave === null || $chave === '') {
                continue;
            }

            // Evita duplicar o log caso a mesma instância/entidade apareça duas vezes na lista de propagação
            $assinatura = $entidade::class.'#'.(string) $chave;
            if (isset($chavesProcessadas[$assinatura])) {
                continue;
            }
            $chavesProcessadas[$assinatura] = true;

            $this->registrar($entidade, $acao, $descricao, $executor, $metadados);
        }
    }
}
