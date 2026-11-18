<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration que cria a tabela polimórfica central de auditoria e histórico de ações.
 *
 * Papel Didático:
 * Permite registrar quem executou alterações em qualquer entidade monitorada do portal
 * (Turmas, Matrículas, Professores, Disciplinas, Ciclos, Turnos, Períodos Letivos, Usuários e Dona Nana),
 * preservando snapshot do autor mesmo se a conta for removida no futuro.
 */
return new class extends Migration
{
    /**
     * Cria a tabela `registros_acoes` e seus índices compostos de consulta rápida.
     */
    public function up(): void
    {
        Schema::create('registros_acoes', function (Blueprint $table) {
            $table->id('id_registro_acao');
            // Identificação polimórfica compatível com chaves primárias numéricas e textuais (ex.: Turno)
            $table->string('entidade_tipo', 100);
            $table->string('entidade_id', 64);
            $table->string('acao', 80);
            $table->string('descricao', 255);
            // FK anulável garante preservação da linha de auditoria mesmo após exclusão física do executor
            $table->foreignId('executado_por_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            // Snapshot imutável de identificação do executor no instante em que a ação ocorreu
            $table->string('executado_por_nome', 150);
            $table->string('executado_por_role', 40);
            $table->json('metadados')->nullable();
            $table->timestamps();

            // Índice composto acelera a busca das 5 últimas ações por entidade sem varredura completa
            $table->index(['entidade_tipo', 'entidade_id', 'created_at'], 'idx_registros_acoes_entidade_data');
            $table->index('executado_por_id', 'idx_registros_acoes_executado_por');
        });
    }

    /**
     * Remove a tabela em caso de rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('registros_acoes');
    }
};
