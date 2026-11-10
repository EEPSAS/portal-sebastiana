/**
 * index.jsx - Container Inteligente de Gestão de Usuários (Módulo 6)
 *
 * Papel Didático:
 * Atua como o Smart Container do módulo de administração de usuários (Role: Admin):
 * 1. Consome o serviço `usuarioService` e carrega catálogo de turmas para estudantes;
 * 2. Aplica debounce de 200ms na busca textual e filtros reativos;
 * 3. Orquestra a exibição de feedback flutuante (toast) e o `ModalUsuario` unificado;
 * 4. Renderiza a casca `<PainelModulo>` com `<UsuariosFiltros />` e `<UsuariosTabela />`.
 */

import { useEffect, useState } from "react";
import PainelModulo from "../common/PainelModulo";
import ModalUsuario from "./ModalUsuario";
import UsuariosFiltros from "./UsuariosFiltros";
import UsuariosTabela from "./UsuariosTabela";
import { listarUsuarios } from "../../../services/usuarioService";
import { listarTurmas } from "../../../services/turmasService";

export default function UsuariosContainer() {
  const [usuarios, setUsuarios] = useState([]);
  const [meta, setMeta] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [filtroRole, setFiltroRole] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [porPagina, setPorPagina] = useState(25);
  const [turmas, setTurmas] = useState([]);
  const [recargaKey, setRecargaKey] = useState(0);

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

  // Mantém a paginação no servidor com busca debounced
  useEffect(() => {
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
  }, [filtroRole, filtroStatus, buscaNome, pagina, porPagina, recargaKey]);

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

  const acoesUsuarios = (
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

      <PainelModulo acoes={acoesUsuarios}>
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {erro}
          </div>
        )}

        <UsuariosTabela
          usuarios={usuarios}
          meta={meta}
          loading={loading}
          pagina={pagina}
          onEditarUsuario={handleAbrirEditar}
          onExcluirUsuario={handleAbrirExcluir}
          onPaginaChange={(novaPagina) => setPagina(novaPagina)}
        />
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
