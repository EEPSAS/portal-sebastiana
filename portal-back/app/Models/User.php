<?php

namespace App\Models;

use App\Enums\TipoEvento;
use App\Enums\UserRole;
use App\Traits\HasRolesAndPermissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Campos permitidos para gravacao em massa
#[Fillable(['name', 'nickname', 'email', 'telefone', 'password', 'role', 'role_id', 'ativo', 'status_confirmacao', 'confirmado_em', 'autorizado_por_id', 'comentario_admin', 'google_id', 'avatar', 'data_nascimento'])]
// Campos ocultos na serializacao
#[Hidden(['password', 'remember_token'])]
// Model de usuário autenticável do sistema.
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    // Autenticacao via API, criacao por factory e notificacoes
    use HasApiTokens, HasFactory, HasRolesAndPermissions, Notifiable;

    // Conversoes de tipos de atributos
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'ativo' => 'boolean',
            'confirmado_em' => 'datetime',
            'data_nascimento' => 'date:Y-m-d',
        ];
    }

    // Permissao para gerenciamento de conteudo (eventos, noticias)
    public function canManageEvents(): bool
    {
        return $this->isAdm() || $this->hasPermissionTo('gerenciar_noticias') || $this->isEspecialista();
    }

    // Permissao para gerenciamento de biblioteca (livros, importação CSV e emprestimos)
    // Restrito a Bibliotecária, Especialista e Administrador (Aluno e Professor têm acesso apenas consultivo)
    public function canManageLibrary(): bool
    {
        if ($this->isAluno() || $this->isProfessor()) {
            return false;
        }

        return $this->isAdm()
            || $this->isBibliotecaria()
            || $this->isEspecialista()
            || $this->hasPermissionTo('gerenciar_livros')
            || $this->hasPermissionTo('gerenciar_emprestimos')
            || $this->hasPermissionTo('gerenciar_biblioteca');
    }

    // Permissao para gerenciamento acadêmico (turmas, notas, frequencias)
    public function canManageAcademic(): bool
    {
        return $this->isAdm()
            || $this->hasPermissionTo('gerenciar_turmas')
            || $this->hasPermissionTo('gerenciar_notas')
            || $this->hasPermissionTo('gerenciar_frequencia')
            || $this->isEspecialista();
    }

    // Verifica se a conta do usuário está vinculada ao Google OAuth
    public function hasGoogleAccount(): bool
    {
        return ! empty($this->google_id);
    }

    // Relacionamento com as noticias criadas
    public function noticias(): HasMany
    {
        return $this->hasMany(Noticia::class, 'autor_id');
    }

    // Retorna a URL pública resolvida do avatar ou null
    public function getAvatarUrlAttribute(): ?string
    {
        if (empty($this->avatar)) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http://') || str_starts_with($this->avatar, 'https://')) {
            return $this->avatar;
        }

        return asset('storage/'.$this->avatar);
    }

    // Relacionamento com os eventos criados
    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'criador_id');
    }

    // Relacionamento exclusivo com o evento de aniversário do usuário
    public function eventoAniversario(): HasOne
    {
        return $this->hasOne(Evento::class, 'criador_id')->where('is_aniversario', true);
    }

    /**
     * Sincroniza a data de nascimento do usuário com seu evento no calendário escolar.
     */
    public function syncEventoAniversario(?string $novaData = null): void
    {
        $dataRef = $novaData ?? $this->data_nascimento?->format('Y-m-d');

        // Se a data de nascimento foi removida, exclui o evento de aniversário da agenda
        if (empty($dataRef)) {
            $this->eventoAniversario()->delete();

            return;
        }

        // Extrai mês e dia para projetar o aniversário no ano corrente
        $partes = explode('-', (string) $dataRef);
        if (count($partes) === 3) {
            $anoAtual = (int) date('Y');
            $mes = $partes[1];
            $dia = $partes[2];
            $dataEvento = sprintf('%04d-%02d-%02d', $anoAtual, (int) $mes, (int) $dia);
        } else {
            $dataEvento = $dataRef;
        }

        $nomeExibicao = ! empty($this->nickname) ? $this->nickname : $this->name;
        $titulo = "Aniversário de {$nomeExibicao}";

        $evento = $this->eventoAniversario()->first();

        if ($evento) {
            $evento->update([
                'titulo' => $titulo,
                'data_inicio' => $dataEvento,
                'data_fim' => null,
                'tipo' => TipoEvento::EVENTOS,
            ]);
        } else {
            $this->eventos()->create([
                'titulo' => $titulo,
                'descricao' => "Celebração do aniversário de {$nomeExibicao}.",
                'data_inicio' => $dataEvento,
                'tipo' => TipoEvento::EVENTOS,
                'importante' => false,
                'is_aniversario' => true,
            ]);
        }
    }

    // Biblioteca pessoal do usuário (livros, planos, videoaulas e apostilas)
    public function biblioteca(): HasOne
    {
        return $this->hasOne(Biblioteca::class);
    }

    /**
     * @return HasMany<Emprestimo, $this>
     */
    // Histórico de empréstimos solicitados pelo usuário
    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class, 'usuario_id');
    }

    /**
     * @return HasMany<Matricula, $this>
     */
    // Matrículas escolares do aluno
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    // Turmas em que o aluno está matriculado
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'matriculas', 'usuario_id', 'turma_id')
            ->withPivot(['id_matricula', 'data_matricula', 'status_matricula'])
            ->withTimestamps();
    }

    /**
     * Acessor didático: Retorna a turma ativa mais recente do estudante.
     * Caso o usuário não seja aluno ou não possua matrícula com status 'Ativo', retorna null.
     */
    public function getTurmaAtivaAttribute(): ?Turma
    {
        // Se não for aluno (ex: professor, especialista, adm), dispensa consulta à turma
        if (! $this->isAluno()) {
            return null;
        }

        // Identifica o período letivo ativo vigente
        $anoAtivo = PeriodoLetivo::where('ativo', true)->value('ano');

        // Se o relacionamento já tiver sido pré-carregado (eager loading), filtra em memória para economizar queries
        if ($this->relationLoaded('turmas')) {
            $ativas = $this->turmas
                ->filter(fn ($t) => ($t->pivot?->status_matricula ?? null) === 'Ativo');

            if ($anoAtivo && $turmaAnoAtivo = $ativas->firstWhere('ano_letivo', $anoAtivo)) {
                return $turmaAnoAtivo;
            }

            return $ativas->sortByDesc('ano_letivo')->first();
        }

        // Caso contrário, prioriza a turma do ano letivo ativo ou a mais recente
        $query = $this->turmas()->wherePivot('status_matricula', 'Ativo');
        if ($anoAtivo) {
            $turmaAnoAtivo = (clone $query)->where('ano_letivo', $anoAtivo)->first();
            if ($turmaAnoAtivo) {
                return $turmaAnoAtivo;
            }
        }

        return $query->orderByDesc('ano_letivo')->first();
    }

    /**
     * [ARQUIVADO - FORA DE ESCOPO] Relações com módulos de remessas e atividades
     * public function remessas(): HasMany { return $this->hasMany(RemessaDocente::class, 'professor_id', 'id'); }
     * public function atividadesCriadas(): HasMany { return $this->hasMany(Atividade::class, 'usuario_id', 'id'); }
     * public function submissoes(): HasMany { return $this->hasMany(Submissao::class, 'usuario_id', 'id'); }
     */

    /**
     * @return HasMany<Frequencia, $this>
     */
    // Registros de frequência do aluno (populados via CSV pelo Especialista)
    public function frequencias(): HasMany
    {
        return $this->hasMany(Frequencia::class, 'usuario_id', 'id');
    }

    /**
     * @return HasMany<Nota, $this>
     */
    // Registros de notas e avaliações do aluno (populados via CSV pelo Especialista)
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'usuario_id', 'id');
    }

    /**
     * @return BelongsToMany<Turma, $this>
     */
    // Turmas escolares em que o professor leciona disciplinas (via tabela turma_disciplinas)
    public function turmasLecionadas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'turma_disciplinas', 'professor_id', 'turma_id')
            ->withTimestamps();
    }

    /**
     * @return HasMany<PlanoEstudo, $this>
     */
    // Planos de estudo criados pelo usuário
    public function planosEstudos(): HasMany
    {
        return $this->hasMany(PlanoEstudo::class, 'user_id', 'id');
    }

    /**
     * Verifica se o e-mail do usuário pertence estritamente ao domínio institucional oficial (@aluno.mg.gov.br).
     */
    public function hasInstitutionalEmail(): bool
    {
        return ! empty($this->email) && str_ends_with(strtolower(trim($this->email)), '@aluno.mg.gov.br');
    }

    /**
     * Escopo Eloquent didático para filtrar exclusivamente alunos cadastrados com e-mail institucional oficial.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeAlunosInstitucionais($query)
    {
        return $query->where('role', UserRole::ALUNO)
            ->where('email', 'like', '%@aluno.mg.gov.br');
    }

    /**
     * Verifica se o usuário é um professor confirmado pela equipe pedagógica.
     */
    public function isProfessorConfirmado(): bool
    {
        return $this->isProfessor() && ($this->status_confirmacao === 'confirmado' || empty($this->status_confirmacao));
    }

    /**
     * Verifica se o usuário é um professor aguardando confirmação do Especialista.
     */
    public function isProfessorPendente(): bool
    {
        return $this->isProfessor() && $this->status_confirmacao === 'pendente';
    }

    /**
     * Disciplinas curriculares vinculadas diretamente ao professor pelo Especialista.
     *
     * @return BelongsToMany<Disciplina, $this>
     */
    public function disciplinasDocente(): BelongsToMany
    {
        return $this->belongsToMany(Disciplina::class, 'disciplina_professores', 'professor_id', 'disciplina_id')
            ->withTimestamps();
    }

    /**
     * Vínculos específicos em turmas onde este professor leciona disciplinas.
     *
     * @return HasMany<TurmaDisciplina, $this>
     */
    public function turmaDisciplinasDocente(): HasMany
    {
        return $this->hasMany(TurmaDisciplina::class, 'professor_id', 'id');
    }

    /**
     * Relacionamento N:1: Gestor (Especialista/Admin) que autorizou o vínculo atual do usuário.
     */
    public function autorizadoPor(): BelongsTo
    {
        return $this->belongsTo(self::class, 'autorizado_por_id', 'id');
    }

    /**
     * Histórico completo de vínculos do usuário com a escola ao longo do tempo.
     *
     * @return HasMany<UsuarioVinculo, $this>
     */
    public function vinculos(): HasMany
    {
        return $this->hasMany(UsuarioVinculo::class, 'usuario_id', 'id')->latest('iniciado_em');
    }

    /**
     * Retorna o vínculo escolar atualmente em aberto (sem data de encerramento).
     */
    public function vinculoAtivo(): HasOne
    {
        return $this->hasOne(UsuarioVinculo::class, 'usuario_id', 'id')
            ->whereNull('encerrado_em')
            ->latestOfMany('id_vinculo');
    }

    /**
     * Verifica se o usuário (Aluno ou Professor) está aguardando aprovação de login.
     */
    public function isPendenteAprovacao(): bool
    {
        return $this->status_confirmacao === 'pendente';
    }

    /**
     * Registra ou renova formalmente o vínculo ativo do usuário após aprovação pedagógica/administrativa.
     */
    public function registrarVinculoEscolar(?int $autorizadoPorId = null, ?string $observacoes = null): UsuarioVinculo
    {
        $agora = now();
        $roleValor = $this->role instanceof UserRole ? $this->role->value : (string) $this->role;

        $this->update([
            'ativo' => true,
            'status_confirmacao' => 'confirmado',
            'confirmado_em' => $agora,
            'autorizado_por_id' => $autorizadoPorId,
        ]);

        // Caso já exista um vínculo aberto, atualiza os metadados; caso contrário, abre um novo ciclo de vínculo
        $vinculoAberto = $this->vinculos()->whereNull('encerrado_em')->first();

        if ($vinculoAberto) {
            $vinculoAberto->update([
                'role_no_vinculo' => $roleValor,
                'autorizado_por_id' => $autorizadoPorId ?? $vinculoAberto->autorizado_por_id,
                'iniciado_em' => $vinculoAberto->iniciado_em ?? $agora,
                'observacoes' => $observacoes ?? $vinculoAberto->observacoes,
            ]);

            return $vinculoAberto;
        }

        return $this->vinculos()->create([
            'role_no_vinculo' => $roleValor,
            'autorizado_por_id' => $autorizadoPorId,
            'iniciado_em' => $agora,
            'observacoes' => $observacoes,
        ]);
    }
}
