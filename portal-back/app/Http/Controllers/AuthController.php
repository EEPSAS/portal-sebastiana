<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AuthGoogleRequest;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\Matricula;
use App\Models\User;
use App\Services\NotificacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

/**
 * Controller responsável pela autenticação via Laravel Sanctum (registro, login e logout).
 */
class AuthController extends Controller
{
    /**
     * Registra um novo usuário com papel 'aluno' e emite o token Sanctum.
     *
     * @param  AuthRegisterRequest  $request  Form Request validada
     * @return JsonResponse Payload padronizado por AuthUserResource
     */
    public function register(AuthRegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Se o nome vier vazio, define um identificador derivado do e-mail
        if (empty($validated['name'])) {
            $validated['name'] = strstr($validated['email'], '@', true) ?: 'Aluno';
        }

        // Auto-cadastro público recebe exclusivamente o papel 'aluno'
        $validated['role'] = UserRole::ALUNO;

        // Persiste o usuário no banco (a senha é hasheada via cast do model)
        $user = User::create($validated);

        return $this->tokenResponse($user, 201, 'Cadastro realizado com sucesso.');
    }

    /**
     * Autentica o usuário por e-mail e senha, emitindo um novo Bearer token.
     *
     * @param  AuthLoginRequest  $request  Form Request com credenciais validadas
     */
    public function login(AuthLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        // Busca o usuário pelo e-mail
        $user = User::where('email', $credentials['email'])->first();

        // Verifica a existência e a integridade da senha hasheada
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'As credenciais informadas são inválidas.',
            ], 401);
        }

        // Verifica se a conta do usuário foi desativada/bloqueada pela administração
        if (isset($user->ativo) && ! $user->ativo) {
            return response()->json([
                'message' => 'Usuário bloqueado pelo administrador. Acesso negado.',
            ], 403);
        }

        return $this->tokenResponse($user, 200, 'Login realizado com sucesso.');
    }

    /**
     * Autentica ou cadastra o usuário através do Google Identity Services (GIS).
     *
     * Valida o token criptográfico com o Google, verifica se o e-mail pertence
     * aos domínios da rede estadual de MG (@aluno.mg.gov.br ou @educacao.mg.gov.br)
     * e vincula o aluno à turma com status 'Pendente'.
     *
     * @param  AuthGoogleRequest  $request  Form Request com credencial do Google
     */
    public function googleLogin(AuthGoogleRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $credential = $validated['credential'];
        $turmaId = $validated['turma_id'] ?? null;

        // 1. Valida criptograficamente o ID token junto à API oficial do Google.
        // O bloco try/catch garante que falhas de rede ou ausência de certificado SSL local (cacert.pem)
        // retornem um JSON amigável em vez de quebrar com erro HTTP 500.
        try {
            $googleResponse = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $credential,
            ]);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Não foi possível validar a credencial com os servidores do Google. Verifique sua conexão ou a configuração SSL local (cacert.pem).',
            ], 503);
        }

        if ($googleResponse->failed()) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado.',
            ], 401);
        }

        $payload = $googleResponse->json();

        // Confirma que o token foi emitido especificamente para o Client ID deste portal (quando presente no payload)
        $configuredClientId = config('services.google.client_id');
        if (! empty($payload['aud']) && ! empty($configuredClientId) && $payload['aud'] !== $configuredClientId) {
            return response()->json([
                'message' => 'Token do Google emitido para outro aplicativo (Client ID divergente).',
            ], 401);
        }

        $googleId = $payload['sub'] ?? null;
        $rawEmail = $payload['email'] ?? null;
        $name = $payload['name'] ?? null;
        $picture = $payload['picture'] ?? null;

        if (! $googleId || ! $rawEmail) {
            return response()->json([
                'message' => 'Não foi possível recuperar os dados de identificação do Google.',
            ], 401);
        }

        // 2. Validação estrita do domínio institucional da rede estadual de MG
        $institutionalRegex = '/^[a-zA-Z0-9._%+-]+@(aluno|educacao|educação)\.mg\.gov\.br$/i';
        if (! preg_match($institutionalRegex, $rawEmail)) {
            return response()->json([
                'message' => 'Acesso restrito. Utilize exclusivamente seu e-mail institucional (@aluno.mg.gov.br ou @educacao.mg.gov.br)',
            ], 403);
        }

        // 3. Normalização do e-mail (remove acentuação no domínio para compatibilidade)
        $normalizedEmail = preg_replace('/@educação\.mg\.gov\.br$/i', '@educacao.mg.gov.br', trim($rawEmail));
        $normalizedEmail = strtolower($normalizedEmail);

        // 4. Identificação do papel institucional
        $isAluno = str_ends_with($normalizedEmail, '@aluno.mg.gov.br');
        $defaultRole = $isAluno ? UserRole::ALUNO : UserRole::PROFESSOR;

        // 5. Localiza ou cria o usuário
        $user = User::where('google_id', $googleId)
            ->orWhere('email', $normalizedEmail)
            ->first();

        if (! $user) {
            // Diretriz 2.1: Por questões de segurança, TODO usuário institucional (Aluno ou Professor)
            // que se cadastra pela primeira vez aguarda aprovação antes de acessar o dashboard.
            $user = User::create([
                'google_id' => $googleId,
                'name' => $name ?: 'Usuário Institucional',
                'email' => $normalizedEmail,
                'avatar' => $picture,
                'role' => $defaultRole,
                'ativo' => true,
                'status_confirmacao' => 'pendente',
            ]);

            // Emite notificação no sininho para Especialistas e Administradores (Item 2.4)
            app(NotificacaoService::class)->notificarAprovacaoPendente($user);
        } else {
            // Diretriz 1.3.6 e 1.3.7: Caso o usuário tenha sido excluído/desvinculado anteriormente
            // (status_confirmacao === 'inativo'), aproveita-se o mesmo cadastro de usuário,
            // reativando-o com status 'pendente' para aguardar aprovação de um novo vínculo escolar.
            $estavaDesvinculado = ($user->status_confirmacao === 'inativo');

            $dadosAtualizacao = [
                'google_id' => $googleId,
                'avatar' => $user->avatar ?: $picture,
                'name' => $name ?: $user->name,
            ];

            if ($estavaDesvinculado) {
                $dadosAtualizacao['ativo'] = true;
                $dadosAtualizacao['status_confirmacao'] = 'pendente';
                $dadosAtualizacao['confirmado_em'] = null;
                $dadosAtualizacao['autorizado_por_id'] = null;
            }

            $user->update($dadosAtualizacao);

            if ($estavaDesvinculado) {
                app(NotificacaoService::class)->notificarAprovacaoPendente($user);
            }
        }

        // 6. Verifica se o usuário está bloqueado administrativamente
        if (isset($user->ativo) && ! $user->ativo) {
            return response()->json([
                'message' => 'Usuário bloqueado pelo administrador. Acesso negado.',
            ], 403);
        }

        // 7. Vínculo de Turma para o aluno:
        // Cria em stand-by ('Pendente') apenas se o aluno ainda não possuir matrícula nesta turma,
        // evitando rebaixar uma matrícula que já tenha sido aprovada ('Ativo') pelo Especialista.
        if ($isAluno && ! empty($turmaId)) {
            $matriculaExistente = Matricula::where('turma_id', $turmaId)
                ->where('usuario_id', $user->id)
                ->first();

            if (! $matriculaExistente) {
                Matricula::create([
                    'turma_id' => $turmaId,
                    'usuario_id' => $user->id,
                    'data_matricula' => now()->toDateString(),
                    'status_matricula' => 'Pendente',
                ]);
            }
        }

        return $this->tokenResponse($user, 200, 'Login institucional com Google realizado com sucesso.');
    }

    /**
     * Invalida o token Sanctum ativo da sessão atual.
     */
    public function logout(Request $request): JsonResponse
    {
        // Deleta o token atual do dispositivo
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ], 200);
    }

    /**
     * Gera o token Bearer e monta a resposta encapsulada pelo AuthUserResource.
     *
     * @param  User  $user  Model do usuário autenticado
     * @param  int  $status  Código HTTP (200 ou 201)
     * @param  string  $message  Mensagem amigável de sucesso
     */
    private function tokenResponse(User $user, int $status = 200, string $message = 'Autenticado com sucesso.'): JsonResponse
    {
        $user->load('roleModel.permissions');

        $token = $user->createToken('portal-front')->plainTextToken;

        return (new AuthUserResource($user, $token, $message))
            ->response()
            ->setStatusCode($status);
    }
}
