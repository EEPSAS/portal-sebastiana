<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration para estruturar o histórico de vínculos de usuários, os Ciclos Escolares
 * e os novos campos pedagógicos do módulo de Disciplinas (Diretrizes 28/10/2026).
 */
return new class extends Migration
{
    /**
     * Aplica as alterações estruturais no banco de dados.
     */
    public function up(): void
    {
        // 1. Adiciona auditoria de aprovação e observação administrativa na tabela de usuários
        Schema::table('users', function (Blueprint $table) {
            // Identifica qual Especialista ou Administrador autorizou/vinculou o usuário
            $table->foreignId('autorizado_por_id')
                ->nullable()
                ->after('confirmado_em')
                ->constrained('users', 'id')
                ->nullOnDelete();

            // Comentário/observação administrativa registrada na gestão de usuários (Item 1.3.8)
            $table->text('comentario_admin')->nullable()->after('autorizado_por_id');
        });

        // 2. Cria a tabela de histórico de vínculos do usuário com a escola (Itens 1.3.6 e 1.3.7)
        Schema::create('usuario_vinculos', function (Blueprint $table) {
            $table->id('id_vinculo');

            // Usuário vinculado à instituição
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');

            // Papel exercido neste ciclo de vínculo (aluno, professor, especialista, etc.)
            $table->string('role_no_vinculo')->index();

            // Gestor responsável por autorizar a entrada/vínculo
            $table->foreignId('autorizado_por_id')
                ->nullable()
                ->constrained('users', 'id')
                ->nullOnDelete();

            // Datas de início e eventual encerramento (desvínculo sem perda de histórico)
            $table->timestamp('iniciado_em')->nullable();
            $table->timestamp('encerrado_em')->nullable();

            // Administrador que encerrou o vínculo (quando inativado via Controle de Usuários)
            $table->foreignId('encerrado_por_id')
                ->nullable()
                ->constrained('users', 'id')
                ->nullOnDelete();

            $table->text('observacoes')->nullable();
            $table->timestamps();
        });

        // 3. Cria a tabela de Ciclos Escolares (ex: 1º Ano, 2º Ano, 3º Ano - Item 3.1)
        Schema::create('ciclos', function (Blueprint $table) {
            $table->id('id_ciclo');
            $table->string('nome')->unique();
            $table->text('descricao')->nullable();
            $table->timestamps();
        });

        // 4. Expande a tabela de Disciplinas com aulas semanais e campos pedagógicos (Item 3.3)
        Schema::table('disciplinas', function (Blueprint $table) {
            // Quantidade obrigatória de aulas semanais (base para calcular carga_horaria_anual = aulas_semanais * 40)
            $table->unsignedTinyInteger('aulas_semanais')->default(2)->after('nome');

            // Campos pedagógicos opcionais (Ementa, Habilidades BNCC, Objetivos Geral e Específico)
            $table->text('ementa')->nullable()->after('descricao');
            $table->text('habilidades_bncc')->nullable()->after('ementa');
            $table->text('objetivo_geral')->nullable()->after('habilidades_bncc');
            $table->text('objetivo_especifico')->nullable()->after('objetivo_geral');
        });

        // 5. Cria a tabela pivô N:N entre Ciclos e Disciplinas (Item 3.2)
        Schema::create('ciclo_disciplinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciclo_id')
                ->constrained('ciclos', 'id_ciclo')
                ->onDelete('cascade');
            $table->foreignId('disciplina_id')
                ->constrained('disciplinas', 'id_disciplina')
                ->onDelete('cascade');
            $table->timestamps();

            $table->unique(['ciclo_id', 'disciplina_id']);
        });

        // 6. Vincula cada Turma a um Ciclo Escolar para herança automática de disciplinas (Item 3.2a)
        Schema::table('turmas', function (Blueprint $table) {
            $table->foreignId('ciclo_id')
                ->nullable()
                ->after('nome_identificador')
                ->constrained('ciclos', 'id_ciclo')
                ->nullOnDelete();
        });
    }

    /**
     * Reverte as alterações estruturais no banco de dados.
     */
    public function down(): void
    {
        Schema::table('turmas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ciclo_id');
        });

        Schema::dropIfExists('ciclo_disciplinas');

        Schema::table('disciplinas', function (Blueprint $table) {
            $table->dropColumn([
                'aulas_semanais',
                'ementa',
                'habilidades_bncc',
                'objetivo_geral',
                'objetivo_especifico',
            ]);
        });

        Schema::dropIfExists('ciclos');
        Schema::dropIfExists('usuario_vinculos');

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('autorizado_por_id');
            $table->dropColumn('comentario_admin');
        });
    }
};
