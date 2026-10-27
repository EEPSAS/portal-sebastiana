<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $role = $user?->role;
        $isStudentOrTeacher = in_array($role, [
            UserRole::ALUNO,
            UserRole::PADRAO,
            UserRole::PROFESSOR,
        ], true);

        // O status é validado no servidor para também bloquear tokens emitidos antes da aprovação.
        if ($isStudentOrTeacher && $user->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Seu pedido de acesso ainda não foi aprovado pelo Especialista.',
                'approval_status' => $user->approval_status,
            ], 403);
        }

        return $next($request);
    }
}
