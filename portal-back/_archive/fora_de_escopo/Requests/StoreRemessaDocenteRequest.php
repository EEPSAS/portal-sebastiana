<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para envio de remessa de dados por professores.
class StoreRemessaDocenteRequest extends FormRequest
{
    // Autoriza qualquer usuário autenticado (a validação de vínculo ocorre no Controller)
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    // Regras de validação para os dados e anexo da remessa
    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'exists:turmas,id_turma'],
            'disciplina_id' => ['required', 'exists:disciplinas,id_disciplina'],
            'tipo_dado' => ['required', 'string', 'in:Frequência,Notas,Ambos'],
            'arquivo_anexo' => ['nullable', 'file', 'mimes:pdf,xlsx,xls,csv', 'max:10240'],
            'observacoes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
