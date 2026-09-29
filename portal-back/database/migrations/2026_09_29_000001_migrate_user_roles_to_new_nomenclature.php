<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration de DADOS — atualiza os valores da coluna 'role' na tabela 'users'
 * para refletir a nova nomenclatura de roles do sistema.
 *
 * Substituições:
 *   'editor'         → 'especialista'
 *   'administrador'  → 'adm'
 *   'user'           → 'padrao'  (corrige registros com o default inválido anterior)
 *
 * NÃO altera o schema da tabela — apenas os dados existentes.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'editor')->update(['role' => 'especialista']);
        DB::table('users')->where('role', 'administrador')->update(['role' => 'adm']);
        // Corrige eventuais registros com o default inválido 'user'
        DB::table('users')->where('role', 'user')->update(['role' => 'padrao']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'especialista')->update(['role' => 'editor']);
        DB::table('users')->where('role', 'adm')->update(['role' => 'administrador']);
        DB::table('users')->where('role', 'padrao')->update(['role' => 'user']);
    }
};
