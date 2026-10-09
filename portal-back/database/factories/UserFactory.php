<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    // Cache da senha criptografada para otimizar a geracao em lote
    protected static ?string $password;

    // Define os valores padrao dos campos ao criar usuarios ficticios
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::ALUNO,
            'role_id' => null,
            'ativo' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function ($user) {
            if (! $user->role_id && class_exists(Role::class)) {
                $roleSlug = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
                if ($roleSlug === 'padrao') {
                    $roleSlug = 'aluno';
                }
                if ($roleSlug === 'adm') {
                    $roleSlug = 'admin';
                }
                $role = Role::where('slug', $roleSlug)->first();
                if ($role) {
                    $user->role_id = $role->id;
                }
            }
        });
    }

    // Estado para gerar usuario com e-mail ainda nao verificado
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    // Estado para gerar usuario com papel de especialista
    public function especialista(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ESPECIALISTA,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'especialista')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario com papel de professor
    public function professor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::PROFESSOR,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'professor')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario com papel de bibliotecaria
    public function bibliotecaria(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::BIBLIOTECARIA,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'bibliotecaria')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario com papel de aluno
    public function aluno(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ALUNO,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'aluno')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario com papel de administrador (ADM)
    public function adm(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ADM,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'admin')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario com papel padrao explicitamente
    public function padrao(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::PADRAO,
            'role_id' => class_exists(Role::class) ? Role::where('slug', 'aluno')->value('id') : null,
        ]);
    }

    // Estado para gerar usuario inativo/bloqueado
    public function bloqueado(): static
    {
        return $this->state(fn (array $attributes) => [
            'ativo' => false,
        ]);
    }
}
