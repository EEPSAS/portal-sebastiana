<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Converte registros antigos com status 'aprovado' para 'entregue',
     * refletindo a posse física do exemplar pelo estudante no balcão da biblioteca.
     */
    public function up(): void
    {
        DB::table('emprestimos')
            ->where('status', 'aprovado')
            ->update([
                'status' => 'entregue',
                'reserva_ativa' => true,
            ]);
    }

    /**
     * Reverte o valor para 'aprovado' em caso de rollback.
     */
    public function down(): void
    {
        DB::table('emprestimos')
            ->where('status', 'entregue')
            ->update(['status' => 'aprovado']);
    }
};

