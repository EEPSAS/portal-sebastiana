<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para adicionar o status de confirmação escolar na tabela de usuários.
 *
 * Papel Didático:
 * O login via Google OAuth aceita qualquer e-mail @educacao.mg.gov.br.
 * Esta coluna assegura que apenas professores validados pelo Especialista
 * da EEPSAS tenham acesso ao ambiente acadêmico da instituição.
 */
return new class extends Migration
{
    /**
     * Aplica as alterações no banco de dados.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Status de confirmação: 'pendente', 'confirmado' ou 'rejeitado'
            // O valor padrão 'confirmado' preserva o acesso dos usuários previamente cadastrados (seeders/adm)
            $table->string('status_confirmacao')->default('confirmado')->index()->after('ativo');

            // Data e hora em que a confirmação foi realizada pelo Especialista
            $table->timestamp('confirmado_em')->nullable()->after('status_confirmacao');
        });
    }

    /**
     * Reverte as alterações no banco de dados.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status_confirmacao', 'confirmado_em']);
        });
    }
};
