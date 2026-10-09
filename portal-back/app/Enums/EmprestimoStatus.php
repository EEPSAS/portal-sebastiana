<?php

namespace App\Enums;

enum EmprestimoStatus: string
{
    case SOLICITADO = 'solicitado';
    case APROVADO = 'aprovado';
    case DEVOLVIDO = 'devolvido';
    case RENOVADO = 'renovado';
    case RECUSADO = 'recusado';
    case ATRASADO = 'atrasado';

    public function label(): string
    {
        return match ($this) {
            self::SOLICITADO => 'Solicitado',
            self::APROVADO => 'Aprovado',
            self::DEVOLVIDO => 'Devolvido',
            self::RENOVADO => 'Renovado',
            self::RECUSADO => 'Recusado',
            self::ATRASADO => 'Atrasado',
        };
    }
}
