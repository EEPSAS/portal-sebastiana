<?php

namespace App\Enums;

enum UserRole: string
{
    case PADRAO = 'padrao';
    case EDITOR = 'editor';
    case ADMINISTRADOR = 'administrador';

    public function label(): string
    {
        return match ($this) {
            self::PADRAO => 'Usuário Padrão',
            self::EDITOR => 'Editor',
            self::ADMINISTRADOR => 'Administrador',
        };
    }
}
