<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Executa as migrações para a tabela de Turnos de Funcionamento e Módulos Escolares.
     */
    public function up(): void
    {
        Schema::create('turnos', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // 'Matutino', 'Vespertino', 'Noturno', 'Integral'
            $table->string('nome', 50);
            $table->string('hora_inicio', 5); // '07:00'
            $table->string('hora_fim', 5);    // '12:15'
            $table->unsignedSmallInteger('duracao_aula_minutos')->default(50);
            $table->string('intervalo_inicio', 5)->nullable(); // '09:30'
            $table->string('intervalo_fim', 5)->nullable();    // '09:56'
            $table->unsignedTinyInteger('quantidade_aulas')->default(5);
            $table->boolean('ativo')->default(true);
            $table->string('descricao')->nullable();
            $table->string('icone', 50)->default('bi-sun-fill');
            $table->string('cor', 30)->default('warning');
            $table->json('grade_horarios')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverte as migrações.
     */
    public function down(): void
    {
        Schema::dropIfExists('turnos');
    }
};
