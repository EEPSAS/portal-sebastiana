<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAtividadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $atividade = $this->route('atividade');

        return $this->user() !== null && $atividade !== null && $this->user()->can('update', $atividade);
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['sometimes', 'required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['sometimes', 'required', 'exists:disciplinas,id_disciplina'],
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao_texto' => ['sometimes', 'required', 'string'],
            'arquivo_anexo' => ['nullable', 'file', 'max:10240'],
            'remover_anexo' => ['nullable', 'boolean'],
            'data_limite_entrega' => ['sometimes', 'required', 'date'],
            'valor_pontuacao' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status_atividade' => ['sometimes', 'required', 'string', 'in:Aberta,Encerrada'],
        ];
    }
}
