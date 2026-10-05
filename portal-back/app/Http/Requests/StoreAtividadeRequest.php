<?php

namespace App\Http\Requests;

use App\Models\Atividade;
use Illuminate\Foundation\Http\FormRequest;

class StoreAtividadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('create', Atividade::class);
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'titulo' => ['required', 'string', 'max:255'],
            'descricao_texto' => ['required', 'string'],
            'arquivo_anexo' => ['nullable', 'file', 'max:10240'], // até 10MB (PDF, doc, etc.)
            'data_limite_entrega' => ['required', 'date'],
            'valor_pontuacao' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status_atividade' => ['nullable', 'string', 'in:Aberta,Encerrada'],
        ];
    }
}
