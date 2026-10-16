<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Executa as alterações na tabela users para suporte ao Google OAuth.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Identificador único da conta Google (claim 'sub' do JWT)
            $table->string('google_id')->nullable()->unique()->after('id');
            // URL do avatar/foto de perfil retornado pelo Google
            $table->string('avatar')->nullable()->after('email');
            // Data de nascimento (preenchida posteriormente no perfil do usuário)
            $table->date('data_nascimento')->nullable()->after('avatar');
            // Permite nulo na senha para contas criadas via Google OAuth
            $table->string('password')->nullable()->change();
        });
    }

    /**
     * Reverte as alterações realizadas.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable(false)->change();
            $table->dropColumn(['google_id', 'avatar', 'data_nascimento']);
        });
    }
};
