<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveBibliotecaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BibliotecaController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'dados' => $request->user()->biblioteca?->dados,
        ]);
    }

    public function update(SaveBibliotecaRequest $request): JsonResponse
    {
        $biblioteca = $request->user()->biblioteca()->updateOrCreate([], [
            'dados' => $request->validated('dados'),
        ]);

        return response()->json(['dados' => $biblioteca->dados]);
    }
}
