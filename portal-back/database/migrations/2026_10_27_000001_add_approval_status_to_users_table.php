<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('approval_status')->default('approved')->after('ativo');
        });

        // Contas já existentes de alunos e professores também aguardam validação do Especialista.
        DB::table('users')
            ->whereIn('role', ['aluno', 'padrao', 'professor'])
            ->update(['approval_status' => 'pending']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('approval_status');
        });
    }
};
