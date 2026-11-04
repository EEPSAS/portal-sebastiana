<?php

namespace App\Data\Academico\Csv;

use App\Http\Requests\ImportarRelatorioTurmaRequest;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Present;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Data Object que valida e normaliza os parâmetros de importação e os mapeamentos de conciliação
 * (homônimos de alunos, correlação de disciplinas e decisão de divergências) enviados com o CSV.
 */
class ImportarRelatorioInputData extends Data
{
    /**
     * @param  array<string, int|string>  $mapeamentos_alunos
     * @param  array<string, array<string, mixed>|int|string>  $mapeamentos_disciplinas
     */
    public function __construct(
        #[Nullable, StringType, Max(100)]
        public ?string $periodo_letivo = null,

        #[Nullable, StringType, Max(30)]
        public ?string $data_aula = null,

        #[Nullable, IntegerType, Exists('ciclos', 'id_ciclo')]
        public ?int $ciclo_id = null,

        #[BooleanType]
        public bool $exigir_conciliacao_disciplinas = false,

        #[Nullable, StringType, In(['atualizar', 'manter'])]
        public ?string $decisao_divergencias = null,

        #[Present, ArrayType]
        public array $mapeamentos_alunos = [],

        #[Present, ArrayType]
        public array $mapeamentos_disciplinas = [],
    ) {}

    /**
     * Constrói e revalida o DTO a partir da Form Request, harmonizando o alias legado `id_disciplina`
     * para o contrato canônico `disciplina_id` e garantindo integridade dos mapeamentos.
     */
    public static function fromFormRequest(ImportarRelatorioTurmaRequest $request, bool $turmaPossuiCiclo = false): self
    {
        $rawAlunos = $request->input('mapeamentos_alunos', []);
        $rawDisciplinas = $request->input('mapeamentos_disciplinas', []);

        $alunosNormalizados = [];
        if (is_array($rawAlunos)) {
            foreach ($rawAlunos as $nomeCsv => $escolha) {
                $chave = trim((string) $nomeCsv);
                if ($chave === '') {
                    continue;
                }

                if (in_array($escolha, ['ignorar', 'nenhum', 'novo', 'criar_novo'], true)) {
                    $alunosNormalizados[$chave] = (string) $escolha;
                } elseif (is_numeric($escolha) && (int) $escolha > 0) {
                    $alunosNormalizados[$chave] = (int) $escolha;
                } else {
                    throw ValidationException::withMessages([
                        "mapeamentos_alunos.{$chave}" => "Mapeamento de aluno inválido para '{$chave}'.",
                    ]);
                }
            }
        }

        $disciplinasNormalizadas = [];
        if (is_array($rawDisciplinas)) {
            foreach ($rawDisciplinas as $nomeCsv => $decisao) {
                $chave = trim((string) $nomeCsv);
                if ($chave === '') {
                    continue;
                }

                if (! is_array($decisao)) {
                    $disciplinasNormalizadas[$chave] = $decisao;

                    continue;
                }

                $acao = (string) ($decisao['acao'] ?? '');
                if (! in_array($acao, ['vincular', 'criar_nova', 'nova', 'ignorar'], true)) {
                    throw ValidationException::withMessages([
                        "mapeamentos_disciplinas.{$chave}.acao" => "Ação de conciliação inválida para a disciplina '{$chave}'.",
                    ]);
                }

                // Harmonização canônica: aceita id_disciplina como alias retrocompatível e padroniza em disciplina_id
                $idDisc = $decisao['disciplina_id'] ?? $decisao['id_disciplina'] ?? null;
                $disciplinaId = is_numeric($idDisc) && (int) $idDisc > 0 ? (int) $idDisc : null;

                if ($acao === 'vincular' && $disciplinaId === null) {
                    throw ValidationException::withMessages([
                        "mapeamentos_disciplinas.{$chave}.disciplina_id" => "Selecione uma disciplina válida para vincular '{$chave}'.",
                    ]);
                }

                $aulasSemanais = isset($decisao['aulas_semanais']) && is_numeric($decisao['aulas_semanais'])
                    ? (int) $decisao['aulas_semanais']
                    : 2;

                if (in_array($acao, ['criar_nova', 'nova'], true) && ($aulasSemanais < 1 || $aulasSemanais > 20)) {
                    throw ValidationException::withMessages([
                        "mapeamentos_disciplinas.{$chave}.aulas_semanais" => "A quantidade de aulas semanais de '{$chave}' deve estar entre 1 e 20.",
                    ]);
                }

                $cicloItem = isset($decisao['ciclo_id']) && is_numeric($decisao['ciclo_id']) && (int) $decisao['ciclo_id'] > 0
                    ? (int) $decisao['ciclo_id']
                    : null;

                $disciplinasNormalizadas[$chave] = [
                    'acao' => $acao,
                    'disciplina_id' => $disciplinaId,
                    'nome_nova' => isset($decisao['nome_nova']) ? trim((string) $decisao['nome_nova']) : (isset($decisao['nome']) ? trim((string) $decisao['nome']) : $chave),
                    'aulas_semanais' => $aulasSemanais,
                    'ciclo_id' => $cicloItem,
                ];
            }
        }

        return self::validateAndCreate([
            'periodo_letivo' => $request->input('periodo_letivo'),
            'data_aula' => $request->input('data_aula'),
            'ciclo_id' => $request->filled('ciclo_id') ? (int) $request->input('ciclo_id') : null,
            'exigir_conciliacao_disciplinas' => $request->boolean('exigir_conciliacao_disciplinas', false) || $turmaPossuiCiclo,
            'decisao_divergencias' => $request->input('decisao_divergencias'),
            'mapeamentos_alunos' => $alunosNormalizados,
            'mapeamentos_disciplinas' => $disciplinasNormalizadas,
        ]);
    }
}
