<?php

use App\Http\Controllers\NoticiaController;
use App\Models\Radioatividade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::apiResource('noticias', NoticiaController::class);
Route::apiResource('radioatividades', RadioatividadeController::class);