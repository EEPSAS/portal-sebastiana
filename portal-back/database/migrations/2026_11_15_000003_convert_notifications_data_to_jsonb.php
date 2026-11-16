<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration corretiva para garantir que a coluna 'data' da tabela 'notifications'
 * utilize o tipo nativo JSONB no PostgreSQL, permitindo consultas com operador ->>.
 */
return new class extends Migration
{
    /**
     * Converte a coluna 'data' para JSONB em bases PostgreSQL já migradas anteriormente.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications') && DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE jsonb USING data::jsonb');
        }
    }

    /**
     * Reverte a coluna 'data' para TEXT caso seja necessário desfazer a migration.
     */
    public function down(): void
    {
        if (Schema::hasTable('notifications') && DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE notifications ALTER COLUMN data TYPE text USING data::text');
        }
    }
};
