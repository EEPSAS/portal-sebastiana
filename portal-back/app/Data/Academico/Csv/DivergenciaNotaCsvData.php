<?php

namespace App\Data\Academico\Csv;

use Spatie\LaravelData\Data;

/**
 * Representa uma divergência entre o histórico já registrado no banco (nota e/ou faltas)
 * e os novos valores vindos da planilha CSV para um mesmo período letivo.
 */
class DivergenciaNotaCsvData extends Data
{
    public function __construct(
        public int $usuario_id,
        public string $nome_aluno,
        public int $disciplina_id,
        public string $nome_disciplina,
        public string $periodo_letivo,
        public float $nota_atual,
        public float $nova_nota,
        public string $tipo_divergencia = 'nota',
        public ?int $faltas_atuais = null,
        public ?int $novas_faltas = null,
    ) {}
}
