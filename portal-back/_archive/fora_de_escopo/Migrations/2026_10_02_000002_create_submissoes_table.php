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
        Schema::create('submissoes', function (Blueprint $table) {
            $table->id('id_submissao');
            $table->foreignId('atividade_id')
                ->constrained('atividades', 'id_atividade')
                ->onDelete('cascade');
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade'); // Aluno
            $table->dateTime('data_envio')->useCurrent();
            $table->text('texto_resposta')->nullable();
            $table->string('caminho_arquivo_entregue')->nullable();
            $table->decimal('nota_atribuida', 5, 2)->nullable();
            $table->text('feedback_comentario_professor')->nullable();
            $table->timestamps();

            $table->unique(['atividade_id', 'usuario_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissoes');
    }
};
