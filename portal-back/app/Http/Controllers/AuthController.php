<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
