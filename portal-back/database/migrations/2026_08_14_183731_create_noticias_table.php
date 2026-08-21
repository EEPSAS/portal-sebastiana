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
        Schema::create('noticias', function (Blueprint $table) {
            $table->id(); // PK
            $table->string('titulo');
            $table->text('conteudo');
            $table->string('url_foto')->nullable();
            $table->timestamp('data_publicacao')->nullable();

            // Chave Estrangeira (FK)
            $table->foreignId('autor_id')
                ->constrained('users') // Aponta para a tabela 'users' (id)
                ->onDelete('cascade'); // Se o usuário for deletado, apaga suas notícias

            $table->timestamps(); // Cria created_at e updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('noticias');
    }
};
