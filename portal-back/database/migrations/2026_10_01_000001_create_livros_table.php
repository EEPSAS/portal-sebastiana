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
        Schema::create('livros', function (Blueprint $table) {
            $table->id('id_livro');
            $table->string('titulo')->index();
            $table->string('capa')->nullable();
            $table->string('autor')->index();
            $table->string('editora')->nullable();
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
