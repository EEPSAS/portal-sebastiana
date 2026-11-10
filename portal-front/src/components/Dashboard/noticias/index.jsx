/**
 * index.jsx - Container Inteligente de Gestão de Notícias Escolares (Módulo 2)
 *
 * Papel Didático:
 * Atua como o Smart Container do painel administrativo de notícias:
 * 1. Consome o serviço centralizado (`noticiasService`);
 * 2. Gerencia os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio);
 * 3. Orquestra a abertura, validação e salvamento dos modais (`ModalNoticia` e `ModalExcluirNoticia`);
 * 4. Renderiza a tabela paginada com isolamento visual via `Noticias.css`.
 */

import { useEffect, useState } from 'react';
import PainelModulo from '../common/PainelModulo';
import NoticiasTabela from './NoticiasTabela';
import ModalNoticia from './ModalNoticia';
import ModalExcluirNoticia from './ModalExcluirNoticia';
import {
  listarNoticias,
  criarNoticia,
  atualizarNoticia,
  excluirNoticia,
} from '../../../services/noticiasService';
import './Noticias.css';

const FORMULARIO_INICIAL = {
  titulo: '',
  categoria: 'Geral',
  descricao: '',
  conteudo: '',
  url_foto: '',
  url_miniatura: '',
  arquivo_foto: null,
  arquivo_miniatura: null,
  preview_foto: '',
  preview_miniatura: '',
  destaque: false,
};

export default function NoticiasContainer() {
  const [noticias, setNoticias] = useState([]);
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    totalPaginas: 1,
    total: 0,
    porPagina: 10,
  });
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);

  // Estados de feedback assíncrono
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Estados dos Modais
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [noticiaEmEdicaoId, setNoticiaEmEdicaoId] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errosValidacao, setErrosValidacao] = useState({});
  const [noticiaParaExcluir, setNoticiaParaExcluir] = useState(null);

  useEffect(() => {
    let cancelado = false;

    listarNoticias({ page: pagina, perPage: 10 })
      .then((dados) => {
        if (cancelado) return;
        setNoticias(dados);
        setErro('');
        if (dados.paginacao) setPaginacao(dados.paginacao);
      })
      .catch((err) => {
        if (!cancelado) setErro(err.message || 'Não foi possível carregar as notícias escolares.');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, versao]);

  const recarregar = () => {
    setLoading(true);
    setErro('');
    setVersao((v) => v + 1);
  };

  const irParaPagina = (novaPagina) => {
    setLoading(true);
    setPagina(novaPagina);
  };

  const handleAbrirCriacao = () => {
    setModoEdicao(false);
    setNoticiaEmEdicaoId(null);
    setFormulario(FORMULARIO_INICIAL);
    setErrosValidacao({});
    setModalFormularioAberto(true);
  };

  const handleAbrirEdicao = (item) => {
    setModoEdicao(true);
    setNoticiaEmEdicaoId(item.id);
    setFormulario({
      titulo: item.titulo || '',
      categoria: item.categoria || 'Geral',
      descricao: item.descricao || '',
      conteudo: item.conteudo || '',
      url_foto: item.url_foto || item.imagem || '',
      url_miniatura: item.url_miniatura || item.miniatura || '',
      arquivo_foto: null,
      arquivo_miniatura: null,
      preview_foto: item.url_foto || item.imagem || '',
      preview_miniatura: item.url_miniatura || item.miniatura || '',
      destaque: Boolean(item.destaque),
    });
    setErrosValidacao({});
    setModalFormularioAberto(true);
  };

  const handleCampoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errosValidacao[name]) {
      setErrosValidacao((prev) => {
        const novos = { ...prev };
        delete novos[name];
        return novos;
      });
    }
  };

  const handleArquivoChange = (e, tipo) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (tipo === 'foto') {
      setFormulario((prev) => ({
        ...prev,
        arquivo_foto: file,
        preview_foto: previewUrl,
      }));
    } else if (tipo === 'miniatura') {
      setFormulario((prev) => ({
        ...prev,
        arquivo_miniatura: file,
        preview_miniatura: previewUrl,
      }));
    }
  };

  const handleSalvarNoticia = async (e) => {
    e.preventDefault();

    const erros = {};
    if (!formulario.titulo.trim()) erros.titulo = 'O título é obrigatório.';
    if (!formulario.conteudo.trim()) erros.conteudo = 'O conteúdo é obrigatório.';

    if (Object.keys(erros).length > 0) {
      setErrosValidacao(erros);
      return;
    }

    setSalvando(true);
    setErrosValidacao({});

    try {
      if (modoEdicao && noticiaEmEdicaoId) {
        await atualizarNoticia(noticiaEmEdicaoId, formulario);
        setMensagemSucesso('Notícia atualizada com sucesso!');
      } else {
        await criarNoticia(formulario);
        setMensagemSucesso('Notícia publicada com sucesso!');
      }

      setModalFormularioAberto(false);
      recarregar();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      if (err.errors) {
        setErrosValidacao(err.errors);
      } else {
        setErrosValidacao({ geral: err.message || 'Erro ao salvar a notícia.' });
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!noticiaParaExcluir) return;

    setExcluindoId(noticiaParaExcluir.id);
    try {
      await excluirNoticia(noticiaParaExcluir.id);
      setMensagemSucesso(`Notícia "${noticiaParaExcluir.titulo}" removida com sucesso.`);
      setNoticiaParaExcluir(null);
      recarregar();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      setErro(err.message || 'Não foi possível remover a notícia.');
      setNoticiaParaExcluir(null);
    } finally {
      setExcluindoId(null);
    }
  };

  const acoesNoticias = (
    <button
      type="button"
      className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-2"
      onClick={handleAbrirCriacao}
      title="Cadastrar nova notícia ou comunicado escolar"
    >
      <i className="bi bi-plus-lg"></i>
      <span>Nova Notícia</span>
    </button>
  );

  return (
    <div className="position-relative">
      <PainelModulo acoes={acoesNoticias}>
        {/* Alerta de Sucesso Temporário */}
        {mensagemSucesso && (
          <div className="alert alert-success alert-dismissible fade show d-flex align-items-center shadow-sm rounded-3 mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{mensagemSucesso}</div>
            <button
              type="button"
              className="btn-close ms-auto"
              aria-label="Fechar"
              onClick={() => setMensagemSucesso('')}
            ></button>
          </div>
        )}

        {/* Estado: Erro Amigável */}
        {erro && (
          <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center shadow-sm rounded-3 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div className="flex-grow-1">{erro}</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={recarregar}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              className="btn-close ms-2"
              aria-label="Fechar"
              onClick={() => setErro('')}
            ></button>
          </div>
        )}

        {/* Estado 1: Carregando */}
        {loading && (
          <div className="text-center py-5 my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando notícias...</span>
            </div>
            <p className="text-muted mt-2 small">Carregando matérias escolares...</p>
          </div>
        )}

        {/* Estado 2: Vazio */}
        {!loading && !erro && noticias.length === 0 && (
          <div className="card border-0 shadow-sm text-center py-5 rounded-4">
            <div className="card-body">
              <div className="display-4 text-muted mb-3">
                <i className="bi bi-newspaper"></i>
              </div>
              <h3 className="h5 fw-semibold text-dark">Nenhuma notícia encontrada</h3>
              <p className="text-muted small mb-4">
                Ainda não há comunicados publicados no portal da escola.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm px-4 fw-semibold"
                onClick={handleAbrirCriacao}
              >
                Publicar Primeira Notícia
              </button>
            </div>
          </div>
        )}

        {/* Estado 3: Lista de Dados */}
        {!loading && !erro && noticias.length > 0 && (
          <NoticiasTabela
            noticias={noticias}
            paginacao={paginacao}
            paginaAtual={pagina}
            onAbrirEdicao={handleAbrirEdicao}
            onSolicitarExclusao={(item) => setNoticiaParaExcluir(item)}
            onMudarPagina={irParaPagina}
          />
        )}
      </PainelModulo>

      {/* Modal 1: Formulário de Criação / Edição */}
      <ModalNoticia
        aberto={modalFormularioAberto}
        modoEdicao={modoEdicao}
        formulario={formulario}
        errosValidacao={errosValidacao}
        salvando={salvando}
        onFechar={() => setModalFormularioAberto(false)}
        onCampoChange={handleCampoChange}
        onArquivoChange={handleArquivoChange}
        onSubmit={handleSalvarNoticia}
      />

      {/* Modal 2: Confirmação de Exclusão */}
      <ModalExcluirNoticia
        noticia={noticiaParaExcluir}
        excluindoId={excluindoId}
        onFechar={() => setNoticiaParaExcluir(null)}
        onConfirmar={handleConfirmarExclusao}
      />
    </div>
  );
}
