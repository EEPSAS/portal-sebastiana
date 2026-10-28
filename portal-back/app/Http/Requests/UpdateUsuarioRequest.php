<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

// Validação para atualização cadastral de usuários pelo próprio usuário ou pelo administrador (Item 1.3.8).
class UpdateUsuarioRequest extends FormRequest
{
    // Autoriza se for o próprio usuário autenticado ou se tiver permissão de gerenciar usuários
    public function authorize(): bool
    {
        $usuario = $this->route('usuario');
        $usuarioId = is_object($usuario) ? $usuario->id : (int) $usuario;

        return $this->user() !== null && (
            (int) $this->user()->id === (int) $usuarioId ||
            $this->user()->hasPermissionTo('gerenciar_usuarios') ||
            $this->user()->isAdm()
        );
    }

    // Regras de validação para os dados cadastrais e edição administrativa
    public function rules(): array
    {
        $usuario = $this->route('usuario');
        $usuarioId = is_object($usuario) ? $usuario->id : (int) $usuario;
        $isAdm = $this->user() && ($this->user()->hasPermissionTo('gerenciar_usuarios') || $this->user()->isAdm());

        // Nome institucional NÃO é editável pelo próprio usuário: sem regra, o validated() o descarta
        $rules = [
            'nickname' => ['nullable', 'string', 'max:50'],
            'telefone' => ['nullable', 'string', 'max:25'],
            'data_nascimento' => ['nullable', 'date'],
            'password' => ['nullable', 'string', 'min:8'],
        ];

        // Apenas administradores podem alterar nome, papel, status de ativação, comentário e emitir notificação direta (Item 1.3.8)
        if ($isAdm) {
            $rules['name'] = ['sometimes', 'required', 'string', 'max:255'];
            $rules['email'] = ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($usuarioId)];
            $rules['role_id'] = ['nullable', 'exists:roles,id'];
            $rules['role'] = ['nullable', 'string', new Enum(UserRole::class)];
            $rules['ativo'] = ['nullable', 'boolean'];
            $rules['comentario_admin'] = ['nullable', 'string', 'max:2000'];
            $rules['mensagem_notificacao'] = ['nullable', 'string', 'max:2000'];
            $rules['titulo_notificacao'] = ['nullable', 'string', 'max:150'];
            $rules['super_importante'] = ['nullable', 'boolean'];
        } else {
            // Para usuários comuns, o envio do e-mail é apenas tolerado mas ignorado
            $rules['email'] = ['nullable', 'string'];
        }

        // Se uma nova senha for fornecida pelo próprio usuário, valida a senha atual (caso tenha senha cadastrada)
        if ($this->filled('password') && ! $isAdm && ! empty($this->user()->password)) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        return $rules;
    }

    // Mensagens didáticas de validação em português
    public function messages(): array
    {
        return [
            'name.required' => 'O nome institucional é obrigatório.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um formato de e-mail válido.',
            'email.unique' => 'Este e-mail já está em uso por outro usuário.',
            'password.min' => 'A senha deve conter no mínimo 8 caracteres.',
            'current_password.required' => 'Informe sua senha atual para definir uma nova senha.',
            'current_password.current_password' => 'A senha atual informada está incorreta.',
            'data_nascimento.date' => 'A data de nascimento informada não é válida.',
            'role.Illuminate\Validation\Rules\Enum' => 'O papel selecionado é inválido.',
        ];
    }
}
