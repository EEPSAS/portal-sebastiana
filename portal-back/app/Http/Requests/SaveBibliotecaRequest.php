<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveBibliotecaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'dados' => ['required', 'array:livros,planos,videoaulas,apostilas'],
            'dados.livros' => ['present', 'array', 'max:100'],
            'dados.livros.*' => ['required', 'array:id,titulo,autor,status,aluno,nota,imagem,comentarios'],
            'dados.livros.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.livros.*.titulo' => ['required', 'string', 'max:255'],
            'dados.livros.*.autor' => ['nullable', 'string', 'max:255'],
            'dados.livros.*.status' => ['required', 'in:Disponível,Emprestado'],
            'dados.livros.*.aluno' => ['nullable', 'string', 'max:255'],
            'dados.livros.*.nota' => ['nullable', 'numeric', 'between:0,5'],
            'dados.livros.*.imagem' => ['nullable', 'string', 'max:3000000', 'regex:~^(https?://|data:image/(png|jpe?g|webp);base64,)~i'],
            'dados.livros.*.comentarios' => ['present', 'array', 'max:100'],
            'dados.livros.*.comentarios.*' => ['required', 'array:nome,texto,nota,data'],
            'dados.livros.*.comentarios.*.nome' => ['required', 'string', 'max:100'],
            'dados.livros.*.comentarios.*.texto' => ['required', 'string', 'max:500'],
            'dados.livros.*.comentarios.*.nota' => ['nullable', 'integer', 'between:1,5'],
            'dados.livros.*.comentarios.*.data' => ['required', 'string', 'max:20'],
            'dados.planos' => ['present', 'array', 'max:100'],
            'dados.planos.*' => ['required', 'array:id,nome,disciplina,livroIds,apostilaIds,ativo'],
            'dados.planos.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.planos.*.nome' => ['required', 'string', 'max:255'],
            'dados.planos.*.disciplina' => ['required', 'string', 'max:100'],
            'dados.planos.*.livroIds' => ['present', 'array', 'max:100'],
            'dados.planos.*.livroIds.*' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.planos.*.apostilaIds' => ['present', 'array', 'max:100'],
            'dados.planos.*.apostilaIds.*' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.planos.*.ativo' => ['required', 'boolean'],
            'dados.videoaulas' => ['present', 'array', 'max:100'],
            'dados.videoaulas.*' => ['required', 'array:id,titulo,materia,corBadge,descricao,url'],
            'dados.videoaulas.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.videoaulas.*.titulo' => ['required', 'string', 'max:255'],
            'dados.videoaulas.*.materia' => ['required', 'string', 'max:100'],
            'dados.videoaulas.*.corBadge' => ['required', 'string', 'max:20'],
            'dados.videoaulas.*.descricao' => ['nullable', 'string', 'max:1000'],
            'dados.videoaulas.*.url' => ['nullable', 'url', 'max:2048'],
            'dados.apostilas' => ['present', 'array', 'max:100'],
            'dados.apostilas.*' => ['required', 'array:id,titulo,materia,descricao,topico,tipo,nivel,autor,corBadge,corTexto,url'],
            'dados.apostilas.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'dados.apostilas.*.titulo' => ['required', 'string', 'max:255'],
            'dados.apostilas.*.materia' => ['required', 'string', 'max:100'],
            'dados.apostilas.*.descricao' => ['nullable', 'string', 'max:1000'],
            'dados.apostilas.*.topico' => ['nullable', 'string', 'max:255'],
            'dados.apostilas.*.tipo' => ['required', 'string', 'max:100'],
            'dados.apostilas.*.nivel' => ['nullable', 'string', 'max:100'],
            'dados.apostilas.*.autor' => ['nullable', 'string', 'max:255'],
            'dados.apostilas.*.corBadge' => ['required', 'string', 'max:20'],
            'dados.apostilas.*.corTexto' => ['required', 'string', 'max:20'],
            'dados.apostilas.*.url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
