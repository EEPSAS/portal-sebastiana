<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('noticias', function (Blueprint $table): void {
            $table->string('url_miniatura')->nullable()->after('url_foto');
        });
    }

    public function down(): void
    {
        Schema::table('noticias', function (Blueprint $table): void {
            $table->dropColumn('url_miniatura');
        });
    }
};