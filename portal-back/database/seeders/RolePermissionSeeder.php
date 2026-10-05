<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Definição dos Papéis (Roles)
        $rolesData = [
            [
                'slug' => 'aluno',
                'nome' => 'Aluno',
                'nivel' => 1,
                'descricao' => 'Usuário padrão com acesso ao consumo de conteúdos, biblioteca e ambiente acadêmico discente.',
            ],
            [
                'slug' => 'professor',
                'nome' => 'Professor',
                'nivel' => 1,
                'descricao' => 'Usuário padrão com privilégios de docência nas turmas e disciplinas vinculadas.',
            ],
            [
                'slug' => 'bibliotecaria',
                'nome' => 'Bibliotecária',
                'nivel' => 1,
                'descricao' => 'Usuário padrão com privilégios elevados estritamente limitados ao módulo de Biblioteca.',
            ],
            [
                'slug' => 'especialista',
                'nome' => 'Especialista',
                'nivel' => 2,
                'descricao' => 'Profissional responsável pela gestão de conteúdo informativo e acadêmico da escola.',
            ],
            [
                'slug' => 'admin',
                'nome' => 'Administrador',
                'nivel' => 3,
                'descricao' => 'Controle total do sistema, configurações e gestão de pessoas.',
            ],
        ];

        $roles = [];
        foreach ($rolesData as $r) {
            $roles[$r['slug']] = Role::updateOrCreate(
                ['slug' => $r['slug']],
                $r
            );
        }

        // 2. Definição do Catálogo de Habilidades (Permissions)
        $permissionsData = [
            // Sistema & Administração
            ['slug' => 'acesso_total', 'nome' => 'Acesso Total (Superadmin Bypass)', 'modulo' => 'sistema'],
            ['slug' => 'gerenciar_usuarios', 'nome' => 'Gerenciar Usuários (CRUD e Bloqueio)', 'modulo' => 'usuarios'],
            ['slug' => 'gerenciar_papeis_permissoes', 'nome' => 'Gerenciar Papéis e Permissões', 'modulo' => 'usuarios'],
            ['slug' => 'visualizar_logs_sistema', 'nome' => 'Visualizar Logs de Auditoria do Sistema', 'modulo' => 'sistema'],

            // Notícias & Informativos
            ['slug' => 'visualizar_noticias', 'nome' => 'Visualizar Notícias', 'modulo' => 'noticias'],
            ['slug' => 'criar_noticia', 'nome' => 'Criar Nova Notícia', 'modulo' => 'noticias'],
            ['slug' => 'editar_noticia_propria', 'nome' => 'Editar Notícia Própria', 'modulo' => 'noticias'],
            ['slug' => 'gerenciar_noticias', 'nome' => 'Gerenciar Qualquer Notícia (CRUD)', 'modulo' => 'noticias'],

            // Calendário & Eventos
            ['slug' => 'visualizar_eventos', 'nome' => 'Visualizar Calendário de Eventos', 'modulo' => 'eventos'],
            ['slug' => 'criar_evento', 'nome' => 'Cadastrar Eventos Próprios no Calendário', 'modulo' => 'eventos'],
            ['slug' => 'gerenciar_eventos_proprios', 'nome' => 'Gerenciar Eventos Próprios', 'modulo' => 'eventos'],
            ['slug' => 'gerenciar_eventos', 'nome' => 'Gerenciar Qualquer Evento do Calendário (Especialista)', 'modulo' => 'eventos'],

            // Biblioteca & Empréstimos
            ['slug' => 'visualizar_livros', 'nome' => 'Visualizar Acervo de Livros', 'modulo' => 'biblioteca'],
            ['slug' => 'solicitar_emprestimo', 'nome' => 'Solicitar Empréstimo de Livro', 'modulo' => 'biblioteca'],
            ['slug' => 'visualizar_emprestimos_proprios', 'nome' => 'Visualizar Empréstimos Próprios', 'modulo' => 'biblioteca'],
            ['slug' => 'gerenciar_livros', 'nome' => 'Gerenciar Acervo de Livros (CRUD)', 'modulo' => 'biblioteca'],
            ['slug' => 'gerenciar_emprestimos', 'nome' => 'Gerenciar Empréstimos (Aprovar, Devolver, Renovar)', 'modulo' => 'biblioteca'],
            ['slug' => 'visualizar_agenda_devolucoes', 'nome' => 'Visualizar Agenda de Devoluções', 'modulo' => 'biblioteca'],
            ['slug' => 'visualizar_historico_global_emprestimos', 'nome' => 'Visualizar Histórico Global de Empréstimos', 'modulo' => 'biblioteca'],
            ['slug' => 'visualizar_perfil_basico_usuarios', 'nome' => 'Consultar Perfil Básico de Usuários para Empréstimos', 'modulo' => 'biblioteca'],
            ['slug' => 'gerenciar_biblioteca', 'nome' => 'Gestão Ampla da Biblioteca', 'modulo' => 'biblioteca'],

            // Conteúdos & Mídias
            ['slug' => 'visualizar_videoaulas', 'nome' => 'Visualizar Videoaulas', 'modulo' => 'conteudo'],
            ['slug' => 'assistir_videoaulas', 'nome' => 'Assistir Videoaulas', 'modulo' => 'conteudo'],
            ['slug' => 'visualizar_pdfs', 'nome' => 'Visualizar Materiais em PDF', 'modulo' => 'conteudo'],
            ['slug' => 'baixar_pdfs', 'nome' => 'Baixar Materiais em PDF', 'modulo' => 'conteudo'],
            ['slug' => 'criar_videoaula', 'nome' => 'Publicar Videoaulas', 'modulo' => 'conteudo'],
            ['slug' => 'criar_pdf', 'nome' => 'Fazer Upload de Materiais em PDF', 'modulo' => 'conteudo'],

            // Módulo Acadêmico
            ['slug' => 'visualizar_proprio_boletim', 'nome' => 'Visualizar Próprio Boletim', 'modulo' => 'academico'],
            ['slug' => 'visualizar_propria_frequencia', 'nome' => 'Visualizar Própria Frequência', 'modulo' => 'academico'],
            ['slug' => 'enviar_resolucao_atividade', 'nome' => 'Enviar Resolução de Atividade', 'modulo' => 'academico'],
            ['slug' => 'enviar_remessa_docente', 'nome' => 'Enviar Remessa Docente (Diários/Planilhas)', 'modulo' => 'academico'],
            ['slug' => 'gerenciar_atividades_proprias', 'nome' => 'Gerenciar Atividades Próprias da Disciplina', 'modulo' => 'academico'],
            ['slug' => 'gerenciar_turmas', 'nome' => 'Gerenciar Turmas e Matrículas', 'modulo' => 'academico'],
            ['slug' => 'gerenciar_frequencia', 'nome' => 'Consolidar e Gerenciar Frequência Escolar', 'modulo' => 'academico'],
            ['slug' => 'gerenciar_notas', 'nome' => 'Lançar e Gerenciar Notas Oficiais e Boletins', 'modulo' => 'academico'],
            ['slug' => 'visualizar_relatorios_basicos', 'nome' => 'Visualizar Relatórios Básicos do Sistema', 'modulo' => 'academico'],
        ];

        $permissions = [];
        foreach ($permissionsData as $p) {
            $permissions[$p['slug']] = Permission::updateOrCreate(
                ['slug' => $p['slug']],
                $p
            );
        }

        // 3. Mapeamento de Habilidades por Papel

        // 3.1 ALUNO (Consumo + notícias próprias + eventos pessoais)
        $permissoesAluno = [
            'visualizar_noticias',
            'criar_noticia',
            'editar_noticia_propria',
            'visualizar_eventos',
            'criar_evento',
            'gerenciar_eventos_proprios',
            'visualizar_livros',
            'solicitar_emprestimo',
            'visualizar_emprestimos_proprios',
            'visualizar_videoaulas',
            'assistir_videoaulas',
            'visualizar_pdfs',
            'baixar_pdfs',
            'visualizar_proprio_boletim',
            'visualizar_propria_frequencia',
            'enviar_resolucao_atividade',
        ];
        $roles['aluno']->permissions()->sync(
            array_map(fn ($slug) => $permissions[$slug]->id, $permissoesAluno)
        );

        // 3.2 PROFESSOR (Tudo do aluno + mídias e docência)
        $permissoesProfessor = array_merge($permissoesAluno, [
            'criar_videoaula',
            'criar_pdf',
            'enviar_remessa_docente',
            'gerenciar_atividades_proprias',
        ]);
        $roles['professor']->permissions()->sync(
            array_map(fn ($slug) => $permissions[$slug]->id, $permissoesProfessor)
        );

        // 3.3 BIBLIOTECÁRIA (Notícias, eventos pessoais e gestão ampla da biblioteca)
        $permissoesBibliotecaria = [
            'visualizar_noticias',
            'criar_noticia',
            'editar_noticia_propria',
            'visualizar_eventos',
            'criar_evento',
            'gerenciar_eventos_proprios',
            'visualizar_livros',
            'solicitar_emprestimo',
            'visualizar_emprestimos_proprios',
            'gerenciar_livros',
            'gerenciar_emprestimos',
            'visualizar_agenda_devolucoes',
            'visualizar_historico_global_emprestimos',
            'visualizar_perfil_basico_usuarios',
        ];
        $roles['bibliotecaria']->permissions()->sync(
            array_map(fn ($slug) => $permissions[$slug]->id, $permissoesBibliotecaria)
        );

        // 3.4 ESPECIALISTA (Nível 2 - Gestão de conteúdo, acadêmico e calendário)
        $permissoesEspecialista = [
            'visualizar_noticias',
            'criar_noticia',
            'editar_noticia_propria',
            'gerenciar_noticias',
            'visualizar_eventos',
            'criar_evento',
            'gerenciar_eventos_proprios',
            'gerenciar_eventos',
            'visualizar_livros',
            'solicitar_emprestimo',
            'visualizar_emprestimos_proprios',
            'gerenciar_livros',
            'gerenciar_emprestimos',
            'visualizar_agenda_devolucoes',
            'visualizar_historico_global_emprestimos',
            'visualizar_perfil_basico_usuarios',
            'gerenciar_biblioteca',
            'visualizar_videoaulas',
            'assistir_videoaulas',
            'visualizar_pdfs',
            'baixar_pdfs',
            'criar_videoaula',
            'criar_pdf',
            'gerenciar_turmas',
            'gerenciar_frequencia',
            'gerenciar_notas',
            'visualizar_relatorios_basicos',
        ];
        $roles['especialista']->permissions()->sync(
            array_map(fn ($slug) => $permissions[$slug]->id, $permissoesEspecialista)
        );

        // 3.5 ADMINISTRADOR (Nível 3 - Todas as permissões)
        $roles['admin']->permissions()->sync(
            array_values(array_map(fn ($p) => $p->id, $permissions))
        );

        // 4. Atualizar usuários existentes para seus novos papéis relacionais
        $adminRole = $roles['admin'];
        $especialistaRole = $roles['especialista'];
        $professorRole = $roles['professor'];
        $alunoRole = $roles['aluno'];

        User::where('email', 'admin@sebastiana.edu.br')->update([
            'role_id' => $adminRole->id,
            'role' => 'adm',
            'ativo' => true,
        ]);

        User::whereIn('email', [
            'carlos.silva@sebastiana.edu.br',
            'marina.souza@sebastiana.edu.br',
            'lucas.mendes@sebastiana.edu.br',
            'helena.castro@sebastiana.edu.br',
        ])->update([
            'role_id' => $professorRole->id,
            'role' => 'professor',
            'ativo' => true,
        ]);

        User::where('role', 'especialista')->whereNull('role_id')->update([
            'role_id' => $especialistaRole->id,
            'ativo' => true,
        ]);

        User::where('role', 'padrao')->whereNull('role_id')->update([
            'role_id' => $alunoRole->id,
            'role' => 'aluno',
            'ativo' => true,
        ]);
    }
}
