<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona os campos nickname e telefone na tabela users.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Nome preferido / apelido do usuário
            $table->string('nickname')->nullable()->after('name');
            // Número de telefone para contato
            $table->string('telefone', 20)->nullable()->after('email');
        });
    }

    /**
     * Reverte as alterações realizadas.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nickname', 'telefone']);
        });
    }
};
