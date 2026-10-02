<?php

use App\Enums\EmprestimoStatus;
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
        Schema::create('emprestimos', function (Blueprint $table) {
            $table->id('id_emprestimo');
            $table->foreignId('livro_id')
                ->constrained('livros', 'id_livro')
                ->onDelete('cascade');
            $table->foreignId('usuario_id')
                ->constrained('users', 'id')
                ->onDelete('cascade');
            $table->dateTime('data_emprestimo')->nullable();
            $table->dateTime('data_prevista_devolucao')->nullable();
            $table->dateTime('data_devolucao_real')->nullable();
            $table->string('status')->default(EmprestimoStatus::SOLICITADO->value)->index();
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emprestimos');
    }
};
