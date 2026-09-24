<?php

namespace App\Enums;

//Define os papéis (perfis de acesso) disponíveis para os usuários no sistema.

enum UserRole: string
{
    // Valores literais armazenados na coluna 'role' da tabela 'users'
    case PADRAO = 'padrao';
    case EDITOR = 'editor';
    case ADMINISTRADOR = 'administrador';

    // Retorna o nome legível do papel para exibição nas telas (UI/Blade/JSON).
    public function label(): string
    {
        return match ($this) {
            self::PADRAO => 'Usuário Padrão',
            self::EDITOR => 'Editor',
            self::ADMINISTRADOR => 'Administrador',
        };
    }
}