<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\DonaNanaConfig;
use App\Models\Matricula;
use App\Models\PeriodoLetivo;
use App\Models\Turma;
use App\Models\TurmaDisciplina;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * AdminDashboardService
 *
 * Papel Didático:
 * Consolida os indicadores de gestão do sistema exibidos no Geral do Administrador:
 * usuários (perfis e status), pendências de aprovação, sessões ativas, cadastros recentes
 * e uma checklist de saúde da configuração escolar. Usa apenas dados já existentes.
 */
class AdminDashboardService
{
    /** Perfis exibidos na distribuição de usuários. */
    private const PERFIS = ['aluno', 'professor', 'especialista', 'bibliotecaria', 'adm'];

    public function __construct(
        protected TokenSessaoService $tokenSessaoService
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function obterVisaoAdmin(): array
    {
        return [
            'usuarios' => $this->resumirUsuarios(),
            'pendencias' => $this->resumirPendencias(),
            // Contabiliza apenas os tokens Sanctum ativos (dentro do prazo de 6 horas)
            'sessoes_ativas' => $this->tokenSessaoService->contarSessoesAtivas(),
            'cadastros_recentes' => $this->listarCadastrosRecentes(),
            'saude_sistema' => $this->montarSaudeSistema(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resumirUsuarios(): array
    {
        $contagemPorRole = User::query()
            ->select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role')
            ->all();

        $porPerfil = [];
        foreach (self::PERFIS as $perfil) {
            $porPerfil[$perfil] = (int) ($contagemPorRole[$perfil] ?? 0);
        }

        $total = (int) User::query()->count();
        $ativos = (int) User::query()->where('ativo', true)->count();

        return [
            'total' => $total,
            'por_perfil' => $porPerfil,
            'ativos' => $ativos,
            'inativos' => $total - $ativos,
            'pendentes' => (int) User::query()->where('status_confirmacao', 'pendente')->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function resumirPendencias(): array
    {
        return [
            'alunos_pendentes' => (int) User::query()
                ->where('role', UserRole::ALUNO)
                ->where('status_confirmacao', 'pendente')
                ->count(),
            'professores_pendentes' => (int) User::query()
                ->where('role', UserRole::PROFESSOR)
                ->where('status_confirmacao', 'pendente')
                ->count(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listarCadastrosRecentes(int $limite = 10): array
    {
        return User::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limite)
            ->get(['id', 'name', 'email', 'role', 'ativo', 'status_confirmacao', 'created_at'])
            ->map(fn (User $usuario) => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'role' => $usuario->role instanceof UserRole ? $usuario->role->value : (string) $usuario->role,
                'ativo' => (bool) $usuario->ativo,
                'status_confirmacao' => $usuario->status_confirmacao,
                'created_at' => $usuario->created_at?->toIso8601String(),
                'tempoAtras' => $usuario->created_at?->locale('pt_BR')->diffForHumans(),
            ])
            ->all();
    }

    /**
     * Checklist de saúde da configuração: cada item informa status `ok` ou `alerta`.
     *
     * @return array<int, array<string, mixed>>
     */
    private function montarSaudeSistema(): array
    {
        $periodoAtivo = PeriodoLetivo::query()->ativo()->first();

        $alunosSemTurma = (int) User::query()
            ->where('role', UserRole::ALUNO)
            ->where('ativo', true)
            ->where('status_confirmacao', 'confirmado')
            ->whereNotIn('id', Matricula::query()->where('status_matricula', 'Ativo')->select('usuario_id'))
            ->count();

        $turmasSemProfessor = (int) Turma::query()
            ->whereNotIn('id_turma', TurmaDisciplina::query()->whereNotNull('professor_id')->select('turma_id'))
            ->count();

        $disciplinasSemDocente = (int) DB::table('disciplinas')
            ->whereNotIn('id_disciplina', TurmaDisciplina::query()->whereNotNull('professor_id')->select('disciplina_id'))
            ->count();

        $donaNanaAtiva = (bool) DonaNanaConfig::obterAtiva()->ativo;

        return [
            [
                'id' => 'periodo-letivo',
                'titulo' => 'Período letivo ativo',
                'status' => $periodoAtivo ? 'ok' : 'alerta',
                'detalhe' => $periodoAtivo ? "Ano letivo {$periodoAtivo->ano}" : 'Nenhum período letivo ativo',
                'destino' => '/dashboard/periodos-letivos',
            ],
            [
                'id' => 'alunos-sem-turma',
                'titulo' => 'Alunos sem turma',
                'status' => $alunosSemTurma === 0 ? 'ok' : 'alerta',
                'detalhe' => $alunosSemTurma === 0 ? 'Todos os alunos estão enturmados' : "{$alunosSemTurma} aluno(s) aguardando enturmação",
                'destino' => '/dashboard/turmas?aba=turmas',
            ],
            [
                'id' => 'turmas-sem-professor',
                'titulo' => 'Turmas sem professor',
                'status' => $turmasSemProfessor === 0 ? 'ok' : 'alerta',
                'detalhe' => $turmasSemProfessor === 0 ? 'Todas as turmas têm docente' : "{$turmasSemProfessor} turma(s) sem docente atribuído",
                'destino' => '/dashboard/professores',
            ],
            [
                'id' => 'disciplinas-sem-docente',
                'titulo' => 'Disciplinas sem docente',
                'status' => $disciplinasSemDocente === 0 ? 'ok' : 'alerta',
                'detalhe' => $disciplinasSemDocente === 0 ? 'Todas as disciplinas têm docente' : "{$disciplinasSemDocente} disciplina(s) sem docente",
                'destino' => '/dashboard/disciplinas',
            ],
            [
                'id' => 'dona-nana',
                'titulo' => 'Assistente Dona Nana',
                'status' => $donaNanaAtiva ? 'ok' : 'alerta',
                'detalhe' => $donaNanaAtiva ? 'Assistente ativa' : 'Assistente desativada',
                'destino' => '/dashboard/dona-nana/configuracao',
            ],
        ];
    }
}
