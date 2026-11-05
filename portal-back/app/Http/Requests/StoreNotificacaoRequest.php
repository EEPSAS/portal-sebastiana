<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($this->input('destinatario_tipo') === 'geral'
            && ! ($user->isEspecialista() || $user->isAdm())) {
            abort(403, 'Somente Especialista ou Administrador pode enviar comunicados gerais.');
        }

        return $user->isProfessor() || $user->isEspecialista() || $user->isAdm();
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
