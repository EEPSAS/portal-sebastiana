<?php

namespace App\Services;

use App\Enums\TipoEvento;
use App\Models\Evento;
use App\Models\PeriodoLetivo;
use App\Models\PeriodoLetivoDivisao;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * PeriodoLetivoService
 *
 * Papel Didático:
 * Centraliza as regras de negócio para criação, edição, vigência e exclusão
 * de Períodos Letivos, além de garantir a sincronização automática de marcos
 * no calendário escolar institucional (`eventos`).
 */
class PeriodoLetivoService
{
    /**
     * Lista todos os períodos letivos com suas divisões e contagem de turmas.
     *
     * @return Collection<int, PeriodoLetivo>
     */
    public function listar(): Collection
    {
        return PeriodoLetivo::with(['divisoes', 'turmas'])
            ->orderByDesc('ano')
            ->get();
    }

    /**
     * Retorna o período letivo atualmente ativo com suas divisões.
     */
    public function obterAtivo(): ?PeriodoLetivo
    {
        return PeriodoLetivo::with(['divisoes', 'turmas'])
            ->where('ativo', true)
            ->first();
    }

    /**
     * Cria um novo período letivo completo e sincroniza os marcos no calendário escolar.
     */
    public function criar(array $dados, ?User $autor = null): PeriodoLetivo
    {
        return DB::transaction(function () use ($dados, $autor) {
            $isAtivo = ! empty($dados['ativo']) || PeriodoLetivo::count() === 0;

            // Se for marcado como ativo, desativa os outros antes
            if ($isAtivo) {
                PeriodoLetivo::where('ativo', true)->update(['ativo' => false]);
            }

            $periodo = PeriodoLetivo::create([
                'ano' => $dados['ano'],
                'tipo_divisao' => $dados['tipo_divisao'],
                'total_pontos' => $dados['total_pontos'],
                'data_inicio' => $dados['data_inicio'],
                'data_fim' => $dados['data_fim'],
                'ativo' => $isAtivo,
                'status' => $dados['status'] ?? ($isAtivo ? 'em_andamento' : 'planejado'),
            ]);

            // Cria as etapas filhas
            $divisoes = $dados['divisoes'] ?? [];
            foreach ($divisoes as $index => $divData) {
                PeriodoLetivoDivisao::create([
                    'periodo_letivo_id' => $periodo->id_periodo_letivo,
                    'numero' => $divData['numero'] ?? ($index + 1),
                    'nome' => $divData['nome'],
                    'pontos' => $divData['pontos'],
                    'data_inicio' => $divData['data_inicio'],
                    'data_fim' => $divData['data_fim'],
                    'ordem' => $divData['ordem'] ?? ($index + 1),
                ]);
            }

            // Sincroniza os marcos no calendário escolar
            $this->sincronizarMarcosAgenda($periodo, $autor);

            return $periodo->load(['divisoes', 'turmas']);
        });
    }

    /**
     * Atualiza um período letivo e recompõe suas divisões.
     */
    public function atualizar(PeriodoLetivo $periodo, array $dados, ?User $autor = null): PeriodoLetivo
    {
        return DB::transaction(function () use ($periodo, $dados, $autor) {
            $isAtivo = ! empty($dados['ativo']);

            if ($isAtivo && ! $periodo->ativo) {
                PeriodoLetivo::where('ativo', true)->where('id_periodo_letivo', '!=', $periodo->id_periodo_letivo)->update(['ativo' => false]);
            }

            $periodo->update([
                'ano' => $dados['ano'],
                'tipo_divisao' => $dados['tipo_divisao'],
                'total_pontos' => $dados['total_pontos'],
                'data_inicio' => $dados['data_inicio'],
                'data_fim' => $dados['data_fim'],
                'ativo' => $isAtivo ? true : $periodo->ativo,
                'status' => $dados['status'] ?? $periodo->status,
            ]);

            // Sincroniza divisões: remove antigas que não foram enviadas e atualiza/cria as informadas
            $divisoesPayload = $dados['divisoes'] ?? [];
            $idsPreservar = [];

            foreach ($divisoesPayload as $index => $divData) {
                $divisaoId = $divData['id_divisao'] ?? null;
                $campos = [
                    'numero' => $divData['numero'] ?? ($index + 1),
                    'nome' => $divData['nome'],
                    'pontos' => $divData['pontos'],
                    'data_inicio' => $divData['data_inicio'],
                    'data_fim' => $divData['data_fim'],
                    'ordem' => $divData['ordem'] ?? ($index + 1),
                ];

                if ($divisaoId) {
                    $divExistente = PeriodoLetivoDivisao::where('periodo_letivo_id', $periodo->id_periodo_letivo)
                        ->where('id_divisao', $divisaoId)
                        ->first();
                    if ($divExistente) {
                        $divExistente->update($campos);
                        $idsPreservar[] = $divExistente->id_divisao;

                        continue;
                    }
                }

                $novaDivisao = PeriodoLetivoDivisao::create(array_merge($campos, [
                    'periodo_letivo_id' => $periodo->id_periodo_letivo,
                ]));
                $idsPreservar[] = $novaDivisao->id_divisao;
            }

            // Exclui divisões não mais presentes no formulário
            PeriodoLetivoDivisao::where('periodo_letivo_id', $periodo->id_periodo_letivo)
                ->whereNotIn('id_divisao', $idsPreservar)
                ->delete();

            // Sincroniza os marcos no calendário escolar
            $this->sincronizarMarcosAgenda($periodo, $autor);

            return $periodo->fresh(['divisoes', 'turmas']);
        });
    }

    /**
     * Define o período letivo informado como o vigente (ativo).
     */
    public function ativar(PeriodoLetivo $periodo): PeriodoLetivo
    {
        $periodo->marcarComoAtivo();

        return $periodo->fresh(['divisoes', 'turmas']);
    }

    /**
     * Exclui o período letivo após validar integridade de turmas associadas.
     *
     * @throws ValidationException
     */
    public function excluir(PeriodoLetivo $periodo): void
    {
        $turmasCount = Turma::where('ano_letivo', $periodo->ano)->count();
        if ($turmasCount > 0) {
            throw ValidationException::withMessages([
                'periodo' => ["Não é possível excluir o Período Letivo de {$periodo->ano} pois existem {$turmasCount} turma(s) vinculada(s) a este ano letivo."],
            ]);
        }

        DB::transaction(function () use ($periodo) {
            // Remove os marcos criados no calendário para este ano letivo
            Evento::where('descricao', 'like', "%[Marco Escolar - Ano Letivo {$periodo->ano}]%")->delete();

            $periodo->delete();
        });
    }

    /**
     * Sincroniza marcos institucionais oficiais na tabela de eventos do calendário escolar.
     */
    public function sincronizarMarcosAgenda(PeriodoLetivo $periodo, ?User $autor = null): int
    {
        $criadorId = $autor?->id
            ?? User::where('role', 'adm')->value('id')
            ?? User::where('role', 'especialista')->value('id')
            ?? User::first()?->id;

        $ano = $periodo->ano;
        $totalCriadosOuAtualizados = 0;
        $tagIdentificadora = "[Marco Escolar - Ano Letivo {$ano}]";

        // 1. Marco de Início do Ano Letivo
        Evento::updateOrCreate(
            [
                'descricao' => "Início oficial das atividades pedagógicas do ano letivo de {$ano}. {$tagIdentificadora}",
            ],
            [
                'titulo' => "Início do Ano Letivo {$ano}",
                'data_inicio' => $periodo->data_inicio,
                'data_fim' => $periodo->data_inicio,
                'hora_inicio' => '07:30',
                'tipo' => TipoEvento::EVENTOS->value,
                'importante' => true,
                'local' => 'Colégio Sebastiana',
                'criador_id' => $criadorId,
            ]
        );
        $totalCriadosOuAtualizados++;

        // 2. Marcos para cada Divisão (ex: 1º Trimestre de data_inicio a data_fim)
        foreach ($periodo->divisoes as $div) {
            Evento::updateOrCreate(
                [
                    'descricao' => "Ciclo avaliativo correspondente ao {$div->nome} ({$div->pontos} pontos distribuídos). {$tagIdentificadora}",
                ],
                [
                    'titulo' => "{$div->nome} ({$div->pontos} pts) — Ano {$ano}",
                    'data_inicio' => $div->data_inicio,
                    'data_fim' => $div->data_fim,
                    'hora_inicio' => '07:30',
                    'tipo' => TipoEvento::EVENTOS->value,
                    'importante' => true,
                    'local' => 'Colégio Sebastiana',
                    'criador_id' => $criadorId,
                ]
            );
            $totalCriadosOuAtualizados++;
        }

        // 3. Marco de Encerramento do Ano Letivo
        Evento::updateOrCreate(
            [
                'descricao' => "Término oficial das aulas e fechamento do ano letivo de {$ano}. {$tagIdentificadora}",
            ],
            [
                'titulo' => "Encerramento do Ano Letivo {$ano}",
                'data_inicio' => $periodo->data_fim,
                'data_fim' => $periodo->data_fim,
                'hora_inicio' => '17:00',
                'tipo' => TipoEvento::EVENTOS->value,
                'importante' => true,
                'local' => 'Colégio Sebastiana',
                'criador_id' => $criadorId,
            ]
        );
        $totalCriadosOuAtualizados++;

        return $totalCriadosOuAtualizados;
    }
}
