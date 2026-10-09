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
        Schema::create('remessas_docentes', function (Blueprint $table) {
            $table->id('id_remessa');
            $table->foreignId('professor_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->onDelete('cascade');
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');
            $table->string('tipo_dado'); // Frequência, Notas, Ambos
            $table->string('arquivo_anexo')->nullable();
            $table->dateTime('data_envio');
            $table->string('status_processamento')->default('Pendente')->index(); // Pendente, Anexado, Rejeitado
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('remessas_docentes');
    }
};
