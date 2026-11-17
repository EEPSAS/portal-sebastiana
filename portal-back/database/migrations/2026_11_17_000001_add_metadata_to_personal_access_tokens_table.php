<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona colunas de auditoria e origem de sessão na tabela de tokens Sanctum.
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Identifica o fluxo de autenticação que gerou o token (login_senha, login_google, auto_cadastro)
            $table->string('origem', 50)->default('login_senha')->index()->after('name');
            // Armazena o IP de origem da requisição no momento do login
            $table->string('ip_address', 45)->nullable()->after('origem');
            // Armazena o User-Agent do navegador/dispositivo conectado
            $table->text('user_agent')->nullable()->after('ip_address');
        });
    }

    /**
     * Reverte as colunas de metadados da tabela de tokens Sanctum.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['origem', 'ip_address', 'user_agent']);
        });
    }
};
