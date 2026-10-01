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
        Schema::create('turmas', function (Blueprint $table) {
            $table->id('id_turma');
            $table->string('nome_identificador')->index();
            $table->string('turno'); // Manhã, Tarde, Noite, Integral
            $table->unsignedSmallInteger('ano_letivo')->index();
            $table->unsignedSmallInteger('capacidade_maxima')->default(40);
            $table->string('status')->default('Ativa')->index(); // Ativa, Concluída
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turmas');
    }
};
