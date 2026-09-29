<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
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
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'role'              => UserRole::PADRAO,
            'remember_token'    => Str::random(10),
        ];
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
        ]);
    }

    // Estado para gerar usuario com papel de administrador (ADM)
    public function adm(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ADM,
        ]);
    }

    // Estado para gerar usuario com papel padrao explicitamente
    public function padrao(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::PADRAO,
        ]);
    }
}