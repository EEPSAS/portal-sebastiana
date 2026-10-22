<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para criação da tabela pivô entre disciplinas e professores responsáveis.
 *
 * Papel Didático:
 * Conforme decisão do usuário, o Especialista vincula o Professor diretamente à Disciplina.
 * Essa relação direta permite que o docente responda por essa matéria curricular em todas
 * as turmas ativas onde a disciplina é lecionada.
 */
return new class extends Migration
{
    /**
     * Aplica as alterações no banco de dados.
     */
    public function up(): void
    {
        Schema::create('disciplina_professores', function (Blueprint $table) {
            $table->id();

            // Chave estrangeira da disciplina curricular
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');

            // Chave estrangeira do usuário docente
            $table->foreignId('professor_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');

            $table->timestamps();

            // Garante unicidade: cada professor só pode ser vinculado uma vez à mesma disciplina
            $table->unique(['disciplina_id', 'professor_id']);
        });
    }

    /**
     * Reverte as alterações no banco de dados.
     */
    public function down(): void
    {
        Schema::dropIfExists('disciplina_professores');
    }
};
