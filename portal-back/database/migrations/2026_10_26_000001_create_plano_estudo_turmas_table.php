<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration responsável por criar a tabela pivot 'plano_estudo_turmas'.
 *
 * Papel Didático:
 * Permite que professores compartilhem seus planos de estudos com uma ou mais
 * turmas escolares (1º, 2º ou 3º ano), tornando essas trilhas visíveis para os
 * alunos matriculados nas respectivas turmas.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plano_estudo_turmas', function (Blueprint $table) {
            $table->id();
            // Referência ao plano de estudos compartilhado pelo professor
            $table->foreignId('plano_estudo_id')
                ->constrained('planos_estudos')
                ->cascadeOnDelete();
            // Referência à turma escolar destinatária (chave primária id_turma)
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->cascadeOnDelete();
            $table->timestamps();

            // Impede compartilhamento duplicado do mesmo plano para a mesma turma
            $table->unique(['plano_estudo_id', 'turma_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plano_estudo_turmas');
    }
};
