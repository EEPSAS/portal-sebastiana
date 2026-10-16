<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration responsável por criar a tabela 'plano_estudo_itens'.
 *
 * Papel Didático:
 * Armazena as referências aos conteúdos associados a cada plano:
 * - Livros do acervo
 * - Videoaulas do YouTube
 * - Conteúdos didáticos e pesquisas web (Google Books)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plano_estudo_itens', function (Blueprint $table) {
            $table->id();
            // Vinculação com o plano pai com deleção em cascata
            $table->foreignId('plano_estudo_id')->constrained('planos_estudos')->cascadeOnDelete();
            // Tipo de material: livro, videoaula, conteudo_web
            $table->enum('tipo', ['livro', 'videoaula', 'conteudo_web']);
            // Identificador original do conteúdo no serviço de origem (id livro, videoId youtube, volumeId google books)
            $table->string('conteudo_id')->nullable();
            // Informações bibliográficas e metadados persistidos
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->text('url')->nullable();
            $table->text('thumbnail')->nullable();
            $table->string('fonte')->nullable();
            $table->string('duracao')->nullable();
            $table->timestamps();

            // Índices para otimizar buscas por plano e evitar lentidão
            $table->index(['plano_estudo_id', 'tipo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plano_estudo_itens');
    }
};
