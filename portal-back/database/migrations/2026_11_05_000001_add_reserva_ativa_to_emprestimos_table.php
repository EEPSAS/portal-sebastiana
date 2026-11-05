<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emprestimos', function (Blueprint $table) {
            $table->boolean('reserva_ativa')->default(false);
        });

        // Empréstimos ativos antigos já baixaram o exemplar; pedidos antigos ainda não.
        DB::table('emprestimos')
            ->whereIn('status', ['aprovado', 'renovado', 'atrasado'])
            ->update(['reserva_ativa' => true]);
    }

    public function down(): void
    {
        Schema::table('emprestimos', function (Blueprint $table) {
            $table->dropColumn('reserva_ativa');
        });
    }
};
