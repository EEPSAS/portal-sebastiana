<?php

namespace App\Enums;

// Define os papéis (perfis de acesso) disponíveis para os usuários no sistema.

enum UserRole: string
{
    // Papéis Nível 1: Usuários Padrão
    case ALUNO = 'aluno';
    case PROFESSOR = 'professor';
    case BIBLIOTECARIA = 'bibliotecaria';
    case PADRAO = 'padrao'; // Compatibilidade para usuários padrão genéricos

    // Papel Nível 2: Especialista / Editor
    case ESPECIALISTA = 'especialista';

    // Papel Nível 3: Administrador Geral
    case ADM = 'adm';

    // Retorna o nome legível do papel para exibição nas telas (UI/Blade/JSON).
    public function label(): string
    {
        return match ($this) {
            self::ALUNO => 'Aluno',
            self::PROFESSOR => 'Professor',
            self::BIBLIOTECARIA => 'Bibliotecária',
            self::PADRAO => 'Usuário Padrão',
            self::ESPECIALISTA => 'Especialista',
            self::ADM => 'Administrador',
        };
    }

    public function nivel(): int
    {
        return match ($this) {
            self::ALUNO, self::PROFESSOR, self::BIBLIOTECARIA, self::PADRAO => 1,
            self::ESPECIALISTA => 2,
            self::ADM => 3,
        };
    }
}
