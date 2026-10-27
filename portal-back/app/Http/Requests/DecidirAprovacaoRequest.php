<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/** Restringe a decisão a Especialista e aos estados aceitos pelo fluxo de aprovação. */
class DecidirAprovacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role?->value === 'especialista';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'approval_status' => ['required', 'in:approved,rejected'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('approval_status') !== 'approved') {
                return;
            }

            $usuario = $this->route('usuario');
            if (! $usuario instanceof User) {
                $usuario = User::find($usuario);
            }

            $role = $usuario?->role;
            $domain = $role instanceof UserRole ? $role->institutionalEmailDomain() : null;

            if ($domain !== null && ! str_ends_with(strtolower((string) $usuario->email), $domain)) {
                $validator->errors()->add(
                    'approval_status',
                    'O e-mail não pertence ao domínio escolar exigido para este papel.'
                );
            }
        });
    }
}
