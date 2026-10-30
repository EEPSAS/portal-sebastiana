<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para criação das tabelas de Gestão do Período Letivo
 *
 * Papel Didático:
 * 1. `periodos_letivos`: Guarda o ano letivo, a regra de divisão (Bimestre, Trimestre ou Semestre),
 *    a pontuação máxima total do ano (ex: 100 pontos), o intervalo geral e o status de vigência (ativo).
 * 2. `periodo_letivo_divisoes`: Guarda cada etapa avaliativa filha (ex: 1º Trimestre), com seu peso
 *    individual em pontos e suas datas de início e encerramento.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('periodos_letivos', function (Blueprint $table) {
            $table->id('id_periodo_letivo');
            $table->unsignedSmallInteger('ano')->unique();
            $table->string('tipo_divisao'); // 'bimestre', 'trimestre', 'semestre'
            $table->decimal('total_pontos', 5, 2)->default(100.00);
            $table->date('data_inicio');
            $table->date('data_fim');
            $table->boolean('ativo')->default(false)->index();
            $table->string('status')->default('planejado'); // 'planejado', 'em_andamento', 'encerrado'
            $table->timestamps();
        });

        Schema::create('periodo_letivo_divisoes', function (Blueprint $table) {
            $table->id('id_divisao');
            $table->foreignId('periodo_letivo_id')
                ->constrained('periodos_letivos', 'id_periodo_letivo')
                ->onDelete('cascade');
            $table->unsignedTinyInteger('numero'); // 1, 2, 3, 4
            $table->string('nome'); // Ex: '1º Trimestre', '2º Bimestre'
            $table->decimal('pontos', 5, 2); // Ex: 30.00, 35.00
            $table->date('data_inicio');
            $table->date('data_fim');
            $table->unsignedTinyInteger('ordem')->default(1);
            $table->timestamps();

            $table->index(['periodo_letivo_id', 'ordem']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periodo_letivo_divisoes');
        Schema::dropIfExists('periodos_letivos');
    }
};
