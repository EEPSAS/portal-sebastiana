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

        $roleAdmin = Role::where('slug', 'admin')->first();
        $roleEspecialista = Role::where('slug', 'especialista')->first();
        $roleProfessor = Role::where('slug', 'professor')->first();
        $roleBibliotecaria = Role::where('slug', 'bibliotecaria')->first();
        $roleAluno = Role::where('slug', 'aluno')->first();

        // 1. Administrador Geral (Nível 3)
        User::updateOrCreate(
            ['email' => 'admin@sebastiana.edu.br'],
            [
                'name' => 'Administrador Geral',
                'password' => $password,
                'role' => UserRole::ADM,
                'role_id' => $roleAdmin?->id,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Especialista / Editor (Nível 2)
        User::updateOrCreate(
            ['email' => 'especialista@sebastiana.edu.br'],
            [
                'name' => 'Especialista de Conteúdo',
                'password' => $password,
                'role' => UserRole::ESPECIALISTA,
                'role_id' => $roleEspecialista?->id,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Professores (Nível 1 - Docência)
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
        ];

        foreach ($professores as $prof) {
            User::updateOrCreate(
                ['email' => $prof['email']],
                [
                    'name' => $prof['name'],
                    'password' => $password,
                    'role' => UserRole::PROFESSOR,
                    'role_id' => $roleProfessor?->id,
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
        }

        // 4. Bibliotecária (Nível 1 - Gestão da Biblioteca)
        User::updateOrCreate(
            ['email' => 'bibliotecaria@sebastiana.edu.br'],
            [
                'name' => 'Ana Bibliotecária',
                'password' => $password,
                'role' => UserRole::BIBLIOTECARIA,
                'role_id' => $roleBibliotecaria?->id,
                'ativo' => true,
                'email_verified_at' => now(),
            ]
        );

        // 5. Alunos (Nível 1 - Consumo e Discente)
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
        ];

        foreach ($alunos as $aluno) {
            User::updateOrCreate(
                ['email' => $aluno['email']],
                [
                    'name' => $aluno['name'],
                    'password' => $password,
                    'role' => UserRole::ALUNO,
                    'role_id' => $roleAluno?->id,
                    'ativo' => true,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
