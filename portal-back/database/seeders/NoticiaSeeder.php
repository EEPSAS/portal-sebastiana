<?php

namespace Database\Seeders;

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Database\Seeder;

class NoticiaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'adm')->first() ?? User::factory()->create();

        $noticias = [
            [
                'categoria' => 'Acadêmico',
                'titulo' => 'Abertura do Ano Letivo de 2026 reúne comunidade escolar no Colégio Sebastiana',
                'descricao' => 'Direção e corpo docente apresentaram os novos laboratórios de informática e robótica.',
                'conteudo' => 'Com grande entusiasmo, o Colégio Sebastiana deu as boas-vindas aos estudantes para o início do ano letivo de 2026. A instituição inaugurou novos espaços maker e reforçou o compromisso com o ensino integral.',
                'imagem' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300',
                'dataPublicacao' => now()->subDays(10),
                'destaque' => true,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Biblioteca',
                'titulo' => 'Acervo da Biblioteca ganha 200 novas obras de literatura e ciências',
                'descricao' => 'Novos títulos clássicos e científicos já estão disponíveis para empréstimo aos discentes.',
                'conteudo' => 'A biblioteca escolar passou por uma ampla expansão de seu acervo físico e digital, incluindo clássicos do modernismo brasileiro e referências internacionais de exatas.',
                'imagem' => 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=300',
                'dataPublicacao' => now()->subDays(6),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Eventos',
                'titulo' => 'Inscrições abertas para a Feira de Ciências e Mostra Tecnológica',
                'descricao' => 'Estudantes do Ensino Médio e Técnico podem submeter propostas de projetos até abril.',
                'conteudo' => 'A tradicional Feira de Ciências deste ano terá como foco a sustentabilidade e soluções computacionais para a comunidade local.',
                'imagem' => 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=300',
                'dataPublicacao' => now()->subDays(2),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Cultura',
                'titulo' => 'Sarau literário destaca talentos dos estudantes',
                'descricao' => 'Alunos apresentam poesias, músicas e textos autorais em encontro aberto à comunidade.',
                'conteudo' => 'O sarau literário reuniu estudantes de diferentes turmas em uma celebração da leitura e da expressão artística. As apresentações incluíram poesias, músicas e textos produzidos pelos próprios alunos.',
                'imagem' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                'dataPublicacao' => now()->subDays(2),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Acadêmico',
                'titulo' => 'Estudantes se preparam para a Olimpíada de Matemática',
                'descricao' => 'A escola organiza encontros de estudo para apoiar os participantes da competição.',
                'conteudo' => 'Estudantes interessados em matemática participam de encontros de preparação para a olimpíada. As atividades revisam conteúdos e incentivam a resolução colaborativa de desafios.',
                'imagem' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300',
                'dataPublicacao' => now()->subDays(3),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Institucional',
                'titulo' => 'Escola promove encontro com as famílias dos estudantes',
                'descricao' => 'Reunião fortalece o diálogo entre responsáveis, equipe pedagógica e direção.',
                'conteudo' => 'A comunidade escolar está convidada para um encontro dedicado à troca de informações sobre o calendário, os projetos pedagógicos e o acompanhamento da aprendizagem.',
                'imagem' => 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=300',
                'dataPublicacao' => now()->subDays(4),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Meio ambiente',
                'titulo' => 'Projeto escolar incentiva práticas sustentáveis',
                'descricao' => 'Turmas participam de ações de conscientização sobre o cuidado com o meio ambiente.',
                'conteudo' => 'O projeto reúne atividades de conscientização e iniciativas práticas para incentivar o uso responsável dos recursos e o cuidado com os espaços da escola e da comunidade.',
                'imagem' => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
                'dataPublicacao' => now()->subDays(5),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
            [
                'categoria' => 'Esportes',
                'titulo' => 'Jogos escolares promovem integração entre as turmas',
                'descricao' => 'Estudantes participam de atividades esportivas e valorizam o trabalho em equipe.',
                'conteudo' => 'Os jogos escolares incentivam a convivência, a cooperação e a prática de atividades físicas, reunindo estudantes em diferentes modalidades.',
                'imagem' => 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800',
                'miniatura' => 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=300',
                'dataPublicacao' => now()->subDays(7),
                'destaque' => false,
                'autor_id' => $admin->id,
            ],
        ];

        foreach ($noticias as $dados) {
            Noticia::updateOrCreate(
                ['titulo' => $dados['titulo']],
                $dados
            );
        }
    }
}
