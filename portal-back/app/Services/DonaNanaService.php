<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\DonaNanaConfig;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service DonaNanaService
 *
 * Papel Didático:
 * Orquestra a inteligência conversacional da Dona Nana:
 * 1. Recupera as diretrizes pedagógicas e a persona no banco de dados (DonaNanaConfig);
 * 2. Injeta o contexto específico do usuário autenticado (nome, turma, papel no sistema);
 * 3. Comunica-se de forma segura com o Google Gemini (gemini-3.8-flash) via HTTP REST nativo;
 * 4. Garante fallback amigável na persona da patrona caso a chave de API não esteja configurada.
 */
class DonaNanaService
{
    /**
     * URL base oficial da API Google Gemini para geração de conteúdo.
     */
    protected const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

    /**
     * Processa a mensagem do usuário e retorna a resposta da Dona Nana.
     *
     * @param  string  $mensagem  Texto enviado pelo usuário.
     * @param  array<int, array{role: string, text: string}>  $historico  Histórico prévio da conversa.
     * @param  string|null  $contextoOrigem  'aba' ou 'balao'.
     * @param  User|null  $user  Usuário autenticado que enviou a mensagem.
     * @return array<string, mixed>
     */
    public function conversar(string $mensagem, array $historico = [], ?string $contextoOrigem = null, ?User $user = null): array
    {
        // 1. Obtém as diretrizes e a persona ativas da Dona Nana
        $config = DonaNanaConfig::obterAtiva();

        // 2. Chave de API definida no .env ou configuração
        $apiKey = config('services.gemini.key');
        $modelo = $config->modelo ?: config('services.gemini.model', 'gemini-3.8-flash');

        // 3. Fallback Gracioso: se não houver chave no .env, responde com carinho sem falhar a aplicação
        if (empty($apiKey)) {
            return $this->gerarRespostaFallback($mensagem, $user);
        }

        // 4. Monta o System Prompt enriquecido com o contexto do usuário
        $systemPrompt = $this->montarSystemPromptContextualizado($config, $user, $contextoOrigem);

        // 5. Prepara os conteúdos multi-turn para a requisição REST
        $contents = $this->formatarHistoricoGemini($historico, $mensagem);

        try {
            $url = sprintf('%s/%s:generateContent?key=%s', self::GEMINI_API_ENDPOINT, $modelo, $apiKey);

            $response = Http::timeout(25)->post($url, [
                'system_instruction' => [
                    'parts' => [
                        ['text' => $systemPrompt],
                    ],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => (float) ($config->temperatura ?? 0.70),
                    'maxOutputTokens' => 1024,
                ],
            ]);

            if ($response->successful()) {
                $dados = $response->json();
                $textoResposta = $dados['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if (! empty($textoResposta)) {
                    return [
                        'resposta' => trim($textoResposta),
                        'sugestoes' => $this->obterSugestoesContextuais($contextoOrigem),
                        'origem' => $modelo,
                    ];
                }
            }

            Log::warning('DonaNanaService: Falha na resposta da Gemini API', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->gerarRespostaFallback($mensagem, $user, 'Houve um pequeno contratempo ao consultar meus pensamentos, mas continue firme nos estudos!');
        } catch (\Throwable $e) {
            Log::error('DonaNanaService: Erro de conexão com a Gemini API', [
                'mensagem' => $e->getMessage(),
            ]);

            return $this->gerarRespostaFallback($mensagem, $user, 'Tive uma breve falha de comunicação com a internet, meu filho. Mas estou sempre aqui com você!');
        }
    }

    /**
     * Enriquece o System Prompt da Dona Nana com as informações contextuais do usuário autenticado.
     */
    protected function montarSystemPromptContextualizado(DonaNanaConfig $config, ?User $user, ?string $contextoOrigem): string
    {
        $promptBase = $config->montarPromptCompleto();

        $nome = $user ? ($user->nickname ?: $user->name) : 'Querido Aluno(a)';
        $role = $user ? ($user->role instanceof UserRole ? $user->role->value : (string) $user->role) : 'aluno';
        $turma = $user?->turma ? $user->turma : 'Ensino Fundamental / Médio';

        $infoContexto = "### CONTEXTO DA PESSOA QUE ESTÁ FALANDO COM VOCÊ:\n";
        $infoContexto .= "- Nome: {$nome}\n";
        $infoContexto .= "- Papel no Portal: {$role}\n";
        if ($user?->turma) {
            $infoContexto .= "- Turma Vinculada: {$turma}\n";
        }
        $infoContexto .= '- Interface Atual: '.($contextoOrigem === 'balao' ? 'Balão Flutuante Rápido (seja mais concisa e direta)' : 'Aba Completa do Dashboard (você pode conversar e contar histórias com mais detalhes)');

        return $promptBase."\n\n".$infoContexto;
    }

    /**
     * Formata o histórico do diálogo no padrão esperado pela API do Google Gemini.
     *
     * @param  array<int, array{role: string, text: string}>  $historico
     * @return array<int, array{role: string, parts: array<int, array{text: string}>}>
     */
    protected function formatarHistoricoGemini(array $historico, string $mensagem): array
    {
        $contents = [];

        foreach ($historico as $item) {
            $roleGemini = ($item['role'] === 'user') ? 'user' : 'model';
            $texto = trim($item['text'] ?? '');

            if ($texto !== '') {
                $contents[] = [
                    'role' => $roleGemini,
                    'parts' => [['text' => $texto]],
                ];
            }
        }

        // Adiciona a mensagem atual do usuário
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $mensagem]],
        ];

        return $contents;
    }

    /**
     * Resposta graciosa na voz da Dona Nana quando a API Key não está disponível.
     *
     * @return array<string, mixed>
     */
    protected function gerarRespostaFallback(string $mensagem, ?User $user, ?string $avisoExtra = null): array
    {
        $nome = $user ? ($user->nickname ?: $user->name) : 'meu querido';

        $resposta = "Olá, {$nome}! Que bênção ter você por aqui. Sou a Dona Nana, e fico muito feliz em ver seu empenho com a nossa escola.\n\n";

        if ($avisoExtra) {
            $resposta .= "{$avisoExtra}\n\n";
        } else {
            $resposta .= "No momento, minha conexão inteligente completa ainda não foi ativada pelos administradores (a chave GEMINI_API_KEY precisa ser preenchida no arquivo de configurações do sistema).\n\n";
        }

        $resposta .= "Mas não se preocupe! Lembre-se sempre:\n";
        $resposta .= "• Para consultar suas notas e frequência, acesse a aba **Boletim**;\n";
        $resposta .= "• Para ler livros incríveis ou assistir videoaulas, vá até nossa **Biblioteca**;\n";
        $resposta .= "• Para ver as datas das provas e feriados, consulte a **Agenda**.\n\n";
        $resposta .= 'Estude bastante e nunca deixe de sonhar grande!';

        return [
            'resposta' => $resposta,
            'sugestoes' => $this->obterSugestoesContextuais(),
            'origem' => 'fallback-local',
        ];
    }

    /**
     * Retorna sugestões rápidas de perguntas que o usuário pode fazer.
     *
     * @return array<int, string>
     */
    public function obterSugestoesContextuais(?string $origem = null): array
    {
        return [
            'Como vejo minhas notas no Boletim?',
            'Como reservo um livro na Biblioteca?',
            'Me conte um causo sobre Jaguaraçu!',
            'Quais eventos teremos este mês na Agenda?',
        ];
    }
}
