<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para cancelamento ou transferência de matrícula escolar.
 *
 * Papel Didático:
 * Garante blindagem de entrada no endpoint PATCH /api/matriculas/{matricula}/cancelar,
 * restringindo a operação ao Especialista/Adm e validando o status_matricula permitido.
 */
class CancelarMatriculaRequest extends FormRequest
{
    /**
     * Autoriza apenas usuários com permissão de gestão acadêmica (Especialista ou Adm).
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    /**
     * Regras de validação do corpo da requisição.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status_matricula' => ['nullable', 'string', 'in:Transferido,Evadido'],
        ];
    }
}
