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
        Schema::create('frequencias', function (Blueprint $table) {
            $table->id('id_frequencia');
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->onDelete('cascade');
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');
            $table->date('data_aula')->index();
            $table->unsignedTinyInteger('quantidade_aulas')->default(1);
            $table->string('status_presenca')->default('Presente')->index(); // Presente, Falta, Falta Justificada
            $table->foreignId('remessa_origem_id')
                ->nullable()
                ->constrained('remessas_docentes', 'id_remessa')
                ->onDelete('set null');
            $table->text('justificativa')->nullable();
            $table->timestamps();

            $table->index(['turma_id', 'disciplina_id', 'data_aula']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('frequencias');
    }
};
