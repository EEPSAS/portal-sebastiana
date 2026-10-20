/**
 * Noticias.jsx - Gestão Completa de Notícias Escolares (Especialista e Administrador)
 *
 * Papel Didático:
 * Tela principal do Módulo 2 no Dashboard (/dashboard/noticias).
 * Demonstra a implementação de um CRUD completo em React SPA moderno:
 * 1. Consumo do serviço centralizado (noticiasService);
 * 2. Controle dos 3 estados assíncronos (Carregando, Vazio e Erro);
 * 3. Modal Bootstrap para Criação e Edição com pré-visualização de imagem;
 * 4. Modal de Confirmação para Exclusão segura;
 * 5. Paginação declarativa e feedback imediato de sucesso ao usuário.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  atualizarNoticia,
  criarNoticia,
  excluirNoticia,
  listarNoticias,
} from '../../services/noticiasService';
import './Noticias.css';

// Categorias oficiais padronizadas do ambiente escolar
const CATEGORIAS_SUGERIDAS = [
  'Geral',
  'Avisos',
  'Pedagógico',
  'Eventos',
  'Biblioteca',
  'Projetos',
];

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

const DashboardNoticias = () => {
  const { user } = useAuth();
  // Ativa o tema institucional exclusivamente para Especialista e Administrador
  const podeGerenciar = user?.role === 'especialista' || user?.role === 'adm';

  // Estado da listagem e paginação
  const [noticias, setNoticias] = useState([]);
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    totalPaginas: 1,
    total: 0,
    porPagina: 10,
  });
  const [pagina, setPagina] = useState(1);

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

  // Estado do Modal de Confirmação de Exclusão
  const [noticiaParaExcluir, setNoticiaParaExcluir] = useState(null);

  // Contador de recarga: incrementá-lo faz o efeito buscar a lista novamente
  const [versao, setVersao] = useState(0);

  // Efeito disparado na montagem, na troca de página ou ao pedir recarga.
  // Só chama setState dentro dos callbacks da Promise (nunca de forma síncrona no efeito).
  useEffect(() => {
    let cancelado = false; // Evita atualizar estado se o componente desmontar no meio da requisição

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

  // Recarrega a página atual (usado após criar, editar ou excluir)
  const recarregar = () => {
    setLoading(true);
    setErro('');
    setVersao((v) => v + 1);
  };

  // Troca de página exibindo o spinner enquanto a nova página chega
  const irParaPagina = (novaPagina) => {
    setLoading(true);
    setPagina(novaPagina);
  };

  /**
   * Abre o modal para cadastro de nova notícia.
   */
  const handleAbrirCriacao = () => {
    setModoEdicao(false);
    setNoticiaEmEdicaoId(null);
    setFormulario(FORMULARIO_INICIAL);
    setErrosValidacao({});
    setModalFormularioAberto(true);
  };

  /**
   * Abre o modal preenchido para edição de notícia existente.
   */
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

  /**
   * Atualiza os campos do formulário no estado local.
   */
  const handleCampoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpa erro específico do campo digitado
    if (errosValidacao[name]) {
      setErrosValidacao((prev) => {
        const novos = { ...prev };
        delete novos[name];
        return novos;
      });
    }
  };

  /**
   * Trata a seleção de arquivo de imagem (Capa ou Miniatura) gerando pré-visualização instantânea.
   */
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

  /**
   * Salva a notícia (Criação ou Atualização).
   */
  const handleSalvarNoticia = async (e) => {
    e.preventDefault();

    // Validação básica local antes da requisição
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

      // Limpa mensagem de sucesso após 4 segundos
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      if (err.errors) {
        setErrosValidacao(err.errors);
      } else {
        // Erro geral (ex.: 403 ou 500) fica dentro do modal, pois o banner da página está atrás dele
        setErrosValidacao({ geral: err.message || 'Erro ao salvar a notícia.' });
      }
    } finally {
      setSalvando(false);
    }
  };

  /**
   * Abre o modal de confirmação de exclusão.
   */
  const handleSolicitarExclusao = (item) => {
    setNoticiaParaExcluir(item);
  };

  /**
   * Confirma a remoção da notícia via API.
   */
  const handleConfirmarExclusao = async () => {
    if (!noticiaParaExcluir) return;

    setExcluindoId(noticiaParaExcluir.id);
    try {
      await excluirNoticia(noticiaParaExcluir.id);
      setMensagemSucesso(`Notícia "${noticiaParaExcluir.titulo}" removida com sucesso.`);
      setNoticiaParaExcluir(null);

      // Recarrega listagem
      recarregar();

      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      setErro(err.message || 'Não foi possível remover a notícia.');
      setNoticiaParaExcluir(null);
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div className={`container-fluid py-3 position-relative ${podeGerenciar ? 'dashboard-tema-gestao' : ''}`.trim()}>
      {/* Cabeçalho da Página */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1 dashboard-header-titulo">
            <i className="bi bi-newspaper text-primary me-2"></i>
            Gestão de Notícias
          </h2>
          <p className="text-muted small mb-0">
            Publique, edite e gerencie informativos e comunicados da comunidade escolar.
          </p>
          {/* Linha divisória clássica de 48px: visível apenas no tema de gestão */}
          {podeGerenciar && <span className="dashboard-header-divisor" aria-hidden="true" />}
        </div>
        <button
          type="button"
          className="btn btn-primary fw-semibold d-flex align-items-center gap-2 shadow-sm"
          onClick={handleAbrirCriacao}
        >
          <i className="bi bi-plus-lg"></i>
          <span>Nova Notícia</span>
        </button>
      </div>

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
            <h5 className="fw-semibold text-dark">Nenhuma notícia encontrada</h5>
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

      {/* Estado 3: Lista de Dados Reais */}
      {!loading && !erro && noticias.length > 0 && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '80px' }}>Foto</th>
                  <th scope="col">Título e Resumo</th>
                  <th scope="col" style={{ width: '130px' }}>Categoria</th>
                  <th scope="col" style={{ width: '140px' }}>Autor</th>
                  <th scope="col" style={{ width: '110px' }}>Data</th>
                  <th scope="col" style={{ width: '100px' }} className="text-center">Destaque</th>
                  <th scope="col" style={{ width: '140px' }} className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {noticias.map((item) => (
                  <tr key={item.id}>
                    {/* Miniatura da Imagem */}
                    <td>
                      {item.url_foto ? (
                        <img
                          src={item.url_foto}
                          alt={item.titulo}
                          className="rounded-3 object-fit-cover shadow-sm"
                          style={{ width: '60px', height: '45px' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light text-muted d-flex align-items-center justify-content-center rounded-3 border"
                          style={{ width: '60px', height: '45px' }}
                        >
                          <i className="bi bi-image fs-5"></i>
                        </div>
                      )}
                    </td>

                    {/* Título e Resumo */}
                    <td>
                      <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '380px' }}>
                        {item.titulo}
                      </div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '380px' }}>
                        {item.descricao || item.conteudo}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1">
                        {item.categoria || 'Geral'}
                      </span>
                    </td>

                    {/* Autor */}
                    <td className="text-muted small">
                      <i className="bi bi-person me-1"></i>
                      {item.autor}
                    </td>

                    {/* Data */}
                    <td className="text-muted small">
                      {item.dataPublicacao || 'Recente'}
                    </td>

                    {/* Destaque */}
                    <td className="text-center">
                      {item.destaque ? (
                        <span className="badge bg-warning text-dark px-2 py-1 rounded-pill" title="Notícia Principal em Destaque">
                          <i className="bi bi-star-fill me-1"></i> Sim
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    {/* Ações (Editar e Excluir) */}
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="Editar Notícia"
                          onClick={() => handleAbrirEdicao(item)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Excluir Notícia"
                          onClick={() => handleSolicitarExclusao(item)}
                          disabled={excluindoId === item.id}
                        >
                          {excluindoId === item.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé da Tabela: Paginação */}
          {paginacao.totalPaginas > 1 && (
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3">
              <span className="text-muted small">
                Página <strong>{paginacao.paginaAtual}</strong> de <strong>{paginacao.totalPaginas}</strong> ({paginacao.total} matérias)
              </span>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={paginacao.paginaAtual <= 1}
                  onClick={() => irParaPagina(Math.max(1, pagina - 1))}
                >
                  <i className="bi bi-chevron-left me-1"></i> Anterior
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={paginacao.paginaAtual >= paginacao.totalPaginas}
                  onClick={() => irParaPagina(pagina + 1)}
                >
                  Próxima <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Criação e Edição de Notícia                                     */}
      {/* ========================================================================= */}
      {modalFormularioAberto && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 d-flex flex-column" style={{ maxHeight: '90vh' }}>
              <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0 bg-white">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className={`bi ${modoEdicao ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'}`}></i>
                  {modoEdicao ? 'Editar Notícia Escolar' : 'Cadastrar Nova Notícia'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  disabled={salvando}
                  onClick={() => setModalFormularioAberto(false)}
                ></button>
              </div>

              <form onSubmit={handleSalvarNoticia} className="d-flex flex-column flex-grow-1 overflow-hidden m-0">
                <div className="modal-body px-4 py-3 overflow-y-auto" style={{ flex: '1 1 auto' }}>
                  {/* Erro geral de salvamento (não associado a um campo específico) */}
                  {errosValidacao.geral && (
                    <div className="alert alert-danger small py-2" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {errosValidacao.geral}
                    </div>
                  )}
                  <div className="row g-3">
                    {/* Título */}
                    <div className="col-12 col-md-8">
                      <label htmlFor="titulo" className="form-label fw-semibold small text-dark">
                        Título da Matéria <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="titulo"
                        name="titulo"
                        className={`form-control ${errosValidacao.titulo ? 'is-invalid' : ''}`}
                        placeholder="Ex: Semana de Avaliações Institucionais 2026"
                        value={formulario.titulo}
                        onChange={handleCampoChange}
                        disabled={salvando}
                        required
                      />
                      {errosValidacao.titulo && (
                        <div className="invalid-feedback">
                          {Array.isArray(errosValidacao.titulo) ? errosValidacao.titulo[0] : errosValidacao.titulo}
                        </div>
                      )}
                    </div>

                    {/* Categoria */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="categoria" className="form-label fw-semibold small text-dark">
                        Categoria
                      </label>
                      <select
                        id="categoria"
                        name="categoria"
                        className="form-select"
                        value={formulario.categoria}
                        onChange={handleCampoChange}
                        disabled={salvando}
                      >
                        {CATEGORIAS_SUGERIDAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Resumo / Descrição Curta */}
                    <div className="col-12">
                      <label htmlFor="descricao" className="form-label fw-semibold small text-dark">
                        Resumo / Descrição Breve
                      </label>
                      <input
                        type="text"
                        id="descricao"
                        name="descricao"
                        className="form-control"
                        placeholder="Breve linha explicativa que aparece nos cards do portal"
                        value={formulario.descricao}
                        onChange={handleCampoChange}
                        disabled={salvando}
                        maxLength={500}
                      />
                    </div>

                    {/* Conteúdo Completo */}
                    <div className="col-12">
                      <label htmlFor="conteudo" className="form-label fw-semibold small text-dark">
                        Conteúdo Completo da Matéria <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="conteudo"
                        name="conteudo"
                        rows={5}
                        className={`form-control ${errosValidacao.conteudo ? 'is-invalid' : ''}`}
                        placeholder="Escreva detalhadamente o comunicado ou matéria escolar..."
                        value={formulario.conteudo}
                        onChange={handleCampoChange}
                        disabled={salvando}
                        required
                      ></textarea>
                      {errosValidacao.conteudo && (
                        <div className="invalid-feedback">
                          {Array.isArray(errosValidacao.conteudo) ? errosValidacao.conteudo[0] : errosValidacao.conteudo}
                        </div>
                      )}
                    </div>

                    {/* Switch de Notícia em Destaque */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div>
                          <span className="fw-semibold text-dark d-block">
                            <i className="bi bi-star-fill text-warning me-2"></i>
                            Notícia em Destaque Principal
                          </span>
                          <small className="text-muted">
                            Se ativado, esta notícia ocupará a posição principal e desmarcará qualquer destaque anterior.
                          </small>
                        </div>
                        <div className="form-check form-switch fs-4 mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="destaque"
                            name="destaque"
                            checked={formulario.destaque}
                            onChange={handleCampoChange}
                            disabled={salvando}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload da Imagem de Capa (Principal) */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="arquivo_foto" className="form-label fw-semibold small text-dark d-flex align-items-center gap-1">
                        <i className="bi bi-image text-primary"></i>
                        <span>Imagem de Capa (Principal)</span>
                      </label>
                      <input
                        type="file"
                        id="arquivo_foto"
                        className="form-control form-control-sm"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleArquivoChange(e, 'foto')}
                        disabled={salvando}
                      />
                      <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                        Exibida no topo da matéria e no destaque horizontal da Home.
                      </div>

                      {/* Pré-visualização da Capa */}
                      {formulario.preview_foto && (
                        <div className="mt-2 p-1 border rounded-3 bg-light text-center position-relative">
                          <img
                            src={formulario.preview_foto}
                            alt="Pré-visualização da Capa"
                            className="img-fluid rounded-2 shadow-sm"
                            style={{ maxHeight: '90px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="badge bg-primary position-absolute top-0 start-0 m-1" style={{ fontSize: '0.65rem' }}>Capa</span>
                        </div>
                      )}
                    </div>

                    {/* Upload da Imagem de Miniatura */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="arquivo_miniatura" className="form-label fw-semibold small text-dark d-flex align-items-center gap-1">
                        <i className="bi bi-file-earmark-image text-success"></i>
                        <span>Imagem de Miniatura</span>
                      </label>
                      <input
                        type="file"
                        id="arquivo_miniatura"
                        className="form-control form-control-sm"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleArquivoChange(e, 'miniatura')}
                        disabled={salvando}
                      />
                      <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                        Exibida nos cards secundários da Home e listagens compactas.
                      </div>

                      {/* Pré-visualização da Miniatura */}
                      {formulario.preview_miniatura && (
                        <div className="mt-2 p-1 border rounded-3 bg-light text-center position-relative">
                          <img
                            src={formulario.preview_miniatura}
                            alt="Pré-visualização da Miniatura"
                            className="img-fluid rounded-2 shadow-sm"
                            style={{ maxHeight: '90px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="badge bg-success position-absolute top-0 start-0 m-1" style={{ fontSize: '0.65rem' }}>Miniatura</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé Fixo (Sticky Footer) sempre visível */}
                <div className="modal-footer border-top px-4 py-3 flex-shrink-0 bg-white" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={salvando}
                    onClick={() => setModalFormularioAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold px-4 d-flex align-items-center gap-2"
                    disabled={salvando}
                  >
                    {salvando ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        <span>{modoEdicao ? 'Salvar Alterações' : 'Publicar Notícia'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Confirmação de Exclusão                                          */}
      {/* ========================================================================= */}
      {noticiaParaExcluir && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-2">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <i className="bi bi-trash-fill"></i> Confirmar Exclusão
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  disabled={excluindoId !== null}
                  onClick={() => setNoticiaParaExcluir(null)}
                ></button>
              </div>
              <div className="modal-body px-4 py-3">
                <p className="text-dark mb-2">
                  Tem certeza que deseja excluir permanentemente a notícia:
                </p>
                <div className="p-3 bg-light rounded-3 border fw-semibold text-dark mb-3">
                  {noticiaParaExcluir.titulo}
                </div>
                <p className="text-muted small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Esta ação não pode ser desfeita e a matéria deixará de ser exibida no portal escolar.
                </p>
              </div>
              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={excluindoId !== null}
                  onClick={() => setNoticiaParaExcluir(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold px-4 d-flex align-items-center gap-2"
                  disabled={excluindoId !== null}
                  onClick={handleConfirmarExclusao}
                >
                  {excluindoId !== null ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash"></i>
                      <span>Sim, Excluir Notícia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardNoticias;
