<?php

use App\Enums\TipoEvento;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Executa as alterações na tabela de eventos.
     */
    public function up(): void
    {
        // 1. Converte tipos legados 'Datas Comemorativas' para 'Eventos'
        DB::table('eventos')
            ->whereIn(DB::raw('LOWER(tipo)'), [
                'datas comemorativas',
                'datas_comemorativas',
                'data comemorativa',
                'data_importante',
            ])
            ->update(['tipo' => TipoEvento::EVENTOS->value]);

        // 2. Remove as colunas obsoletas: hora_fim, dia_inteiro e cor
        Schema::table('eventos', function (Blueprint $table) {
            $table->dropColumn(['hora_fim', 'dia_inteiro', 'cor']);
        });
    }

    /**
     * Reverte as alterações recriando as colunas removidas.
     */
    public function down(): void
    {
        Schema::table('eventos', function (Blueprint $table) {
            $table->time('hora_fim')->nullable()->after('hora_inicio');
            $table->boolean('dia_inteiro')->default(false)->after('hora_fim');
            $table->string('cor', 30)->nullable()->after('local');
        });
    }
};
