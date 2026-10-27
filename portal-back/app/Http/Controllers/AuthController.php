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
     * Registra um pedido de aluno ou professor sem liberar acesso antes da análise.
     *
     * @param  AuthRegisterRequest  $request  Form Request validada
     * @return JsonResponse Pedido encapsulado pelo AuthUserResource, sem token
     */
    public function register(AuthRegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $role = $this->roleForEmail($validated['email']);
        $existingUser = User::where('email', $validated['email'])->first();

        if ($existingUser) {
            if ($existingUser->role !== $role) {
                return response()->json([
                    'message' => 'Este e-mail já está associado a outra conta escolar.',
                ], 409);
            }

            if ($existingUser->approval_status === 'rejected') {
                $existingUser->update(['approval_status' => 'pending']);
            }

            if ($existingUser->approval_status !== 'approved') {
                return $this->approvalResponse(
                    $existingUser,
                    202,
                    'Seu pedido foi enviado novamente e aguarda análise do Especialista.'
                );
            }

            return response()->json([
                'message' => 'Este e-mail já possui uma conta aprovada. Entre com suas credenciais.',
            ], 409);
        }

        $validated['role'] = $role;
        $validated['approval_status'] = 'pending';
        $user = User::create($validated);

        return $this->approvalResponse($user, 202, 'Pedido enviado. Aguarde a aprovação do Especialista.');
    }

    /**
     * Autentica o usuário por e-mail e senha, emitindo um novo Bearer token.
     *
     * @param  AuthLoginRequest  $request  Form Request com credenciais validadas
     */
    public function login(AuthLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'As credenciais informadas são inválidas.',
            ], 401);
        }

        if (! $this->emailMatchesUserRole($user, $credentials['email'])) {
            return response()->json([
                'message' => 'Acesso restrito ao e-mail institucional correspondente ao seu vínculo escolar.',
            ], 403);
        }

        if (isset($user->ativo) && ! $user->ativo) {
            return response()->json([
                'message' => 'Usuário bloqueado pelo administrador. Acesso negado.',
            ], 403);
        }

        if ($user->approval_status === 'rejected') {
            $user->update(['approval_status' => 'pending']);
        }

        if ($user->approval_status !== 'approved') {
            return $this->approvalResponse(
                $user,
                403,
                'Seu pedido está pendente de análise pelo Especialista.'
            );
        }

        return $this->tokenResponse($user, 200, 'Login realizado com sucesso.');
    }

    /**
     * Autentica ou cadastra o usuário através do Google Identity Services (GIS).
     *
     * Valida o token criptográfico com o Google, verifica se o e-mail pertence
     * aos domínios escolares de alunos e professores e só emite token após aprovação.
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

        // 2. Aceita somente os domínios institucionais de alunos e professores.
        $rawEmail = trim($rawEmail);
        $institutionalRegex = '/^[a-zA-Z0-9._%+-]+@(aluno|educacao|educação)\.mg\.gov\.br$/i';
        if (! preg_match($institutionalRegex, $rawEmail)) {
            return response()->json([
                'message' => 'Acesso restrito. Utilize seu e-mail @aluno.mg.gov.br ou @educacao.mg.gov.br.',
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
                'approval_status' => 'pending',
            ]);
        } else {
            if (! $this->emailMatchesUserRole($user, $normalizedEmail)) {
                return response()->json([
                    'message' => 'O e-mail institucional não corresponde ao vínculo desta conta.',
                ], 403);
            }

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

        if ($user->approval_status === 'rejected') {
            $user->update(['approval_status' => 'pending']);
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

        if ($user->approval_status !== 'approved') {
            return $this->approvalResponse(
                $user,
                403,
                'Seu pedido está pendente de análise pelo Especialista.'
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

    private function approvalResponse(User $user, int $status, string $message): JsonResponse
    {
        return (new AuthUserResource($user, null, $message, $user->approval_status))
            ->response()
            ->setStatusCode($status);
    }

    private function roleForEmail(string $email): UserRole
    {
        return str_ends_with($email, '@aluno.mg.gov.br')
            ? UserRole::ALUNO
            : UserRole::PROFESSOR;
    }

    private function emailMatchesUserRole(User $user, string $email): bool
    {
        $domain = $user->role->institutionalEmailDomain();
        if ($domain !== null) {
            return str_ends_with($email, $domain);
        }

        // Contas internas criadas pela gestão não passam pelo cadastro público de alunos/professores.
        return in_array($user->role, [
            UserRole::ESPECIALISTA,
            UserRole::ADM,
            UserRole::BIBLIOTECARIA,
        ], true);
    }
}
