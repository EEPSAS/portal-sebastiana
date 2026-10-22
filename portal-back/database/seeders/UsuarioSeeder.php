<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
        User::updateOrCreate(
            ['email' => 'admin@sebastiana.edu.br'],
            [
                'name' => 'Administrador Geral',
                'password' => $password,
                'role' => UserRole::ADM,
                'role_id' => $roles['admin'] ?? null,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Especialista / Gestão Acadêmica e Conteúdo (Nível 2)
        User::updateOrCreate(
            ['email' => 'clara.mendes@sebastiana.edu.br'],
            [
                'name' => 'Clara Mendes',
                'password' => $password,
                'role' => UserRole::ESPECIALISTA,
                'role_id' => $roles['especialista'] ?? null,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

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
            User::updateOrCreate(
                ['email' => $prof['email']],
                [
                    'name' => $prof['name'],
                    'password' => $password,
                    'role' => UserRole::PROFESSOR,
                    'role_id' => $roles['professor'] ?? null,
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
        }

        // 4. Bibliotecária (Nível 1.3)
        User::updateOrCreate(
            ['email' => 'bibliotecaria@sebastiana.edu.br'],
            [
                'name' => 'Helena Vasconcelos',
                'password' => $password,
                'role' => UserRole::BIBLIOTECARIA,
                'role_id' => $roles['bibliotecaria'] ?? null,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        // 5. Alunos (Nível 1.1 - 1 aluno para cada uma das 3 turmas ativas)
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
            User::updateOrCreate(
                ['email' => $aluno['email']],
                [
                    'name' => $aluno['name'],
                    'password' => $password,
                    'role' => UserRole::ALUNO,
                    'role_id' => $roles['aluno'] ?? null,
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
