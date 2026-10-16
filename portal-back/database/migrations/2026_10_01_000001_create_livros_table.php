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
        // Criação da tabela definitiva do acervo de livros físicos da biblioteca
        Schema::create('livros', function (Blueprint $table) {
            $table->id('id_livro');
            // Código identificador único do exemplar no acervo escolar (ex: LIV-0001)
            $table->string('codigo_livro', 100)->nullable()->unique();
            $table->string('titulo')->index();
            $table->string('capa')->nullable();
            $table->string('autor')->index();
            $table->string('editora')->nullable();
            // Data de lançamento oficial da obra (com suporte a data_publicacao para compatibilidade)
            $table->date('data_lancamento')->nullable();
            $table->date('data_publicacao')->nullable();
            $table->string('prateleira_localizacao')->nullable();
            $table->string('genero')->nullable()->index();
            $table->unsignedInteger('quantidade_total')->default(1);
            $table->unsignedInteger('quantidade_disponivel')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livros');
    }
};
