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
        Schema::create('turma_disciplinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')
                ->constrained('turmas', 'id_turma')
                ->onDelete('cascade');
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');
            $table->foreignId('professor_id')
                ->nullable()
                ->constrained('users', 'id')
                ->onDelete('set null');
            $table->timestamps();

            $table->unique(['turma_id', 'disciplina_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turma_disciplinas');
    }
};
