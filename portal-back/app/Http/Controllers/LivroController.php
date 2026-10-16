<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportarLivrosCsvRequest;
use App\Http\Requests\StoreLivroRequest;
use App\Http\Requests\UpdateLivroRequest;
use App\Http\Resources\LivroResource;
use App\Models\Livro;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Controller responsável pelo catálogo e gestão de livros físicos da biblioteca escolar.
 */
class LivroController extends Controller
{
    /**
     * Lista os livros do acervo com suporte a filtros dinâmicos de busca.
     * No pré-carregamento (sem filtros ativos), retorna no máximo os 5 últimos livros cadastrados.
     *
     * @param  Request  $request  Requisição HTTP com parâmetros de busca
     * @return JsonResponse Coleção de livros formatada pelo LivroResource
     */
    public function index(Request $request): JsonResponse
    {
        // Constrói a query base do Eloquent
        $query = Livro::query();
        $temFiltroAtivo = false;

        // Filtra por termo de busca no código, título, autor, gênero ou editora
        if ($request->filled('q')) {
            $query->buscar($request->string('q')->toString());
            $temFiltroAtivo = true;
        }

        // Filtra por gênero literário específico
        if ($request->filled('genero')) {
            $query->where('genero', $request->string('genero')->toString());
            $temFiltroAtivo = true;
        }

        // Filtra por autor do exemplar
        if ($request->filled('autor')) {
            $query->where('autor', 'like', '%'.$request->string('autor')->toString().'%');
            $temFiltroAtivo = true;
        }

        // Exibe somente livros com cópias disponíveis para empréstimo
        if ($request->boolean('apenas_disponiveis')) {
            $query->disponiveis();
            $temFiltroAtivo = true;
        }

        // Ordena sempre pelos últimos exemplares cadastrados no acervo (id_livro decrescente)
        $query->orderByDesc('id_livro');

        // No pré-carregamento (sem pesquisa ativa), limita a no máximo 5 livros
        if (! $temFiltroAtivo) {
            $limite = max(1, min((int) $request->input('limit', 5), 5));
            $query->limit($limite);
        } elseif ($request->filled('limit')) {
            $query->limit(max(1, (int) $request->input('limit')));
        }

        $livros = $query->get();

        return response()->json(LivroResource::collection($livros), 200);
    }

    /**
     * Cadastra um novo livro físico no acervo da biblioteca escolar.
     *
     * @param  StoreLivroRequest  $request  Form Request com dados validados
     * @return JsonResponse Livro criado encapsulado no Resource
     */
    public function store(StoreLivroRequest $request): JsonResponse
    {
        // Autoriza a criação via Policy (apenas Bibliotecária, Especialista e Adm)
        Gate::authorize('create', Livro::class);

        $data = $request->validated();

        // Sincroniza data_lancamento e data_publicacao para manter integridade
        if (! empty($data['data_lancamento']) && empty($data['data_publicacao'])) {
            $data['data_publicacao'] = $data['data_lancamento'];
        } elseif (! empty($data['data_publicacao']) && empty($data['data_lancamento'])) {
            $data['data_lancamento'] = $data['data_publicacao'];
        }

        // Se a quantidade disponível inicial não for definida, assume a quantidade total
        if (! isset($data['quantidade_disponivel'])) {
            $data['quantidade_disponivel'] = $data['quantidade_total'];
        }

        // Persiste o livro no banco de dados
        $livro = Livro::create($data);

        return response()->json(new LivroResource($livro), 201);
    }

    /**
     * Importa livros em massa (Mass Assignment) a partir de um arquivo CSV.
     * Campos definitivos suportados: titulo, editora, autor, genero, data_lancamento, codigo_livro.
     *
     * @param  ImportarLivrosCsvRequest  $request  Form Request com arquivo CSV validado
     * @return JsonResponse Resumo da importação e livros criados/atualizados
     */
    public function importarCsv(ImportarLivrosCsvRequest $request): JsonResponse
    {
        // Valida permissão via Policy (restrito a Bibliotecária, Especialista e Adm)
        Gate::authorize('create', Livro::class);

        $arquivo = $request->file('arquivo') ?? $request->file('csv');
        $conteudo = file_get_contents($arquivo->getRealPath());

        // Remove BOM UTF-8 caso o CSV tenha sido salvo no Excel
        $conteudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $conteudo);
        $linhas = preg_split('/\r\n|\r|\n/', trim((string) $conteudo));

        if (! $linhas || count($linhas) < 2) {
            return response()->json([
                'message' => 'O arquivo CSV está vazio ou não possui linhas de dados além do cabeçalho.',
            ], 422);
        }

        // Detecta automaticamente se o separador do CSV é ponto-e-vírgula (;) ou vírgula (,)
        $primeiraLinha = $linhas[0];
        $delimitador = substr_count($primeiraLinha, ';') >= substr_count($primeiraLinha, ',') ? ';' : ',';
        $cabecalhosBrutos = str_getcsv($primeiraLinha, $delimitador);

        // Normaliza os nomes das colunas (sem acentos, minúsculas e com underscore)
        $cabecalhos = array_map(function ($col) {
            $limpo = mb_strtolower(trim((string) $col), 'UTF-8');
            $semAcento = strtr($limpo, [
                'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a',
                'é' => 'e', 'ê' => 'e', 'í' => 'i', 'ó' => 'o',
                'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ç' => 'c',
            ]);

            return preg_replace('/[^a-z0-9]+/', '_', $semAcento);
        }, $cabecalhosBrutos);

        $livrosImportados = [];

        DB::beginTransaction();
        try {
            for ($i = 1; $i < count($linhas); $i++) {
                $linhaTexto = trim($linhas[$i]);
                if ($linhaTexto === '') {
                    continue;
                }

                $valores = str_getcsv($linhaTexto, $delimitador);
                $registro = [];
                foreach ($cabecalhos as $indice => $chave) {
                    $registro[$chave] = isset($valores[$indice]) ? trim($valores[$indice]) : null;
                }

                // Mapeia os campos definitivos exigidos: titulo, editora, autor, genero, data_lancamento, codigo_livro
                $titulo = $registro['titulo'] ?? $registro['nome'] ?? null;
                $autor = $registro['autor'] ?? null;
                $editora = $registro['editora'] ?? null;
                $genero = $registro['genero'] ?? $registro['categoria'] ?? null;
                $codigoLivro = $registro['codigo_livro']
                    ?? $registro['codigo_do_livro']
                    ?? $registro['codigo']
                    ?? null;
                $dataBruta = $registro['data_lancamento']
                    ?? $registro['data_de_lancamento']
                    ?? $registro['data_publicacao']
                    ?? null;

                if (empty($titulo) || empty($autor)) {
                    continue;
                }

                // Normaliza a data de lançamento (aceita YYYY-MM-DD ou DD/MM/YYYY)
                $dataFormatada = null;
                if (! empty($dataBruta)) {
                    try {
                        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $dataBruta)) {
                            $dataFormatada = Carbon::createFromFormat('d/m/Y', $dataBruta)->format('Y-m-d');
                        } else {
                            $dataFormatada = Carbon::parse($dataBruta)->format('Y-m-d');
                        }
                    } catch (\Throwable) {
                        $dataFormatada = null;
                    }
                }

                $qtdTotal = isset($registro['quantidade_total']) && is_numeric($registro['quantidade_total'])
                    ? max(1, (int) $registro['quantidade_total'])
                    : 1;

                // Dados preparados para Mass Assignment via $fillable do Model Livro
                $dadosLivro = [
                    'codigo_livro' => ! empty($codigoLivro) ? $codigoLivro : null,
                    'titulo' => $titulo,
                    'autor' => $autor,
                    'editora' => ! empty($editora) ? $editora : null,
                    'genero' => ! empty($genero) ? $genero : null,
                    'data_lancamento' => $dataFormatada,
                    'data_publicacao' => $dataFormatada,
                    'prateleira_localizacao' => $registro['prateleira_localizacao'] ?? $registro['localizacao'] ?? null,
                    'capa' => $registro['capa'] ?? null,
                    'quantidade_total' => $qtdTotal,
                    'quantidade_disponivel' => $qtdTotal,
                ];

                // Se possuir codigo_livro, evita duplicidade atualizando ou criando pelo código único
                if (! empty($dadosLivro['codigo_livro'])) {
                    $livro = Livro::updateOrCreate(
                        ['codigo_livro' => $dadosLivro['codigo_livro']],
                        $dadosLivro
                    );
                } else {
                    $livro = Livro::create($dadosLivro);
                }

                $livrosImportados[] = $livro;
            }

            if (count($livrosImportados) === 0) {
                DB::rollBack();

                return response()->json([
                    'message' => 'Nenhum livro válido encontrado no CSV. Verifique as colunas titulo e autor.',
                ], 422);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erro ao processar o arquivo CSV de livros: '.$e->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => count($livrosImportados).' livro(s) importado(s) com sucesso via CSV.',
            'total_importados' => count($livrosImportados),
            'data' => LivroResource::collection($livrosImportados),
        ], 201);
    }

    /**
     * Exibe os detalhes e disponibilidade de um livro específico.
     *
     * @param  Livro  $livro  Model resolvido automaticamente pelo Route Model Binding
     * @return JsonResponse Dados do livro formatados
     */
    public function show(Livro $livro): JsonResponse
    {
        Gate::authorize('view', $livro);

        return response()->json(new LivroResource($livro), 200);
    }

    /**
     * Atualiza as informações cadastrais de um livro do acervo.
     *
     * @param  UpdateLivroRequest  $request  Form Request validada
     * @param  Livro  $livro  Instância do livro a ser atualizado
     * @return JsonResponse Livro atualizado formatado
     */
    public function update(UpdateLivroRequest $request, Livro $livro): JsonResponse
    {
        Gate::authorize('update', $livro);

        $data = $request->validated();

        if (! empty($data['data_lancamento']) && empty($data['data_publicacao'])) {
            $data['data_publicacao'] = $data['data_lancamento'];
        } elseif (! empty($data['data_publicacao']) && empty($data['data_lancamento'])) {
            $data['data_lancamento'] = $data['data_publicacao'];
        }

        // Atualiza apenas os campos permitidos e validados pela Form Request
        $livro->update($data);

        return response()->json(new LivroResource($livro), 200);
    }

    /**
     * Remove um exemplar do acervo escolar.
     *
     * @return JsonResponse Retorno HTTP 204 sem conteúdo
     */
    public function destroy(Livro $livro): JsonResponse
    {
        Gate::authorize('delete', $livro);

        $livro->delete();

        return response()->json(null, 204);
    }

    /**
     * Consulta e retorna a disponibilidade de retirada de um livro.
     *
     * @return JsonResponse Indicador booleano e quantidades
     */
    public function verificarDisponibilidade(Livro $livro): JsonResponse
    {
        return response()->json([
            'id_livro' => $livro->id_livro ?? $livro->id,
            'titulo' => $livro->titulo,
            'disponivel' => $livro->verificarDisponibilidade(),
            'quantidade_disponivel' => (int) $livro->quantidade_disponivel,
            'quantidade_total' => (int) $livro->quantidade_total,
        ], 200);
    }
}
