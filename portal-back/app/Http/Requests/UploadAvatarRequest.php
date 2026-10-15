<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Validação para upload de foto de perfil (avatar) do usuário.
class UploadAvatarRequest extends FormRequest
{
    // Autoriza se o usuário estiver alterando a própria foto ou for administrador
    public function authorize(): bool
    {
        $usuario = $this->route('usuario');
        $usuarioId = is_object($usuario) ? $usuario->id : (int) $usuario;

        return $this->user() !== null && (
            (int) $this->user()->id === (int) $usuarioId ||
            $this->user()->hasPermissionTo('gerenciar_usuarios')
        );
    }

    // Regras de validação para o arquivo de imagem
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:2048',
            ],
        ];
    }

    // Mensagens amigáveis em português
    public function messages(): array
    {
        return [
            'avatar.required' => 'O arquivo da foto de perfil é obrigatório.',
            'avatar.image' => 'O arquivo deve ser uma imagem válida.',
            'avatar.mimes' => 'A foto de perfil deve ser nos formatos JPG, JPEG, PNG ou WEBP.',
            'avatar.max' => 'A imagem não pode ultrapassar o limite de 2MB.',
        ];
    }
}
