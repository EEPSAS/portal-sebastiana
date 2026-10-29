<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para adicionar os campos 'disciplina_id' e 'conteudo' na tabela 'planos_estudos'.
 *
 * Papel Didático:
 * - 'disciplina_id': Chave estrangeira que conecta formalmente o plano de estudos à
 *   disciplina curricular cadastrada no sistema.
 * - 'conteudo': Permite registrar tópicos ou ementas específicas (ex.: 'Informática',
 *   'Inglês', 'Equações de 2º Grau') com escolha assistida ou digitação livre.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('planos_estudos', function (Blueprint $table) {
            // Relacionamento com a tabela de disciplinas curriculares da escola
            $table->unsignedBigInteger('disciplina_id')->nullable()->after('user_id');
            // Campo de conteúdo ou ementa temática do plano
            $table->string('conteudo', 150)->nullable()->after('disciplina');

            // Chave estrangeira com anulação em caso de exclusão da disciplina
            $table->foreign('disciplina_id')
                ->references('id_disciplina')
                ->on('disciplinas')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('planos_estudos', function (Blueprint $table) {
            $table->dropForeign(['disciplina_id']);
            $table->dropColumn(['disciplina_id', 'conteudo']);
        });
    }
};
