<?php

namespace App\Http\Requests;

use App\Enums\EmprestimoStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

// Validação para atualização manual do status de um empréstimo.
class AtualizarStatusEmprestimoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    // Autoriza apenas usuários com permissão de gestão de biblioteca
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageLibrary();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    // Regras de validação do novo status e campos opcionais
    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(EmprestimoStatus::class)],
            'data_prevista_devolucao' => ['nullable', 'date'],
            'observacoes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    // Mensagens customizadas de validação
    public function messages(): array
    {
        return [
            'status.required' => 'O novo status do empréstimo é obrigatório.',
        ];
    }
}
