<?php

namespace App\Enums;

/**
 * Enum EmprestimoStatus
 *
 * Conceito Didático:
 * Representa a máquina de estados do ciclo de vida de um empréstimo de livro físico:
 * - solicitado: Pedido aberto pelo leitor e exemplar reservado, aguardando retirada no balcão;
 * - entregue: Exemplar entregue ao leitor (em posse do aluno, com contagem do prazo iniciada);
 * - renovado: Prazo de devolução prorrogado por mais 14 dias;
 * - atrasado: Prazo previsto expirado sem devolução registrada;
 * - devolvido: Exemplar devolvido à prateleira (estoque incrementado);
 * - recusado: Solicitação cancelada ou negada pela biblioteca.
 */
enum EmprestimoStatus: string
{
    case SOLICITADO = 'solicitado';
    case ENTREGUE = 'entregue';
    case DEVOLVIDO = 'devolvido';
    case RENOVADO = 'renovado';
    case RECUSADO = 'recusado';
    case ATRASADO = 'atrasado';

    /**
     * Retorna o rótulo amigável em português para exibição na interface e relatórios.
     */
    public function label(): string
    {
        return match ($this) {
            self::SOLICITADO => 'Solicitado',
            self::ENTREGUE => 'Entregue',
            self::DEVOLVIDO => 'Devolvido',
            self::RENOVADO => 'Renovado',
            self::RECUSADO => 'Recusado',
            self::ATRASADO => 'Atrasado',
        };
    }
}
