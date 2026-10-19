<?php

namespace App\Http\Requests;

use App\Enums\EmprestimoStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * AtualizarStatusEmprestimoRequest - Validação de Transição Manual de Status de Empréstimo
 *
 * Papel Didático:
 * Utiliza a regra nativa `new Enum(EmprestimoStatus::class)` do Laravel para garantir
 * que apenas valores válidos do Enum sejam aceitos na alteração de status.
 */
class AtualizarStatusEmprestimoRequest extends FormRequest
{
    /**
     * Autoriza apenas usuários com permissão de gestão da biblioteca escolar.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Regras de validação do novo status, prazo previsto e observações.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(EmprestimoStatus::class)],
            'data_prevista_devolucao' => ['nullable', 'date'],
            'observacoes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Mensagens amigáveis em português para feedback de validação.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'O novo status do empréstimo é obrigatório.',
        ];
    }
}
