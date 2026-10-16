<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration responsável por criar a tabela 'planos_estudos'.
 *
 * Papel Didático:
 * Armazena as trilhas e planos de estudos individuais criados pelos usuários (alunos/professores),
 * organizados por disciplina e com status de ativação.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('planos_estudos', function (Blueprint $table) {
            $table->id();
            // Usuário proprietário do plano (aluno, professor, etc.) com deleção em cascata
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // Identificação e escopo do plano
            $table->string('nome');
            $table->string('disciplina');
            $table->text('descricao')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planos_estudos');
    }
};
