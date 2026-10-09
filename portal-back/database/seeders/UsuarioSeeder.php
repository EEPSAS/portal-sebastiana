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
            [
                'name' => 'Prof. Lucas Mendes',
                'email' => 'lucas.mendes@sebastiana.edu.br',
            ],
            [
                'name' => 'Profa. Helena Castro',
                'email' => 'helena.castro@sebastiana.edu.br',
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

        // 5. Alunos (Nível 1.1)
        $alunos = [
            [
                'name' => 'Yasmin Teixeira',
                'email' => 'yasmin.teixeira@sebastiana.edu.br',
            ],
            [
                'name' => 'Pedro Santos',
                'email' => 'pedro.santos@sebastiana.edu.br',
            ],
            [
                'name' => 'Beatriz Lima',
                'email' => 'beatriz.lima@sebastiana.edu.br',
            ],
            [
                'name' => 'Gabriel Costa',
                'email' => 'gabriel.costa@sebastiana.edu.br',
            ],
            [
                'name' => 'Camila Alves',
                'email' => 'camila.alves@sebastiana.edu.br',
            ],
            [
                'name' => 'Lucas Rocha',
                'email' => 'lucas.rocha@sebastiana.edu.br',
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
