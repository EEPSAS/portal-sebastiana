/**
 * index.jsx - Container Inteligente de Gestão de Usuários e Tokens Sanctum (Módulo 6)
 *
 * Papel Didático:
 * Atua como o Smart Container do módulo de administração de acessos (Role: Admin):
 * 1. Orquestra duas abas integradas: "Contas e Acessos" (usuários) e "Sessões e Tokens (Sanctum)";
 * 2. Consome `usuarioService` e `tokenService` com debounce de 200ms na busca textual;
 * 3. Permite deletar/revogar tokens manualmente e acionar a limpeza imediata de vencidos (> 6h);
 * 4. Renderiza a casca `<PainelModulo>` sincronizada com a URL (?tab=tokens ou /dashboard/tokens).
 */

import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import PainelModulo from "../common/PainelModulo";
import ModalUsuario from "./ModalUsuario";
import UsuariosFiltros from "./UsuariosFiltros";
import UsuariosTabela from "./UsuariosTabela";
import TokensFiltros from "./TokensFiltros";
import TokensTabela from "./TokensTabela";
import { listarUsuarios } from "../../../services/usuarioService";
import {
  listarTokens,
  revogarToken,
  revogarTokensDoUsuario,
  limparTokensExpirados,
} from "../../../services/tokenService";
import { listarTurmas } from "../../../services/turmasService";

const ABAS_GESTAO_ACESSO = [
  { id: "usuarios", label: "Contas e Acessos", icon: "bi-people-fill" },
  { id: "tokens", label: "Sessões e Tokens (Sanctum)", icon: "bi-key-fill" },
];

export default function UsuariosContainer({ defaultTab = "usuarios" }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deriva a aba ativa diretamente da URL (/dashboard/tokens ou ?tab=tokens) sem duplicar estado em useEffect
  const tabParam = searchParams.get("tab");
  const abaAtiva =
    location.pathname === "/dashboard/tokens" || tabParam === "tokens"
      ? "tokens"
      : tabParam === "usuarios"
        ? "usuarios"
        : defaultTab;

  // Estados da aba de Usuários
  const [usuarios, setUsuarios] = useState([]);
  const [meta, setMeta] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [filtroRole, setFiltroRole] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState(() => searchParams.get("status") || "");
  const [porPagina, setPorPagina] = useState(25);
  const [turmas, setTurmas] = useState([]);
  const [recargaKey, setRecargaKey] = useState(0);

  // Estados da aba de Tokens Sanctum
  const [tokens, setTokens] = useState([]);
  const [metaTokens, setMetaTokens] = useState(null);
  const [resumoTokens, setResumoTokens] = useState(null);
  const [paginaTokens, setPaginaTokens] = useState(1);
  const [filtroStatusToken, setFiltroStatusToken] = useState("");
  const [filtroOrigemToken, setFiltroOrigemToken] = useState("");
  const [buscaToken, setBuscaToken] = useState("");
  const [porPaginaTokens, setPorPaginaTokens] = useState(15);
  const [recargaTokensKey, setRecargaTokensKey] = useState(0);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [revogandoTokenId, setRevogandoTokenId] = useState(null);
  const [revogandoUsuarioId, setRevogandoUsuarioId] = useState(null);
  const [limpandoExpirados, setLimpandoExpirados] = useState(false);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  // Estado do Modal Unificado de Usuário
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const exibirFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  };

  // Troca de aba atualizando o parâmetro ?tab na URL para manter histórico navegável
  const handleTrocarAba = (novaAba) => {
    setErro("");
    const novosParams = new URLSearchParams(searchParams);
    if (novaAba === "tokens") {
      novosParams.set("tab", "tokens");
      novosParams.delete("status");
    } else {
      novosParams.set("tab", "usuarios");
    }
    setSearchParams(novosParams, { replace: true });
  };

  // Carrega catálogo de turmas para o formulário de cadastro/edição de alunos
  useEffect(() => {
    let ativo = true;
    listarTurmas()
      .then((res) => {
        if (!ativo) return;
        setTurmas(Array.isArray(res) ? res : res?.data || []);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  // Mantém a paginação de usuários no servidor com busca debounced
  useEffect(() => {
    if (abaAtiva !== "usuarios") return;
    let ativo = true;

    const timer = setTimeout(() => {
      setLoading(true);
      setErro("");

      listarUsuarios({
        role: filtroRole || undefined,
        busca: buscaNome.trim() || undefined,
        status: filtroStatus || undefined,
        page: pagina,
        per_page: porPagina,
      })
        .then((res) => {
          if (!ativo) return;
          setUsuarios(res?.data || []);
          setMeta(res?.meta || null);
          const ultimaPagina = Math.max(1, Number(res?.meta?.last_page || 1));
          if (pagina > ultimaPagina) setPagina(ultimaPagina);
        })
        .catch((err) => {
          if (!ativo) return;
          setErro(err.message || "Não foi possível carregar os usuários do sistema.");
        })
        .finally(() => {
          if (ativo) setLoading(false);
        });
    }, 200);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [abaAtiva, filtroRole, filtroStatus, buscaNome, pagina, porPagina, recargaKey]);

  // Mantém a paginação de tokens Sanctum no servidor com busca debounced
  useEffect(() => {
    if (abaAtiva !== "tokens") return;
    let ativo = true;

    const timer = setTimeout(() => {
      setLoadingTokens(true);
      setErro("");

      listarTokens({
        status: filtroStatusToken || undefined,
        origem: filtroOrigemToken || undefined,
        busca: buscaToken.trim() || undefined,
        page: paginaTokens,
        per_page: porPaginaTokens,
      })
        .then((res) => {
          if (!ativo) return;
          setTokens(res?.data || []);
          setMetaTokens(res?.meta || null);
          setResumoTokens(res?.resumo || null);
          const ultimaPagina = Math.max(1, Number(res?.meta?.last_page || 1));
          if (paginaTokens > ultimaPagina) setPaginaTokens(ultimaPagina);
        })
        .catch((err) => {
          if (!ativo) return;
          setErro(err.message || "Não foi possível carregar as sessões e tokens Sanctum.");
        })
        .finally(() => {
          if (ativo) setLoadingTokens(false);
        });
    }, 200);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [
    abaAtiva,
    filtroStatusToken,
    filtroOrigemToken,
    buscaToken,
    paginaTokens,
    porPaginaTokens,
    recargaTokensKey,
  ]);

  const handleAbrirNovo = () => {
    setUsuarioSelecionado(null);
    setModalUsuarioAberto(true);
  };

  const handleAbrirEditar = (u) => {
    setUsuarioSelecionado(u);
    setModalUsuarioAberto(true);
  };

  const handleAbrirExcluir = (u) => {
    setUsuarioSelecionado(u);
    setModalUsuarioAberto(true);
  };

  // Deleta manualmente um token específico
  const handleRevogarToken = async (tokenItem) => {
    const dono = tokenItem.usuario?.name || `ID #${tokenItem.id}`;
    const msgConfirmacao = tokenItem.sessao_atual
      ? `Atenção: O Token #${tokenItem.id} pertence à SUA SESSÃO ATUAL.\n\nSe você deletá-lo, sua sessão será encerrada imediatamente. Deseja continuar?`
      : `Deseja deletar manualmente o Token #${tokenItem.id} (${dono})?\n\nO dispositivo conectado será desconectado imediatamente.`;

    if (!window.confirm(msgConfirmacao)) return;

    setRevogandoTokenId(tokenItem.id);
    setErro("");
    try {
      const res = await revogarToken(tokenItem.id);
      if (tokenItem.sessao_atual) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.replace("/login");
        return;
      }
      exibirFeedback(res?.message || `Token #${tokenItem.id} revogado com sucesso!`);
      setRecargaTokensKey((k) => k + 1);
    } catch (err) {
      setErro(err.message || "Erro ao revogar o token.");
    } finally {
      setRevogandoTokenId(null);
    }
  };

  // Revoga todos os tokens de um usuário específico
  const handleRevogarTokensUsuario = async (usuarioAlvo) => {
    if (
      !window.confirm(
        `Deseja encerrar todas as sessões ativas de "${usuarioAlvo.name}" (${usuarioAlvo.email})?`
      )
    ) {
      return;
    }

    setRevogandoUsuarioId(usuarioAlvo.id);
    setErro("");
    try {
      const res = await revogarTokensDoUsuario(usuarioAlvo.id);
      exibirFeedback(res?.message || `Sessões de ${usuarioAlvo.name} encerradas!`);
      setRecargaTokensKey((k) => k + 1);
    } catch (err) {
      setErro(err.message || "Erro ao revogar as sessões do usuário.");
    } finally {
      setRevogandoUsuarioId(null);
    }
  };

  // Aciona manualmente a faxina imediata de tokens vencidos (> 6 horas)
  const handleLimparTokensExpirados = async () => {
    setLimpandoExpirados(true);
    setErro("");
    try {
      const res = await limparTokensExpirados();
      exibirFeedback(res?.message || "Limpeza de tokens vencidos concluída!");
      setRecargaTokensKey((k) => k + 1);
    } catch (err) {
      setErro(err.message || "Erro ao limpar os tokens vencidos.");
    } finally {
      setLimpandoExpirados(false);
    }
  };

  const acoesAtivas =
    abaAtiva === "tokens" ? (
      <TokensFiltros
        filtroStatus={filtroStatusToken}
        filtroOrigem={filtroOrigemToken}
        busca={buscaToken}
        porPagina={porPaginaTokens}
        resumo={resumoTokens}
        limpandoExpirados={limpandoExpirados}
        onLimparExpirados={handleLimparTokensExpirados}
        onStatusChange={(status) => {
          setFiltroStatusToken(status);
          setPaginaTokens(1);
        }}
        onOrigemChange={(origem) => {
          setFiltroOrigemToken(origem);
          setPaginaTokens(1);
        }}
        onBuscaChange={(termo) => {
          setBuscaToken(termo);
          setPaginaTokens(1);
        }}
        onPorPaginaChange={(qtd) => {
          setPorPaginaTokens(qtd);
          setPaginaTokens(1);
        }}
      />
    ) : (
      <UsuariosFiltros
        filtroStatus={filtroStatus}
        filtroRole={filtroRole}
        buscaNome={buscaNome}
        porPagina={porPagina}
        onNovoUsuario={handleAbrirNovo}
        onStatusChange={(status) => {
          setFiltroStatus(status);
          setPagina(1);
        }}
        onRoleChange={(role) => {
          setFiltroRole(role);
          setPagina(1);
        }}
        onBuscaChange={(busca) => {
          setBuscaNome(busca);
          setPagina(1);
        }}
        onPorPaginaChange={(qtd) => {
          setPorPagina(qtd);
          setPagina(1);
        }}
      />
    );

  return (
    <div className="position-relative">
      {/* Toast flutuante de confirmação */}
      {feedback && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {feedback}
        </div>
      )}

      <PainelModulo
        titulo={
          abaAtiva === "tokens"
            ? "Sessões Conectadas e Tokens Sanctum"
            : undefined
        }
        subtitulo={
          abaAtiva === "tokens"
            ? "Auditoria de existência, origem de login, validade de 6 horas e revogação manual de tokens (limpeza automática a cada 8h)."
            : undefined
        }
        icone={abaAtiva === "tokens" ? "bi-key-fill" : undefined}
        abasCustomizadas={ABAS_GESTAO_ACESSO}
        abaAtivaCustomizada={abaAtiva}
        onTrocarAba={handleTrocarAba}
        acoes={acoesAtivas}
      >
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
            {erro}
          </div>
        )}

        {abaAtiva === "tokens" ? (
          <TokensTabela
            tokens={tokens}
            meta={metaTokens}
            resumo={resumoTokens}
            loading={loadingTokens}
            pagina={paginaTokens}
            revogandoId={revogandoTokenId}
            revogandoUsuarioId={revogandoUsuarioId}
            onRevogarToken={handleRevogarToken}
            onRevogarDoUsuario={handleRevogarTokensUsuario}
            onPaginaChange={(novaPagina) => setPaginaTokens(novaPagina)}
          />
        ) : (
          <UsuariosTabela
            usuarios={usuarios}
            meta={meta}
            loading={loading}
            pagina={pagina}
            onEditarUsuario={handleAbrirEditar}
            onExcluirUsuario={handleAbrirExcluir}
            onPaginaChange={(novaPagina) => setPagina(novaPagina)}
          />
        )}
      </PainelModulo>

      {/* Modal Unificado de Usuário: Cadastrar, Editar e Excluir */}
      <ModalUsuario
        show={modalUsuarioAberto}
        usuario={usuarioSelecionado}
        turmas={turmas}
        onClose={() => {
          setModalUsuarioAberto(false);
          setUsuarioSelecionado(null);
        }}
        onSuccess={(_u, msg) => {
          exibirFeedback(msg || "Operação realizada com sucesso!");
          setRecargaKey((k) => k + 1);
        }}
        onDelete={(_u, msg) => {
          exibirFeedback(msg || "Usuário excluído com sucesso!");
          setRecargaKey((k) => k + 1);
        }}
      />
    </div>
  );
}
