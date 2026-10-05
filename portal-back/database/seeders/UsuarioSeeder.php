<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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

        // 1. Administrador Geral
        User::firstOrCreate(
            ['email' => 'admin@sebastiana.edu.br'],
            [
                'name' => 'Administrador Geral',
                'password' => $password,
                'role' => UserRole::ADM,
                'email_verified_at' => now(),
            ]
        );

        // 2. Especialistas / Professores
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
            User::firstOrCreate(
                ['email' => $prof['email']],
                [
                    'name' => $prof['name'],
                    'password' => $password,
                    'role' => UserRole::ESPECIALISTA,
                    'email_verified_at' => now(),
                ]
            );
        }

        // 3. Usuários Padrão / Alunos
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
            User::firstOrCreate(
                ['email' => $aluno['email']],
                [
                    'name' => $aluno['name'],
                    'password' => $password,
                    'role' => UserRole::PADRAO,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
