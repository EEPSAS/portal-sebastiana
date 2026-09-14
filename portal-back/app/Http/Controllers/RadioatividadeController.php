<?php

namespace App\Http\Controllers;

use App\Models\Radioatividade;
use Illuminate\Http\Request;

class RadioatividadeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Radioatividade::all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $episodio = Radioatividade::create($request->all());
        return response()->json($episodio, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Radioatividade $episodio)
    {
        $episodio = Radioatividade::find($episodio->id);
        return $episodio
        ? response()->json($episodio, 200)
        : response()->json(['erro'=> 'Episódio não encontrado'], 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Radioatividade $episodio)
    {
        $episodio = Radioatividade::findOrFail($episodio->id);
        $episodio->update($request->all());
        return response()->json($episodio, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Radioatividade $episodio)
    {
        $episodio = Radioatividade::findOrFail($episodio->id);
        $episodio->delete();
        return response()->json(null, 204);
    }
}
