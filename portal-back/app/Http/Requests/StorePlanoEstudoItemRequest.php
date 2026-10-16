<?php

namespace App\Http\Requests;

use App\Models\PlanoEstudoItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validação e adição de itens a um Plano de Estudos.
 *
 * Papel Didático:
 * Valida a integridade dos metadados do recurso adicionado (livro, videoaula ou conteúdo web)
 * e blinda a aplicação contra duplicidade do mesmo conteúdo dentro do mesmo plano.
 */
class StorePlanoEstudoItemRequest extends FormRequest
{
    /**
     * Determina se o usuário autenticado pode executar a requisição.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Regras de validação dos campos de entrada.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'livro_id' => ['nullable', 'integer', 'exists:livros,id_livro'],
            'tipo' => ['required', 'string', 'in:livro,videoaula,conteudo_web'],
            'titulo' => ['required', 'string', 'max:255'],
            'conteudo_id' => ['nullable', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:2048'],
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'fonte' => ['nullable', 'string', 'max:255'],
            'duracao' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Validação avançada para garantia da regra de negócio:
     * Impede que o mesmo material seja adicionado em duplicidade ao mesmo plano.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $plano = $this->route('plano');
            $planoId = is_object($plano) ? $plano->id : $plano;

            if (! $planoId) {
                return;
            }

            $conteudoId = $this->input('conteudo_id');
            $url = $this->input('url');

            // Se não informou nem ID nem URL, nada para verificar contra duplicata
            if (empty($conteudoId) && empty($url)) {
                return;
            }

            $query = PlanoEstudoItem::where('plano_estudo_id', $planoId);

            $jaExiste = $query->where(function ($sub) use ($conteudoId, $url) {
                if (! empty($conteudoId)) {
                    $sub->where('conteudo_id', $conteudoId);
                }
                if (! empty($url)) {
                    if (! empty($conteudoId)) {
                        $sub->orWhere('url', $url);
                    } else {
                        $sub->where('url', $url);
                    }
                }
            })->exists();

            if ($jaExiste) {
                $validator->errors()->add('conteudo', 'Este conteúdo já foi adicionado a este plano de estudos.');
            }
        });
    }

    /**
     * Mensagens de validação amigáveis em pt-BR.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tipo.required' => 'O tipo do conteúdo é obrigatório.',
            'tipo.in' => 'O tipo do conteúdo deve ser livro, videoaula ou conteudo_web.',
            'titulo.required' => 'O título do conteúdo é obrigatório.',
        ];
    }
}
