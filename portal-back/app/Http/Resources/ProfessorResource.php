<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para representação e blindagem dos dados de Professor e seus vínculos docentes.
 *
 * Papel Didático:
 * Padroniza a resposta JSON entregue ao Especialista Pedagógico e Administrador,
 * centralizando o status de confirmação escolar e a relação de disciplinas/turmas atribuídas.
 */
class ProfessorResource extends JsonResource
{
    /**
     * Transforma o model User docente em payload formatado.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Carrega as disciplinas vinculadas diretamente ao professor
        $disciplinas = $this->relationLoaded('disciplinasDocente')
            ? $this->disciplinasDocente
            : $this->disciplinasDocente()->get();

        // Extrai as turmas onde as disciplinas atribuídas ao docente estão presentes
        $disciplinasIds = $disciplinas->pluck('id_disciplina');
        
        $turmasDisciplinas = $this->relationLoaded('turmaDisciplinasDocente')
            ? $this->turmaDisciplinasDocente
            : $this->turmaDisciplinasDocente()->with('turma')->get();

        $turmasResumo = $turmasDisciplinas
            ->filter(fn ($td) => $td->turma !== null)
            ->map(fn ($td) => [
                'id_turma' => $td->turma->id_turma,
                'nome_identificador' => $td->turma->nome_identificador,
                'turno' => $td->turma->turno,
                'ano_letivo' => $td->turma->ano_letivo,
            ])
            ->unique('id_turma')
            ->values();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'telefone' => $this->telefone,
            'avatar' => $this->avatar_url ?? $this->avatar,
            'role' => 'professor',
            'role_label' => 'Professor',
            'status_confirmacao' => $this->status_confirmacao ?? 'confirmado',
            'confirmado_em' => $this->confirmado_em?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'total_disciplinas' => $disciplinas->count(),
            'total_turmas' => $turmasResumo->count(),
            'disciplinas' => $disciplinas->map(fn ($d) => [
                'id_disciplina' => $d->id_disciplina,
                'nome' => $d->nome,
                'carga_horaria_anual' => $d->carga_horaria_anual,
                'descricao' => $d->descricao,
            ])->values(),
            'turmas' => $turmasResumo,
        ];
    }
}
