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
        // 1. Tabela de Papéis (Roles)
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // admin, especialista, professor, bibliotecaria, aluno
            $table->string('nome');           // Administrador, Especialista, Professor, etc.
            $table->unsignedTinyInteger('nivel'); // 1 = Padrão, 2 = Especialista/Editor, 3 = Admin
            $table->text('descricao')->nullable();
            $table->timestamps();
        });

        // 2. Tabela de Habilidades / Permissões (Permissions)
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // ex: gerenciar_noticias, solicitar_emprestimo
            $table->string('nome');
            $table->string('modulo')->index(); // biblioteca, academico, noticias, etc.
            $table->text('descricao')->nullable();
            $table->timestamps();
        });

        // 3. Tabela Pivot Papel x Permissões
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->primary(['role_id', 'permission_id']);
        });

        // 4. Tabela Pivot Permissões Diretas de Usuário (Overrides extraordinários)
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->boolean('concedida')->default(true); // true = concede, false = revoga
            $table->primary(['user_id', 'permission_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
