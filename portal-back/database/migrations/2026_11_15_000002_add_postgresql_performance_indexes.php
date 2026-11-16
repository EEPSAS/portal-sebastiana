<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration de índices de alta performance voltada para o PostgreSQL.
 *
 * Papel Didático:
 * Cria índices compostos B-Tree alinhados com as cláusulas WHERE, JOIN e ORDER BY
 * mais executadas da API, eliminando Sequential Scans (Seq Scan) e ordenações
 * em disco (filesort) nas tabelas críticas.
 */
return new class extends Migration
{
    /**
     * Adiciona os índices compostos nas tabelas de leitura intensiva.
     */
    public function up(): void
    {
        // Acelera a listagem pública da Home (NoticiaController::index) ordenada por destaque e data
        Schema::table('noticias', function (Blueprint $table) {
            $table->index(['destaque', 'dataPublicacao', 'created_at'], 'idx_noticias_destaque_data');
        });

        // Acelera filtros por papel institucional e ordenação alfabética em listagens de usuários/alunos
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'name'], 'idx_users_role_name');
        });

        // Acelera a ordenação cronológica e o filtro por categoria na agenda escolar (EventoController::index)
        Schema::table('eventos', function (Blueprint $table) {
            $table->index(['data_inicio', 'hora_inicio'], 'idx_eventos_data_hora');
            $table->index('tipo', 'idx_eventos_tipo');
        });

        // Acelera a consulta do sino de notificações não lidas (NotificacaoController::index)
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id', 'read_at', 'created_at'], 'idx_notifications_unread_recent');
        });

        // Acelera filtros de notas por turma e período letivo sem depender de disciplina_id intermediário
        Schema::table('notas', function (Blueprint $table) {
            $table->index(['turma_id', 'periodo_letivo'], 'idx_notas_turma_periodo');
        });

        // Acelera agregações de faltas por turma, estudante e disciplina no boletim e painel gerencial
        Schema::table('frequencias', function (Blueprint $table) {
            $table->index(['turma_id', 'usuario_id', 'disciplina_id'], 'idx_frequencias_turma_usuario_disc');
        });
    }

    /**
     * Remove os índices criados em caso de rollback da migration.
     */
    public function down(): void
    {
        Schema::table('frequencias', function (Blueprint $table) {
            $table->dropIndex('idx_frequencias_turma_usuario_disc');
        });

        Schema::table('notas', function (Blueprint $table) {
            $table->dropIndex('idx_notas_turma_periodo');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_unread_recent');
        });

        Schema::table('eventos', function (Blueprint $table) {
            $table->dropIndex('idx_eventos_data_hora');
            $table->dropIndex('idx_eventos_tipo');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_name');
        });

        Schema::table('noticias', function (Blueprint $table) {
            $table->dropIndex('idx_noticias_destaque_data');
        });
    }
};
