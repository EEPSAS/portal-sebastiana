<?php

namespace App\Http\Requests;

use App\Models\PlanoEstudo;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação do compartilhamento de Planos de Estudos com turmas.
 *
 * Papel Didático:
 * Garante que apenas professores (ou administradores) proprietários do plano
 * possam compartilhá-lo com turmas escolares válidas (1º, 2º ou 3º ano).
 * Estudantes não possuem permissão para compartilhar planos.
 */
class CompartilharPlanoEstudoRequest extends FormRequest
{
    /**
     * Determina se o usuário está autorizado a compartilhar o plano.
     */
    public function authorize(): bool
    {
        $usuario = $this->user();
        if (! $usuario) {
            return false;
        }

        // Apenas professores e administradores podem compartilhar planos com turmas
        if (! $usuario->isProfessor() && ! $usuario->isAdm()) {
            return false;
        }

        /** @var PlanoEstudo|null $plano */
        $plano = $this->route('plano');

        // Somente o próprio professor criador do plano (ou um adm) pode alterar seu compartilhamento
        return $plano !== null && ($plano->user_id === $usuario->id || $usuario->isAdm());
    }

    /**
     * Regras de validação dos campos de entrada.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Lista de IDs de turmas (permite array vazio para remover todos os compartilhamentos)
            'turma_ids' => ['present', 'array'],
            'turma_ids.*' => ['integer', 'exists:turmas,id_turma'],
        ];
    }

    /**
     * Mensagens de validação amigáveis em pt-BR.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'turma_ids.present' => 'Informe a lista de turmas para o compartilhamento.',
            'turma_ids.array' => 'O formato da lista de turmas é inválido.',
            'turma_ids.*.exists' => 'Uma ou mais turmas selecionadas não existem no sistema.',
        ];
    }
}

