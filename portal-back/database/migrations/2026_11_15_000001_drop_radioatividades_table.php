<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration responsável por remover a tabela legada 'radioatividades'.
 *
 * Papel Didático:
 * O módulo Radioatividade (podcast escolar) tornou-se estático no portal público
 * (alimentado diretamente por links externos no frontend), eliminando a necessidade
 * de persistência ou endpoints no backend.
 */
return new class extends Migration
{
    /**
     * Executa a remoção segura da tabela caso ela exista no banco.
     */
    public function up(): void
    {
        Schema::dropIfExists('radioatividades');
    }

    /**
     * Recria a estrutura original caso seja necessário reverter a migration (rollback).
     */
    public function down(): void
    {
        Schema::create('radioatividades', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descricao');
            $table->string('imagem');
            $table->time('duracao');
            $table->timestamps();
        });
    }
};
