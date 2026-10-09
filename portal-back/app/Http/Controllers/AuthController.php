<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

// Controller responsável pela autenticação (registro, login, logout e geração de tokens).
class AuthController extends Controller
{
    // Registra um novo usuário com perfil padrão e retorna seu token de acesso.
    public function register(Request $request): JsonResponse
    {
        // Valida os dados de entrada (requer confirmação do campo 'password' via 'password_confirmation')
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        // Garante que todo novo registro seja criado exclusivamente como perfil padrão
        $validated['role'] = UserRole::PADRAO;

        // Persiste o usuário no banco (a senha é hasheada automaticamente pelo cast do model)
        $user = User::create($validated);

        // Retorna o token com status HTTP 201 (Created)
        return $this->tokenResponse($user, 201);
    }

    // Autentica o usuário por e-mail e senha, gerando um novo token de API.
    public function login(Request $request): JsonResponse
    {
        // Valida os campos obrigatórios para login
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Busca o usuário pelo e-mail informado
        $user = User::where('email', $credentials['email'])->first();

        // Valida se o usuário existe e se o hash da senha confere
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'As credenciais informadas são inválidas.',
            ], 401);
        }

        // Bloqueio de usuário inativado
        if (! $user->ativo) {
            return response()->json([
                'message' => 'Usuário bloqueado pelo administrador. Acesso negado.',
            ], 403);
        }

        // Retorna o token de acesso com status HTTP 200 (OK)
        return $this->tokenResponse($user);
    }

    // Invalida o token Sanctum atualmente em uso pelo cliente.
    public function logout(Request $request): JsonResponse
    {
        // Deleta apenas o token ativo desta sessão/dispositivo
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    // Monta o payload JSON padronizado com o usuário e o token Bearer gerado.
    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        $user->load('roleModel.permissions');

        $userData = $user->toArray();
        $userData['permissoes'] = $user->getPermissionsSlugs();

        return response()->json([
            'user' => $userData,
            'token' => $user->createToken('portal-front')->plainTextToken,
            'token_type' => 'Bearer',
        ], $status);
    }
}
