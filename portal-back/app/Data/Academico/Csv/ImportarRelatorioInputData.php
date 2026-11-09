<?php

namespace App\Data\Academico\Csv;

use App\Http\Requests\ImportarRelatorioTurmaRequest;
use App\Models\Turma;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Present;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Data Object que valida e normaliza os parâmetros de importação e os mapeamentos de conciliação
 * (homônimos de alunos, correlação estrita com disciplinas da turma e decisão de divergências).
 */
class ImportarRelatorioInputData extends Data
{
    /**
     * @param  array<string, int|string>  $mapeamentos_alunos
     * @param  array<string, array{acao: string, disciplina_id: int|null}>  $mapeamentos_disciplinas
     */
    public function __construct(
        #[Nullable, StringType, Max(100)]
        public ?string $periodo_letivo = null,

        #[Nullable, StringType, Max(30)]
        public ?string $data_aula = null,

        #[Nullable, StringType, In(['atualizar', 'manter'])]
        public ?string $decisao_divergencias = null,

        #[Present, ArrayType]
        public array $mapeamentos_alunos = [],

        #[Present, ArrayType]
        public array $mapeamentos_disciplinas = [],
    ) {}

    /**
     * Constrói e revalida o DTO a partir da Form Request, impedindo qualquer criação automática de
     * disciplinas/ciclos/alunos e garantindo que toda correlação aponte para disciplinas já vinculadas à turma.
     */
    public static function fromFormRequest(ImportarRelatorioTurmaRequest $request, ?Turma $turma = null): self
    {
        $rawAlunos = $request->input('mapeamentos_alunos', []);
        $rawDisciplinas = $request->input('mapeamentos_disciplinas', []);

        // Lista de IDs de disciplinas previamente vinculadas à turma pelo usuário (isolamento por Ciclo/Turma)
        $idsDisciplinasTurma = $turma
            ? $turma->disciplinas()->pluck('disciplinas.id_disciplina')->map(fn ($id) => (int) $id)->all()
            : [];

        $alunosNormalizados = [];
        if (is_array($rawAlunos)) {
            foreach ($rawAlunos as $nomeCsv => $escolha) {
                $chave = trim((string) $nomeCsv);
                if ($chave === '') {
                    continue;
                }

                // Permite apenas ignorar a linha ou apontar para um ID de aluno existente (nunca cria usuário)
                if (in_array($escolha, ['ignorar', 'nenhum'], true)) {
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

                // Normaliza formato compacto legado ('ignorar' ou ID numérico) para o contrato estruturado
                if (! is_array($decisao)) {
                    if ($decisao === 'ignorar') {
                        $disciplinasNormalizadas[$chave] = [
                            'acao' => 'ignorar',
                            'disciplina_id' => null,
                        ];

                        continue;
                    }

                    if (is_numeric($decisao) && (int) $decisao > 0) {
                        $decisao = [
                            'acao' => 'vincular',
                            'disciplina_id' => (int) $decisao,
                        ];
                    } else {
                        throw ValidationException::withMessages([
                            "mapeamentos_disciplinas.{$chave}.acao" => "Ação de conciliação inválida para a disciplina '{$chave}'.",
                        ]);
                    }
                }

                $acao = (string) ($decisao['acao'] ?? '');
                // Bloqueia 'criar_nova' e 'nova': o CSV não pode criar disciplinas nem alterar vínculos curriculares
                if (! in_array($acao, ['vincular', 'ignorar'], true)) {
                    throw ValidationException::withMessages([
                        "mapeamentos_disciplinas.{$chave}.acao" => "Ação inválida para '{$chave}'. A importação CSV permite apenas correlacionar a uma disciplina já vinculada à turma ou ignorar a coluna.",
                    ]);
                }

                // Harmonização canônica: aceita id_disciplina como alias retrocompatível e padroniza em disciplina_id
                $idDisc = $decisao['disciplina_id'] ?? $decisao['id_disciplina'] ?? null;
                $disciplinaId = is_numeric($idDisc) && (int) $idDisc > 0 ? (int) $idDisc : null;

                if ($acao === 'vincular') {
                    if ($disciplinaId === null) {
                        throw ValidationException::withMessages([
                            "mapeamentos_disciplinas.{$chave}.disciplina_id" => "Selecione uma disciplina válida para correlacionar '{$chave}'.",
                        ]);
                    }

                    // Impede correlação com disciplina de outro ciclo/turma que não pertença à grade atual da turma
                    if ($turma !== null && ! in_array($disciplinaId, $idsDisciplinasTurma, true)) {
                        throw ValidationException::withMessages([
                            "mapeamentos_disciplinas.{$chave}.disciplina_id" => "A disciplina selecionada para '{$chave}' não está vinculada à turma '{$turma->nome_identificador}'.",
                        ]);
                    }
                }

                $disciplinasNormalizadas[$chave] = [
                    'acao' => $acao,
                    'disciplina_id' => $acao === 'vincular' ? $disciplinaId : null,
                ];
            }
        }

        return self::validateAndCreate([
            'periodo_letivo' => $request->input('periodo_letivo'),
            'data_aula' => $request->input('data_aula'),
            'decisao_divergencias' => $request->input('decisao_divergencias'),
            'mapeamentos_alunos' => $alunosNormalizados,
            'mapeamentos_disciplinas' => $disciplinasNormalizadas,
        ]);
    }
}
