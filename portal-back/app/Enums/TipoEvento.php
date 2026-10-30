<?php

namespace App\Enums;

// Enum que define os tipos de eventos do calendário escolar.
enum TipoEvento: string
{
    case EVENTOS = 'Eventos';
    case PROVAS_E_TRABALHOS = 'Provas e Trabalhos';
    case SABADO_LETIVO = 'Sábados Letivos';
    case FERIADOS_E_RECESSOS = 'Feriados e Recessos';

    // Retorna todos os valores do enum em array
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    // Indica se o tipo de evento é restrito à criação por Especialista e Administrador
    public function isRestrito(): bool
    {
        return match ($this) {
            self::PROVAS_E_TRABALHOS, self::SABADO_LETIVO, self::FERIADOS_E_RECESSOS => true,
            self::EVENTOS => false,
        };
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
            'provas e trabalhos', 'provas_e_trabalhos', 'provas', 'prova', 'avaliacao', 'avaliação' => self::PROVAS_E_TRABALHOS,
            'sabado letivo', 'sabados letivos', 'sábado letivo', 'sábados letivos', 'sabado_letivo', 'sabados_letivos', 'sabados', 'sabado', 'sábado' => self::SABADO_LETIVO,
            'feriados e recessos', 'feriados_e_recessos', 'feriados', 'feriado', 'recesso', 'recessos' => self::FERIADOS_E_RECESSOS,
            // Valores legados convertidos para Eventos conforme decisão arquitetural
            'datas comemorativas', 'datas_comemorativas', 'data comemorativa', 'data_importante' => self::EVENTOS,
            default => null,
        };
    }
}
