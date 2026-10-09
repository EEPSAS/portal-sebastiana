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
        Schema::create('matriculas', function (Blueprint $table) {
            $table->id('id_matricula');
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->onDelete('cascade');
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');
            $table->date('data_matricula');
            $table->string('status_matricula')->default('Ativo')->index(); // Ativo, Transferido, Evadido
            $table->timestamps();

            $table->unique(['turma_id', 'usuario_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriculas');
    }
};
