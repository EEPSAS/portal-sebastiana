<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação para o upload de relatório/planilha consolidada do diário escolar (Item 3.4d).
 */
class ImportarRelatorioTurmaRequest extends FormRequest
{
    /**
     * Determina se o usuário está autorizado a fazer essa requisição.
     * Exige privilégios de gestão acadêmica (Especialista Pedagógico ou Administrador).
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->isAdm()
            || $user->isEspecialista()
            || (method_exists($user, 'canManageAcademic') && $user->canManageAcademic())
        );
    }

    /**
     * Prepara os dados antes da validação.
     * Como o envio ocorre via FormData a partir do frontend React, os mapas de confirmação
     * de alunos e disciplinas podem vir serializados como string JSON.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('mapeamentos_alunos') && is_string($this->input('mapeamentos_alunos'))) {
            $decodificado = json_decode($this->input('mapeamentos_alunos'), true);
            if (is_array($decodificado)) {
                $this->merge(['mapeamentos_alunos' => $decodificado]);
            }
        }

        if ($this->has('mapeamentos_disciplinas') && is_string($this->input('mapeamentos_disciplinas'))) {
            $decodificadoDisc = json_decode($this->input('mapeamentos_disciplinas'), true);
            if (is_array($decodificadoDisc)) {
                $this->merge(['mapeamentos_disciplinas' => $decodificadoDisc]);
            }
        }
    }

    /**
     * Regras de validação da requisição.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Aceita tanto o campo 'arquivo' quanto 'planilha', exigindo estritamente a extensão .csv
            'arquivo' => ['required_without:planilha', 'file', 'extensions:csv', 'mimes:csv,txt', 'max:10240'],
            'planilha' => ['required_without:arquivo', 'file', 'extensions:csv', 'mimes:csv,txt', 'max:10240'],
            'periodo_letivo' => ['nullable', 'string', 'max:100'],
            'data_aula' => ['nullable', 'date'],
            // Mapeamento opcional de confirmação manual em caso de homônimos [nome_csv => id_usuario|'ignorar']
            'mapeamentos_alunos' => ['nullable', 'array'],
            // Mapeamento/conciliação de disciplinas do CSV com o catálogo escolar (Item 3.4d)
            'mapeamentos_disciplinas' => ['nullable', 'array'],
            // Ciclo escolar opcional associado à conciliação da turma e disciplinas
            'ciclo_id' => ['nullable', 'integer', 'exists:ciclos,id_ciclo'],
            // Decisão sobre notas divergentes de períodos já cadastrados ('atualizar' ou 'manter')
            'decisao_divergencias' => ['nullable', 'string', 'in:atualizar,manter'],
        ];
    }

    /**
     * Validações adicionais de segurança para o arquivo CSV enviado.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $arquivo = $this->file('arquivo') ?: $this->file('planilha');
            if (! $arquivo || ! $arquivo->isValid()) {
                return;
            }

            // Lê amostra de segurança do conteúdo
            $caminho = $arquivo->getRealPath();
            $conteudo = @file_get_contents($caminho);

            if ($conteudo === false) {
                $validator->errors()->add('arquivo', 'Não foi possível ler o conteúdo do arquivo enviado.');

                return;
            }

            // Blindagem contra scripts maliciosos embutidos
            if (preg_match('/<\?php|<\?=|<script\b/i', $conteudo)) {
                $validator->errors()->add('arquivo', 'O arquivo enviado contém assinaturas de código não permitidas.');

                return;
            }

            // Proteção contra payload excessivo (DoS em lote)
            $linhas = preg_split('/\r\n|\r|\n/', trim($conteudo));
            if (count($linhas) > 1500) {
                $validator->errors()->add('arquivo', 'A planilha excede o limite máximo permitido de 1500 linhas.');
            }
        });
    }

    /**
     * Mensagens de erro amigáveis para retorno da API.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'arquivo.required_without' => 'Por favor, selecione uma planilha ou arquivo CSV para importar.',
            'planilha.required_without' => 'Por favor, selecione uma planilha ou arquivo CSV para importar.',
            'arquivo.file' => 'O item enviado deve ser um arquivo válido.',
            'planilha.file' => 'O item enviado deve ser um arquivo válido.',
            'arquivo.extensions' => 'O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.',
            'planilha.extensions' => 'O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.',
            'arquivo.mimes' => 'O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.',
            'planilha.mimes' => 'O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.',
            'arquivo.max' => 'O arquivo não pode exceder 10MB.',
            'planilha.max' => 'O arquivo não pode exceder 10MB.',
            'data_aula.date' => 'A data da aula informada deve ser uma data válida.',
        ];
    }
}
