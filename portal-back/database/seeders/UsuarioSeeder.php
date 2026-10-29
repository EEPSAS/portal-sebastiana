<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder responsável pelo povoamento padronizado de usuários do sistema.
 *
 * Papel Didático:
 * - Define contas canônicas para todos os perfis com credenciais seguras;
 * - Garante que usuários ativos possuam status de confirmação e histórico de vínculo homologado;
 * - Cria um exemplo de usuário inativo para validação da retenção de histórico (Diretrizes 1.3.6 e 1.3.7);
 * - Cria um exemplo de usuário pendente de aprovação para validação do fluxo de espera (Diretriz 2).
 */
class UsuarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = Hash::make('password');
        $roles = class_exists(Role::class) ? Role::pluck('id', 'slug')->all() : [];

        // 1. Administrador Geral (Nível 3)
        $admin = User::updateOrCreate(
            ['email' => 'admin@sebastiana.edu.br'],
            [
                'name' => 'Administrador Geral',
                'password' => $password,
                'role' => UserRole::ADM,
                'role_id' => $roles['admin'] ?? null,
                'status_confirmacao' => 'confirmado',
                'confirmado_em' => now(),
                'autorizado_por_id' => null,
                'comentario_admin' => 'Superusuário administrador do sistema',
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        $adminId = $admin->id;
        $admin->registrarVinculoEscolar($adminId, 'Superusuário administrador do sistema');

        // 2. Especialista / Gestão Acadêmica e Conteúdo (Nível 2)
        $clara = User::updateOrCreate(
            ['email' => 'clara.mendes@sebastiana.edu.br'],
            [
                'name' => 'Clara Mendes',
                'password' => $password,
                'role' => UserRole::ESPECIALISTA,
                'role_id' => $roles['especialista'] ?? null,
                'status_confirmacao' => 'confirmado',
                'confirmado_em' => now(),
                'autorizado_por_id' => $adminId,
                'comentario_admin' => 'Especialista em Educação Básica homologada',
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );
        $clara->registrarVinculoEscolar($adminId, 'Especialista em Educação Básica homologada');

        // 3. Professores (Nível 1.2)
        $professores = [
            [
                'name' => 'Prof. Carlos Silva',
                'email' => 'carlos.silva@sebastiana.edu.br',
            ],
            [
                'name' => 'Profa. Marina Souza',
                'email' => 'marina.souza@sebastiana.edu.br',
            ],
        ];

        foreach ($professores as $prof) {
            $userProf = User::updateOrCreate(
                ['email' => $prof['email']],
                [
                    'name' => $prof['name'],
                    'password' => $password,
                    'role' => UserRole::PROFESSOR,
                    'role_id' => $roles['professor'] ?? null,
                    'status_confirmacao' => 'confirmado',
                    'confirmado_em' => now(),
                    'autorizado_por_id' => $adminId,
                    'comentario_admin' => 'Docente titular homologado',
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
            $userProf->registrarVinculoEscolar($adminId, 'Docente titular homologado');
        }

        // 4. Bibliotecária (Nível 1.3)
        $biblio = User::updateOrCreate(
            ['email' => 'bibliotecaria@sebastiana.edu.br'],
            [
                'name' => 'Helena Vasconcelos',
                'password' => $password,
                'role' => UserRole::BIBLIOTECARIA,
                'role_id' => $roles['bibliotecaria'] ?? null,
                'status_confirmacao' => 'confirmado',
                'confirmado_em' => now(),
                'autorizado_por_id' => $adminId,
                'comentario_admin' => 'Responsável pela Biblioteca Escolar',
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );
        $biblio->registrarVinculoEscolar($adminId, 'Responsável pela Biblioteca Escolar');

        // 5. Alunos Ativos Canônicos (1 aluno para cada turma ativa)
        $alunos = [
            [
                'name' => 'Yasmin Teixeira',
                'email' => 'yasmin.teixeira@aluno.mg.gov.br',
            ],
            [
                'name' => 'Pedro Santos',
                'email' => 'pedro.santos@aluno.mg.gov.br',
            ],
            [
                'name' => 'Beatriz Lima',
                'email' => 'beatriz.lima@aluno.mg.gov.br',
            ],
        ];

        foreach ($alunos as $aluno) {
            $userAluno = User::updateOrCreate(
                ['email' => $aluno['email']],
                [
                    'name' => $aluno['name'],
                    'password' => $password,
                    'role' => UserRole::ALUNO,
                    'role_id' => $roles['aluno'] ?? null,
                    'status_confirmacao' => 'confirmado',
                    'confirmado_em' => now(),
                    'autorizado_por_id' => $adminId,
                    'comentario_admin' => 'Matrícula ativa confirmada',
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
            $userAluno->registrarVinculoEscolar($adminId, 'Matrícula ativa confirmada');
        }

        // 6. Usuário Inativo (Demonstra a retenção de dados e histórico sem exclusão em cascata - Diretriz 1.3.7)
        $inativo = User::updateOrCreate(
            ['email' => 'lucas.antigo@sebastiana.edu.br'],
            [
                'name' => 'Lucas Antigo',
                'password' => $password,
                'role' => UserRole::PROFESSOR,
                'role_id' => $roles['professor'] ?? null,
                'status_confirmacao' => 'confirmado',
                'confirmado_em' => now()->subMonths(6),
                'autorizado_por_id' => $adminId,
                'comentario_admin' => 'Contrato encerrado - Vínculo inativado mantendo histórico acadêmico',
                'ativo' => false,
                'email_verified_at' => now()->subMonths(6),
            ]
        );

        $inativo->vinculos()->firstOrCreate(
            ['usuario_id' => $inativo->id],
            [
                'role_no_vinculo' => 'professor',
                'autorizado_por_id' => $adminId,
                'iniciado_em' => now()->subMonths(6),
                'encerrado_em' => now()->subMonths(1),
                'observacoes' => 'Encerramento de contrato letivo',
            ]
        );

        // 7. Usuário Pendente de Aprovação (Demonstra o fluxo da tela de espera - Diretriz 2)
        User::updateOrCreate(
            ['email' => 'gabriel.novato@aluno.mg.gov.br'],
            [
                'name' => 'Gabriel Novato',
                'password' => $password,
                'role' => UserRole::ALUNO,
                'role_id' => $roles['aluno'] ?? null,
                'status_confirmacao' => 'pendente',
                'confirmado_em' => null,
                'autorizado_por_id' => null,
                'comentario_admin' => null,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
