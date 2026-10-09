<?php

use App\Enums\TipoEvento;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normaliza valores legados/slugs para os valores canônicos do enum TipoEvento
        DB::table('eventos')
            ->whereIn(DB::raw('LOWER(tipo)'), ['evento', 'eventos', 'reuniao', 'reunião', 'reunioes', 'reuniões'])
            ->update(['tipo' => TipoEvento::EVENTOS->value]);

        DB::table('eventos')
            ->whereIn(DB::raw('LOWER(tipo)'), ['prova', 'provas', 'provas e trabalhos', 'provas_e_trabalhos'])
            ->update(['tipo' => TipoEvento::PROVAS_E_TRABALHOS->value]);

        DB::table('eventos')
            ->whereIn(DB::raw('LOWER(tipo)'), ['data_importante', 'data comemorativa', 'datas comemorativas', 'datas_comemorativas'])
            ->update(['tipo' => TipoEvento::DATAS_COMEMORATIVAS->value]);

        DB::table('eventos')
            ->whereIn(DB::raw('LOWER(tipo)'), ['feriado', 'feriados', 'feriados e recessos', 'feriados_e_recessos'])
            ->update(['tipo' => TipoEvento::FERIADOS_E_RECESSOS->value]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Operação unidirecional de higienização de dados
    }
};
