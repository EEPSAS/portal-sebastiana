<?php

namespace App\Http\Controllers;

use App\Models\Noticia;
use Illuminate\Http\Request;

class NoticiaController extends Controller
{
    // Lista todas as noticias cadastradas
    public function index()
    {
        return response()->json(Noticia::all(), 200);
    }

    // Salva uma nova noticia no banco
    public function store(Request $request)
    {
        // Cria a noticia com os dados recebidos
        $noticia = Noticia::create($request->all());
        return response()->json($noticia, 201);
    }

    // Exibe os detalhes de uma noticia especifica
    public function show(Noticia $noticia)
    {
        // Busca a noticia pelo ID informado
        $noticia = Noticia::find($noticia->id);
        return $noticia
        ? response()->json($noticia, 200)
        : response()->json(['erro'=> 'Notícia não encontrada'], 404);
    }

    // Atualiza os dados de uma noticia existente
    public function update(Request $request, Noticia $noticia)
    {
        // Localiza e atualiza o registro
        $noticia = Noticia::findOrFail($noticia->id);
        $noticia->update($request->all());
        return response()->json($noticia, 200);
    }

    // Remove uma noticia do sistema
    public function destroy(Noticia $noticia)
    {
        // Localiza e exclui o registro
        $noticia = Noticia::findOrFail($noticia->id);
        $noticia->delete();
        return response()->json(null, 204);
    }
}