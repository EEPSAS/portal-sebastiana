<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('atividades', function (Blueprint $table) {
            $table->id('id_atividade');
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->onDelete('cascade');
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade'); // Professor autor
            $table->string('titulo');
            $table->text('descricao_texto');
            $table->string('caminho_arquivo_anexo')->nullable();
            $table->dateTime('data_criacao')->useCurrent();
            $table->dateTime('data_limite_entrega');
            $table->decimal('valor_pontuacao', 5, 2)->nullable();
            $table->string('status_atividade')->default('Aberta')->index(); // Aberta, Encerrada
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('atividades');
    }
};
