<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AuthGoogleRequest;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\Matricula;
use App\Models\User;
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

        // 1. Valida criptograficamente o ID token do Google
        $googleResponse = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if ($googleResponse->failed()) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado.',
            ], 401);
        }

        $payload = $googleResponse->json();
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
            $user = User::create([
                'google_id' => $googleId,
                'name' => $name ?: 'Usuário Institucional',
                'email' => $normalizedEmail,
                'avatar' => $picture,
                'role' => $defaultRole,
                'ativo' => true,
            ]);
        } else {
            // Atualiza os dados sincronizados do Google, preservando o papel já cadastrado
            $user->update([
                'google_id' => $googleId,
                'avatar' => $picture ?: $user->avatar,
                'name' => $name ?: $user->name,
            ]);
        }

        // 6. Verifica se o usuário está desativado pelo administrador
        if (isset($user->ativo) && ! $user->ativo) {
            return response()->json([
                'message' => 'Usuário bloqueado pelo administrador. Acesso negado.',
            ], 403);
        }

        // 7. Vínculo de Turma em Stand by para o aluno (status 'Pendente' para validação do Especialista)
        if ($isAluno && ! empty($turmaId)) {
            Matricula::updateOrCreate(
                [
                    'turma_id' => $turmaId,
                    'usuario_id' => $user->id,
                ],
                [
                    'data_matricula' => now()->toDateString(),
                    'status_matricula' => 'Pendente',
                ]
            );
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
