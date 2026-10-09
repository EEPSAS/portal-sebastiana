<?php

namespace App\Enums;

// Enum que define os tipos de eventos do calendário escolar.
enum TipoEvento: string
{
    case EVENTOS = 'Eventos';
    case PROVAS_E_TRABALHOS = 'Provas e Trabalhos';
    case DATAS_COMEMORATIVAS = 'Datas Comemorativas';
    case FERIADOS_E_RECESSOS = 'Feriados e Recessos';

    // Retorna todos os valores do enum em array
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    // Tenta resolver o enum aceitando valores textuais flexíveis ou slugs
    public static function tryFromLoose(?string $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        foreach (self::cases() as $case) {
            if (strcasecmp($case->value, $value) === 0) {
                return $case;
            }
        }

        return match (strtolower(trim($value))) {
            'eventos', 'evento', 'reuniao', 'reunião', 'reunioes', 'reuniões' => self::EVENTOS,
            'provas e trabalhos', 'provas_e_trabalhos', 'provas', 'prova' => self::PROVAS_E_TRABALHOS,
            'datas comemorativas', 'datas_comemorativas', 'data comemorativa', 'data_importante' => self::DATAS_COMEMORATIVAS,
            'feriados e recessos', 'feriados_e_recessos', 'feriados', 'feriado' => self::FERIADOS_E_RECESSOS,
            default => null,
        };
    }
}
