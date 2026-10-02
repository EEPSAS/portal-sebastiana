<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDisciplinaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->canManageAcademic();
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'carga_horaria_anual' => ['required', 'integer', 'min:1'],
            'descricao' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
