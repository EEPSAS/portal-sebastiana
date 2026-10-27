<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas', 'id_turma')->cascadeOnDelete();
            $table->unsignedSmallInteger('ano_letivo');
            $table->string('status', 20)->default('concluido');
            $table->timestamps();

            $table->unique(['turma_id', 'ano_letivo']);
        });

        Schema::create('horario_aulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('horario_id')->constrained('horarios')->cascadeOnDelete();
            $table->unsignedTinyInteger('dia_semana');
            $table->unsignedTinyInteger('aula_numero');
            $table->foreignId('disciplina_id')->constrained('disciplinas', 'id_disciplina')->cascadeOnDelete();
            $table->foreignId('professor_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['horario_id', 'dia_semana', 'aula_numero']);
            $table->index(['professor_id', 'dia_semana', 'aula_numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horario_aulas');
        Schema::dropIfExists('horarios');
    }
};
