<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveBibliotecaRequest;
use App\Http\Resources\BibliotecaResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller responsável pelo gerenciamento dos dados da biblioteca pessoal do usuário.
 */
class BibliotecaController extends Controller
{
    /**
     * Exibe os dados e acervo personalizado da biblioteca do usuário logado.
     *
     * @return JsonResponse Dados formatados por BibliotecaResource
     */
    public function show(Request $request): JsonResponse
    {
        $biblioteca = $request->user()->biblioteca;

        if (! $biblioteca) {
            return response()->json([
                'dados' => null,
            ], 200);
        }

        return response()->json(new BibliotecaResource($biblioteca), 200);
    }

    /**
     * Atualiza ou inicializa as preferências e coleções da biblioteca do usuário.
     *
     * @param  SaveBibliotecaRequest  $request  Form Request validada
     */
    public function update(SaveBibliotecaRequest $request): JsonResponse
    {
        $biblioteca = $request->user()->biblioteca()->updateOrCreate([], [
            'dados' => $request->validated('dados'),
        ]);

        return response()->json(new BibliotecaResource($biblioteca), 200);
    }
}
