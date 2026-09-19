<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('noticias', function (Blueprint $table): void {
            $table->text('descricao')->nullable()->after('titulo');
            $table->string('categoria', 100)->nullable()->after('conteudo');
            $table->boolean('destaque')->default(false)->index()->after('data_publicacao');
        });
    }

    public function down(): void
    {
        Schema::table('noticias', function (Blueprint $table): void {
            $table->dropColumn(['descricao', 'categoria', 'destaque']);
        });
    }
};