<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && ($user->isProfessor() || $user->isEspecialista() || $user->isAdm());
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'assunto' => ['required', 'string', 'max:5000'],
            'destinatario_tipo' => ['required', 'string', 'in:aluno,turma,geral'],
            'aluno_id' => ['exclude_unless:destinatario_tipo,aluno', 'required', 'integer', 'exists:users,id'],
            'turma_id' => ['exclude_unless:destinatario_tipo,turma', 'required', 'integer', 'exists:turmas,id_turma'],
            'super_importante' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'titulo.required' => 'O título da notificação é obrigatório.',
            'assunto.required' => 'O assunto da notificação é obrigatório.',
            'destinatario_tipo.in' => 'Selecione um tipo de destinatário válido.',
            'aluno_id.required' => 'Selecione o aluno que receberá a notificação.',
            'turma_id.required' => 'Selecione a turma que receberá a notificação.',
            'super_importante.boolean' => 'A prioridade super-importante deve ser verdadeira ou falsa.',
        ];
    }
}
