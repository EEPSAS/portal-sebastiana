<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adiciona suporte a múltiplas pausas operacionais (intervalos e almoço) na tabela turnos.
     */
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->json('pausas')->nullable()->after('quantidade_aulas');
        });
    }

    /**
     * Reverte a adição da coluna pausas.
     */
    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn('pausas');
        });
    }
};
