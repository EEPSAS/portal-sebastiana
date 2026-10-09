<?php

namespace App\Http\Controllers;

use App\Models\Radioatividade;
use Illuminate\Http\Request;

// Controller responsável pelo gerenciamento de episódios da rádio escolar.
class RadioatividadeController extends Controller
{
    // Lista todos os episodios cadastrados
    public function index()
    {
        return response()->json(Radioatividade::all(), 200);
    }

    // Cria um novo episodio no banco
    public function store(Request $request)
    {
        // Salva com os dados recebidos
        $episodio = Radioatividade::create($request->all());

        return response()->json($episodio, 201);
    }

    // Exibe os detalhes de um episodio especifico
    public function show(Radioatividade $episodio)
    {
        // Busca o episodio pelo ID
        $episodio = Radioatividade::find($episodio->id);

        return $episodio
        ? response()->json($episodio, 200)
        : response()->json(['erro' => 'Episódio não encontrado'], 404);
    }

    // Atualiza os dados de um episodio existente
    public function update(Request $request, Radioatividade $episodio)
    {
        // Localiza e atualiza o episodio
        $episodio = Radioatividade::findOrFail($episodio->id);
        $episodio->update($request->all());

        return response()->json($episodio, 200);
    }

    // Exclui um episodio do sistema
    public function destroy(Radioatividade $episodio)
    {
        // Localiza e remove o episodio
        $episodio = Radioatividade::findOrFail($episodio->id);
        $episodio->delete();

        return response()->json(null, 204);
    }
}
