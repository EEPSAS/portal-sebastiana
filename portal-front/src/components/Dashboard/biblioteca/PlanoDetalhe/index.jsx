/**
 * index.jsx - Container Inteligente de Detalhes do Plano de Estudos (Módulo 3.4)
 *
 * Papel Didático:
 * Atua como o Smart Container da visualização detalhada da trilha pedagógica:
 * 1. Consome o serviço `planosService.obterPorId(id)`;
 * 2. Trata visualmente os estados assíncronos (Carregando, Erro Amigável e Conteúdo);
 * 3. Gerencia a desvinculação de materiais do plano preservando o catálogo original;
 * 4. Renderiza `<PlanoDetalheHeader />` e as seções modulares `<PlanoSecaoItens />`.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import PainelModulo from '../../common/PainelModulo';
import PlanoDetalheHeader from './PlanoDetalheHeader';
import PlanoSecaoItens from './PlanoSecaoItens';
import { planosService } from '../../../../services/biblioteca/planosService';
import '../Biblioteca.css';

export default function PlanoDetalheContainer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [removendoId, setRemovendoId] = useState(null);
  const [notificacao, setNotificacao] = useState('');

  useEffect(() => {
    let montado = true;

    if (id) {
      planosService
        .obterPorId(id)
        .then((dados) => {
          if (!montado) return;
          setPlano(dados);
        })
        .catch((err) => {
          if (!montado) return;
          setErro(err.message || 'Erro ao carregar o plano de estudos.');
        })
        .finally(() => {
          if (!montado) return;
          setCarregando(false);
        });
    }

    return () => {
      montado = false;
    };
  }, [id]);

  const handleRemoverItem = async (itemId) => {
    if (!window.confirm('Deseja realmente desvincular este conteúdo do plano de estudos?')) {
      return;
    }

    try {
      setRemovendoId(itemId);
      await planosService.removerItem(plano.id, itemId);

      setPlano((prev) => {
        if (!prev) return prev;
        const novosItens = (prev.itens || []).filter((it) => it.id !== itemId);
        const tipoRemovido = prev.itens?.find((it) => it.id === itemId)?.tipo;

        return {
          ...prev,
          itens: novosItens,
          livros_count: tipoRemovido === 'livro' ? Math.max(0, prev.livros_count - 1) : prev.livros_count,
          videoaulas_count: tipoRemovido === 'videoaula' ? Math.max(0, prev.videoaulas_count - 1) : prev.videoaulas_count,
          conteudos_web_count: tipoRemovido === 'conteudo_web' ? Math.max(0, prev.conteudos_web_count - 1) : prev.conteudos_web_count,
          total_itens: Math.max(0, (prev.total_itens || novosItens.length) - 1),
        };
      });

      setNotificacao('Conteúdo desvinculado do plano com sucesso.');
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert(err.message || 'Erro ao desvincular item.');
    } finally {
      setRemovendoId(null);
    }
  };

  if (carregando) {
    return (
      <div className="container py-5 text-center text-muted" role="status">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="fw-semibold">Carregando plano de estudos completo...</p>
      </div>
    );
  }

  if (erro || !plano) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning rounded-4 p-4 shadow-sm" role="alert">
          <h3 className="alert-heading h5 fw-bold">Não foi possível carregar o plano</h3>
          <p className="mb-3">{erro || 'Plano de estudos não encontrado.'}</p>
          <button
            type="button"
            className="btn btn-sm btn-dark rounded-pill px-4"
            onClick={() => navigate('/dashboard/biblioteca')}
          >
            ← Voltar para a Biblioteca
          </button>
        </div>
      </div>
    );
  }

  const itens = plano.itens || [];
  const livros = itens.filter((i) => i.tipo === 'livro');
  const videoaulas = itens.filter((i) => i.tipo === 'videoaula');
  const conteudosWeb = itens.filter((i) => i.tipo === 'conteudo_web');
  const podeEditarItens = plano.eh_proprietario !== false;

  const acoesPlano = (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <Link
        to="/dashboard/biblioteca?tab=planos"
        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold text-nowrap"
      >
        ← Voltar aos Planos
      </Link>
      <div className="d-flex align-items-center gap-1 bg-light px-3 py-1 rounded-pill border small">
        <span className="text-secondary fw-semibold">Total:</span>
        <span className="badge bg-primary rounded-pill">{itens.length}</span>
      </div>
    </div>
  );

  return (
    <div className="position-relative">
      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div className="biblioteca-toast">
          <span>✓ {notificacao}</span>
        </div>
      )}

      <PainelModulo
        titulo="Conteúdo - Plano de Estudos"
        subtitulo={
          plano.nome
            ? `${plano.nome}${plano.descricao ? ` · ${plano.descricao}` : ''}`
            : 'Trilha de aprendizagem e materiais pedagógicos.'
        }
        icone="bi-list-check"
        acoes={acoesPlano}
      >
        {/* Cabeçalho de Metadados e Cards Contadores */}
        <PlanoDetalheHeader
          plano={plano}
          totalLivros={livros.length}
          totalVideos={videoaulas.length}
          totalWeb={conteudosWeb.length}
        />

        {/* 1. Livros Vinculados */}
        <PlanoSecaoItens
          idSecao="secao-livros"
          tipo="livro"
          tituloSecao="Livros Vinculados"
          icone="📘"
          itens={livros}
          mensagemVazio="Nenhum livro vinculado a este plano. Vá até a aba Acervo de Livros para adicionar exemplares."
          rotuloAcessar="Acessar Obra"
          podeEditarItens={podeEditarItens}
          removendoId={removendoId}
          onRemoverItem={handleRemoverItem}
        />

        {/* 2. Videoaulas do YouTube */}
        <PlanoSecaoItens
          idSecao="secao-videoaulas"
          tipo="videoaula"
          tituloSecao="Videoaulas do YouTube"
          icone="📺"
          itens={videoaulas}
          mensagemVazio="Nenhuma videoaula vinculada a este plano. Vá até a aba Videoaulas para pesquisar e adicionar vídeos."
          rotuloAcessar="Assistir no YouTube"
          podeEditarItens={podeEditarItens}
          removendoId={removendoId}
          onRemoverItem={handleRemoverItem}
        />

        {/* 3. Conteúdo Didático Web */}
        <PlanoSecaoItens
          idSecao="secao-web"
          tipo="conteudo_web"
          tituloSecao="Conteúdos Didáticos Web"
          icone="📄"
          itens={conteudosWeb}
          mensagemVazio="Nenhum conteúdo web vinculado a este plano. Vá até a aba Conteúdo Web para pesquisar referências."
          rotuloAcessar="Abrir Conteúdo"
          podeEditarItens={podeEditarItens}
          removendoId={removendoId}
          onRemoverItem={handleRemoverItem}
        />
      </PainelModulo>
    </div>
  );
}
