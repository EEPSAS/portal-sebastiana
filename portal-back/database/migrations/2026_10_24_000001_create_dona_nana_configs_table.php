<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para a tabela de configuração da persona da Dona Nana.
 *
 * Papel Didático:
 * Centraliza os 4 campos pedagógicos que compõem dinamicamente o System Prompt
 * enviado ao modelo de inteligência artificial (Gemini 3.8 Flash), além de parâmetros
 * como modelo, temperatura e placeholder do avatar institucional.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dona_nana_configs', function (Blueprint $table) {
            $table->id();

            // 1. Sua Personalidade (tom professoral, afeto, acolhimento)
            $table->text('personalidade');

            // 2. Seu Conhecimento sobre o Portal (regras de navegação e módulos)
            $table->text('conhecimento_portal');

            // 3. Suas Histórias e Causos (memórias da patrona e de Jaguaraçu)
            $table->text('historias_causos');

            // 4. Diretrizes de Resposta (limites pedagógicos e incentivo ao estudo)
            $table->text('diretrizes_resposta');

            // URL do avatar personalizado (com suporte a placeholder e nulo)
            $table->string('avatar_url', 500)->nullable();

            // Parâmetros técnicos do modelo de linguagem
            $table->string('modelo', 50)->default('gemini-3.8-flash');
            $table->decimal('temperatura', 3, 2)->default(0.70);

            // Flag que indica se esta configuração está ativa para o sistema
            $table->boolean('ativo')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dona_nana_configs');
    }
};
