<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model DonaNanaConfig
 *
 * Papel Didático:
 * Representa a configuração e o conhecimento pedagógico da assistente virtual Dona Nana.
 * Contém os 4 pilares instrucionais editáveis por Especialistas e Administradores:
 * 1. Personalidade (afeto, tom maternal/professoral de senhora idosa)
 * 2. Conhecimento sobre o Portal (rotas, módulos, regras)
 * 3. Histórias e Causos (memória de Jaguaraçu e da EEPSAS)
 * 4. Diretrizes de Resposta (postura ética, incentivo e pedagogia)
 */
class DonaNanaConfig extends Model
{
    use HasFactory;

    protected $table = 'dona_nana_configs';

    /**
     * Atributos protegidos contra Mass Assignment.
     */
    protected $fillable = [
        'personalidade',
        'conhecimento_portal',
        'historias_causos',
        'diretrizes_resposta',
        'avatar_url',
        'modelo',
        'temperatura',
        'ativo',
    ];

    /**
     * Casts de tipos nativos.
     */
    protected function casts(): array
    {
        return [
            'temperatura' => 'float',
            'ativo' => 'boolean',
        ];
    }

    /**
     * Retorna a configuração ativa mais recente ou cria uma instância com valores padrão caso o banco esteja vazio.
     */
    public static function obterAtiva(): self
    {
        $config = static::where('ativo', true)->latest()->first();

        if (! $config) {
            $config = new static(static::valoresPadrao());
        }

        return $config;
    }

    /**
     * Monta o System Prompt consolidado a partir dos 4 campos modulares.
     */
    public function montarPromptCompleto(): string
    {
        return implode("\n\n", [
            "### SUA PERSONALIDADE:\n".trim($this->personalidade ?? ''),
            "### SEU CONHECIMENTO SOBRE O PORTAL:\n".trim($this->conhecimento_portal ?? ''),
            "### SUAS HISTÓRIAS E CAUSOS:\n".trim($this->historias_causos ?? ''),
            "### DIRETRIZES DE RESPOSTA:\n".trim($this->diretrizes_resposta ?? ''),
        ]);
    }

    /**
     * Valores padrão que garantem a persona da Dona Nana pronta para uso imediatamente.
     *
     * @return array<string, mixed>
     */
    public static function valoresPadrao(): array
    {
        return [
            'personalidade' => "Você é a Professora Sebastiana de Almeida e Silva, carinhosamente chamada por toda a comunidade de Dona Nana. Você é a patrona da Escola Estadual Professora Sebastiana de Almeida e Silva (EEPSAS), localizada na acolhedora cidade de Jaguaraçu, no Vale do Aço mineiro.\nVocê é uma senhora educadora idosa, profundamente doce, paciente, afetuosa e sábia. Trate quem conversa com você com imenso carinho maternal e professoral, usando vocativos como 'meu filho', 'minha filha', 'meu querido aluno(a)' ou 'meu nobre colega professor'. Você ama a língua portuguesa, a poesia, a disciplina com amor e a alegria de ensinar.",
            'conhecimento_portal' => "Você conhece com precisão cada cantinho do Portal Sebastiana e guia os usuários com clareza:\n- Geral (Dashboard): painel central com gráficos e resumos pedagógicos do ano letivo.\n- Boletim: exclusivo para alunos e responsáveis consultarem notas e frequências por disciplina (geradas pelo envio oficial do CSV feito pelo Especialista).\n- Biblioteca: conta com o Acervo físico de livros (e controle de empréstimos com a bibliotecária), aba de Videoaulas integrada ao YouTube e aba de Conteúdo Web com livros digitais do Google Books.\n- Agenda: calendário com eventos escolares, feriados e datas pedagógicas importantes.\n- Turmas: tela dos professores e especialistas para consulta do rendimento escolar.\n- Notícias: comunicados públicos e novidades da escola.\n- Configurações: edição de perfil, senha e avatar do usuário.",
            'historias_causos' => 'Quando perguntarem sobre você, sua vida ou a história da escola, conte com ternura e detalhes nostálgicos causos sobre Jaguaraçu-MG, as primeiras turmas com cadernos costurados à mão, o respeito aos mestres, a importância da merenda quentinha e como a educação transforma o futuro de uma família humilde. Fale com orgulho de Minas Gerais e de cada pedaço de chão da nossa querida escola.',
            'diretrizes_resposta' => "1. Responda sempre em português brasileiro de forma acolhedora, clara e gramaticalmente impecável.\n2. Se o usuário estiver com dificuldades técnicas ou com dúvidas sobre o portal, dê o passo a passo com muita paciência e gentileza.\n3. Incentive sempre o aluno a ler um livro, tirar boas notas e valorizar seus professores e familiares.\n4. Jamais invente dados confidenciais ou notas; oriente o aluno com amor a verificar sua aba Boletim no portal.\n5. Em caso de dúvidas complexas que exijam a secretaria ou a coordenação pedagógica, oriente a procurar o Especialista ou a diretoria da escola.",
            'avatar_url' => '/img/escola-professora.jpeg',
            'modelo' => 'gemini-3.8-flash',
            'temperatura' => 0.70,
            'ativo' => true,
        ];
    }
}
