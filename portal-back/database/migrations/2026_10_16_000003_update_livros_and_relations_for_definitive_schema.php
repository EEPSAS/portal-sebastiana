<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration definitiva para evolução do acervo de livros e vínculo relacional com Planos de Estudos.
 *
 * Papel Didático:
 * Garante que bancos já inicializados recebam as colunas definitivas do CSV (`codigo_livro` e `data_lancamento`)
 * e estabelece a chave estrangeira `livro_id` na tabela `plano_estudo_itens` para integridade referencial.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Adiciona colunas definitivas na tabela livros caso ainda não existam
        Schema::table('livros', function (Blueprint $table) {
            if (! Schema::hasColumn('livros', 'codigo_livro')) {
                // Código único do livro para controle de acervo e importação via CSV
                $table->string('codigo_livro', 100)->nullable()->unique()->after('id_livro');
            }

            if (! Schema::hasColumn('livros', 'data_lancamento')) {
                // Data de lançamento do exemplar conforme especificação definitiva do CSV
                $table->date('data_lancamento')->nullable()->after('editora');
            }
        });

        // Estabelece o relacionamento explícito entre itens do plano de estudo e o livro físico
        Schema::table('plano_estudo_itens', function (Blueprint $table) {
            if (! Schema::hasColumn('plano_estudo_itens', 'livro_id')) {
                // Chave estrangeira opcional: se o livro for removido do acervo, mantém o histórico com nullOnDelete
                $table->foreignId('livro_id')
                    ->nullable()
                    ->after('plano_estudo_id')
                    ->constrained('livros', 'id_livro')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plano_estudo_itens', function (Blueprint $table) {
            if (Schema::hasColumn('plano_estudo_itens', 'livro_id')) {
                $table->dropConstrainedForeignId('livro_id');
            }
        });

        Schema::table('livros', function (Blueprint $table) {
            if (Schema::hasColumn('livros', 'codigo_livro')) {
                $table->dropUnique(['codigo_livro']);
                $table->dropColumn('codigo_livro');
            }

            if (Schema::hasColumn('livros', 'data_lancamento')) {
                $table->dropColumn('data_lancamento');
            }
        });
    }
};
