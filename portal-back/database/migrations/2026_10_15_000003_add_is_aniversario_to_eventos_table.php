<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona a flag is_aniversario na tabela eventos para sincronização de aniversários.
     */
    public function up(): void
    {
        Schema::table('eventos', function (Blueprint $table) {
            // Flag que identifica se o evento representa o aniversário do criador
            $table->boolean('is_aniversario')->default(false)->after('importante')->index();
        });
    }

    /**
     * Reverte as alterações realizadas.
     */
    public function down(): void
    {
        Schema::table('eventos', function (Blueprint $table) {
            $table->dropColumn('is_aniversario');
        });
    }
};
