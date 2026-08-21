<?php

namespace App\Http\Controllers;

use App\Models\Noticia;
use Illuminate\Http\Request;

class NoticiaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Noticia::all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $noticia = Noticia::create($request->all());
        return response()->json($noticia, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Noticia $noticia)
    {
        $noticia = Noticia::find($noticia->id);
        return $noticia
        ? response()->json($noticia, 200)
        : response()->json(['erro'=> 'Notícia não encontrada'], 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Noticia $noticia)
    {
        $noticia = Noticia::findOrFail($noticia->id);
        $noticia->update($request->all());
        return response()->json($noticia, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Noticia $noticia)
    {
        $noticia = Noticia::findOrFail($noticia->id);
        $noticia->delete();
        return response()->json(null, 204);
    }
}
