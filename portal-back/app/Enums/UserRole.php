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

    /** Identifica o papel público pelo domínio institucional usado no cadastro. */
    public static function fromInstitutionalEmail(string $email): ?self
    {
        $normalizedEmail = strtolower(trim($email));

        return match (true) {
            str_ends_with($normalizedEmail, '@aluno.mg.gov.br') => self::ALUNO,
            str_ends_with($normalizedEmail, '@educacao.mg.gov.br') => self::PROFESSOR,
            default => null,
        };
    }

    /** Informa o domínio que deve corresponder a alunos e professores. */
    public function institutionalEmailDomain(): ?string
    {
        return match ($this) {
            self::ALUNO, self::PADRAO => '@aluno.mg.gov.br',
            self::PROFESSOR => '@educacao.mg.gov.br',
            default => null,
        };
    }

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

    /**
     * Retorna o nível hierárquico de autoridade do perfil (1 = Operacional/Consulta, 2 = Gestão Pedagógica, 3 = Administração Total).
     */
    public function nivel(): int
    {
        return match ($this) {
            self::ALUNO, self::PROFESSOR, self::BIBLIOTECARIA, self::PADRAO => 1,
            self::ESPECIALISTA => 2,
            self::ADM => 3,
        };
    }
}
