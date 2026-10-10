import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import CardLivro from './CardLivro';
import DetalheLivroModal from './DetalheLivroModal';
import { hasPortalSession, loadBiblioteca, saveBiblioteca } from '../../../../services/bibliotecaService';
import { searchYouTubeVideos, validateYouTubeVideo } from '../../../../services/youtubeApi';
import './VideoAulas.css';

const MATERIAS_DISPONIVEIS = [
  "Matemática", "Português", "Redação", "Física", "Química",
  "Biologia", "História", "Geografia", "Filosofia", "Sociologia",
  "Inglês", "Espanhol"
];

const ABAS_BIBLIOTECA = [
  { id: 'acervo', label: 'Acervo de Livros' },
  { id: 'planos', label: 'Planos de Estudos' },
  { id: 'videoaulas', label: 'Videoaulas' },
  { id: 'apostilas', label: 'Conteúdo web' }
];

const normalizarTexto = (valor = '') => valor
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const PALETA_CORES = [
  { hex: '#2563eb', nome: 'Azul' }, { hex: '#e6007e', nome: 'Rosa' },
  { hex: '#d97706', nome: 'Laranja' }, { hex: '#059669', nome: 'Verde' },
  { hex: '#7c3aed', nome: 'Roxo' }, { hex: '#dc2626', nome: 'Vermelho' },
  { hex: '#1e293b', nome: 'Grafite' }
];

const mensagemErroYouTube = (error) => {
  const mensagens = {
    MISSING_API_KEY: 'A chave da API do YouTube não foi configurada.',
    API_ACCESS_FAILURE: 'Não foi possível acessar o YouTube. Verifique a chave e a cota da API.',
    API_FAILURE: 'O YouTube não conseguiu concluir a solicitação. Tente novamente.',
    CONNECTION_FAILURE: 'Problema de conexão. Verifique sua internet e tente novamente.',
    INVALID_VIDEO_ID: 'Este vídeo possui um identificador inválido.',
    VIDEO_UNAVAILABLE: 'Este vídeo está indisponível no YouTube.'
  };

  return mensagens[error.code] ?? 'Não foi possível carregar o vídeo. Tente novamente.';
};

const MOCK_LIVROS = [
  { id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis', status: 'Disponível', nota: '4.8', imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', comentarios: [{ nome: 'João Santos', texto: 'Uma leitura emocionante que faz pensar sobre a realidade dos personagens.', nota: 5, data: '14/09/2026' }, { nome: 'Beatriz Costa', texto: 'Gostei muito da narrativa e recomendo para a turma.', nota: 4, data: '10/09/2026' }] },
  { id: 2, titulo: 'O Cortiço', autor: 'Aluísio Azevedo', status: 'Emprestado', aluno: 'João Silva', nota: '4.4', imagem: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', comentarios: [] },
  { id: 3, titulo: 'Vidas Secas', autor: 'Graciliano Ramos', status: 'Disponível', nota: '4.6', imagem: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', comentarios: [] },
  { id: 4, titulo: 'Capitães da Areia', autor: 'Jorge Amado', status: 'Disponível', nota: '4.7', imagem: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&q=80', comentarios: [] }
];

const MOCK_PLANOS = [
  { id: 1, nome: 'Geopolítica para o ENEM', disciplina: 'Geografia', livroIds: [1, 2], apostilaIds: [1], ativo: true },
  { id: 2, nome: 'Inglês Básico: Gramática', disciplina: 'Inglês', livroIds: [1], apostilaIds: [], ativo: false },
  { id: 3, nome: 'Intensivo de Exatas', disciplina: 'Matemática', livroIds: [], apostilaIds: [1, 2, 3], ativo: false }
];

const MOCK_APOSTILAS = [
  { id: 1, titulo: 'Apostila Completa de Funções — 1º Ano', materia: 'Matemática', descricao: 'Conteúdo de apoio e exercícios de funções.', topico: 'Funções', tipo: 'Apostila', nivel: '1º ano', autor: 'Equipe pedagógica', corBadge: '#e0f2fe', corTexto: '#0284c7' },
  { id: 2, titulo: 'Resumo Ilustrado de Brasil Colônia', materia: 'História', descricao: 'Resumo dos principais períodos e acontecimentos.', topico: 'Brasil Colônia', tipo: 'Resumo', nivel: 'Ensino médio', autor: 'Equipe pedagógica', corBadge: '#fef3c7', corTexto: '#b45309' },
  { id: 3, titulo: 'Manual de Redação ENEM', materia: 'Redação', descricao: 'Orientações para estruturar e revisar textos dissertativos.', topico: 'Redação dissertativa', tipo: 'Manual', nivel: 'ENEM', autor: 'Equipe pedagógica', corBadge: '#ffe4e6', corTexto: '#e11d48' }
];

export default function BibliotecaPadrao() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('acervo');
  const [busca, setBusca] = useState('');

  // NOTIFICAÇÕES E EXCLUSÃO GERAL
  const [notificacao, setNotificacao] = useState(null);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const dispararAviso = (msg) => {
    setNotificacao(msg);
    setTimeout(() => setNotificacao(null), 3500);
  };

  // MODAIS (LIVROS)
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalFormLivroAberto, setModalFormLivroAberto] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState(null);
  const [modalFormApostilaAberto, setModalFormApostilaAberto] = useState(false);
  const [formData, setFormData] = useState({ id: null, titulo: '', autor: '', status: 'Disponível', aluno: '', imagem: '', nota: '4.5' });
  const [formApostila, setFormApostila] = useState({ id: null, titulo: '', materia: 'Matemática', descricao: '', url: '', topico: '', tipo: 'Apostila', nivel: '', autor: '', corBadge: '#e0f2fe', corTexto: '#0284c7' });
  const [videoBusca, setVideoBusca] = useState('');
  const [videosEncontrados, setVideosEncontrados] = useState([]);
  const [videoBuscaCarregando, setVideoBuscaCarregando] = useState(false);
  const [videoBuscaTentada, setVideoBuscaTentada] = useState(false);
  const [videoBuscaErro, setVideoBuscaErro] = useState('');
  const [videoSelecionado, setVideoSelecionado] = useState(null);
  const [urlVideoSelecionada, setUrlVideoSelecionada] = useState('');
  const [videoVerificandoId, setVideoVerificandoId] = useState('');
  const [videoPlayerErro, setVideoPlayerErro] = useState('');
  const buscaYouTubeController = useRef(null);
  const [bibliotecaCarregada, setBibliotecaCarregada] = useState(false);
  const [carregandoBiblioteca, setCarregandoBiblioteca] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [estadoSalvamento, setEstadoSalvamento] = useState('');
  const [tentativaCarregamento, setTentativaCarregamento] = useState(0);
  const [tentativaSalvamento, setTentativaSalvamento] = useState(0);
  const filaSalvamento = useRef(Promise.resolve());
  const versaoSalvamento = useRef(0);
  const corDestaque = PALETA_CORES[1]?.hex ?? '#e6007e';

  // 1. ACERVO DE LIVROS
  const [livros, setLivros] = useState(MOCK_LIVROS);

  // 2. PLANOS DE ESTUDOS (Visual da Coluna Direita do Layout da Colega)
  const [planos, setPlanos] = useState(MOCK_PLANOS);
  const [novoPlano, setNovoPlano] = useState({ nome: '', disciplina: 'Matemática' });

  // 3. VIDEOAULAS
  const [videoaulas, setVideoaulas] = useState([]);

  // 4. APOSTILAS
  const [apostilas, setApostilas] = useState(MOCK_APOSTILAS);

  // LÓGICA DE EXCLUSÃO (Sem alertas)
  const executarExclusao = () => {
    if (!itemParaExcluir) return;
    const { id, tipo } = itemParaExcluir;

    if (tipo === 'livro') {
      setLivros(prev => prev.filter(item => item.id !== id));
      setPlanos(prev => prev.map(plano => ({ ...plano, livroIds: (plano.livroIds ?? []).filter(livroId => livroId !== id) })));
      dispararAviso('Livro removido.');
    } else if (tipo === 'plano') {
      setPlanos(prev => prev.filter(item => item.id !== id));
      dispararAviso('Plano de estudos removido.');
    } else if (tipo === 'video') {
      setVideoaulas(prev => prev.filter(item => item.id !== id));
      dispararAviso('Videoaula removida.');
    } else if (tipo === 'apostila') {
      setApostilas(prev => prev.filter(item => item.id !== id));
      setPlanos(prev => prev.map(plano => ({ ...plano, apostilaIds: (plano.apostilaIds ?? []).filter(apostilaId => apostilaId !== id) })));
      dispararAviso('Conteúdo web removido.');
    }
    setItemParaExcluir(null);
  };

  // LÓGICA DO LIVRO
  const salvarLivro = (e) => {
    e.preventDefault();
    if (formData.id) {
      setLivros(prev => prev.map(l => (l.id === formData.id ? { ...l, ...formData } : l)));
      dispararAviso('Livro atualizado!');
    } else {
      setLivros(prev => [{ ...formData, id: Date.now(), comentarios: [] }, ...prev]);
      dispararAviso('Livro cadastrado!');
    }
    setModalFormLivroAberto(false);
  };

  const selecionarCapa = (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      dispararAviso('Selecione uma imagem PNG, JPEG ou WebP.');
      event.target.value = '';
      return;
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      dispararAviso('A imagem deve ter no máximo 2 MB.');
      event.target.value = '';
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => setFormData(prev => ({ ...prev, imagem: leitor.result }));
    leitor.readAsDataURL(arquivo);
  };

  const adicionarComentario = (comentario) => {
    if (!livroSelecionado) return;
    setLivros(prev => prev.map(livro => livro.id === livroSelecionado.id
      ? { ...livro, comentarios: [comentario, ...(livro.comentarios ?? [])] }
      : livro));
    dispararAviso(`Novo comentário em ${livroSelecionado.titulo}.`);
  };

  // LÓGICA DO PLANO
  const criarPlano = (e) => {
    e.preventDefault();
    if (!novoPlano.nome.trim()) return;

    const nova = {
      id: Date.now(),
      nome: novoPlano.nome,
      disciplina: novoPlano.disciplina,
      livroIds: [],
      apostilaIds: [],
      ativo: false // Novos não ficam com borda rosa por padrão
    };
    setPlanos(prev => [nova, ...prev]);
    setNovoPlano({ nome: '', disciplina: 'Matemática' });
    dispararAviso('Plano de Estudos criado!');
  };

  const pesquisarVideoaulas = async (event) => {
    event.preventDefault();
    buscaYouTubeController.current?.abort();
    const consulta = videoBusca.trim();

    if (!consulta) {
      setVideosEncontrados([]);
      setVideoBuscaTentada(false);
      setVideoBuscaCarregando(false);
      setVideoBuscaErro('Digite o nome da videoaula para pesquisar.');
      setVideoSelecionado(null);
      setUrlVideoSelecionada('');
      setVideoPlayerErro('');
      return;
    }

    const controller = new AbortController();
    buscaYouTubeController.current = controller;
    setVideoBuscaCarregando(true);
    setVideoBuscaTentada(true);
    setVideoBuscaErro('');
    setVideoSelecionado(null);
    setUrlVideoSelecionada('');
    setVideoPlayerErro('');

    try {
      const videos = await searchYouTubeVideos(consulta, { signal: controller.signal });
      if (buscaYouTubeController.current === controller) {
        setVideosEncontrados(videos);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && buscaYouTubeController.current === controller) {
        setVideosEncontrados([]);
        setVideoBuscaErro(mensagemErroYouTube(error));
      }
    } finally {
      if (buscaYouTubeController.current === controller) {
        setVideoBuscaCarregando(false);
      }
    }
  };

  const selecionarVideoParaAssistir = (event, video) => {
    if (videoVerificandoId) {
      event.preventDefault();
      return;
    }

    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    setVideoSelecionado(video);
    setUrlVideoSelecionada(url);
    setVideoVerificandoId(video.videoId);
    setVideoPlayerErro('');

    validateYouTubeVideo(video.videoId)
      .catch(error => setVideoPlayerErro(mensagemErroYouTube(error)))
      .finally(() => setVideoVerificandoId(''));
  };

  const adicionarVideoaulaSelecionada = () => {
    if (!videoSelecionado || !urlVideoSelecionada || videoPlayerErro || videoVerificandoId) {
      return;
    }

    if (videoaulas.some(video => video.url === urlVideoSelecionada)) {
      dispararAviso('Esta videoaula já foi adicionada.');
      return;
    }

    setVideoaulas(prev => [{
      id: Date.now(),
      titulo: videoSelecionado.title,
      materia: (videoSelecionado.channelTitle || 'YouTube').slice(0, 100),
      corBadge: '#2563eb',
      descricao: videoSelecionado.description.slice(0, 1000),
      url: urlVideoSelecionada
    }, ...prev]);
    dispararAviso('Videoaula adicionada à biblioteca.');
  };

  const salvarApostila = (event) => {
    event.preventDefault();
    if (formApostila.id) {
      setApostilas(prev => prev.map(apostila => apostila.id === formApostila.id ? { ...apostila, ...formApostila } : apostila));
      dispararAviso('Conteúdo web atualizado.');
    } else {
      setApostilas(prev => [{ ...formApostila, url: formApostila.url.trim(), id: Date.now() }, ...prev]);
      dispararAviso('Conteúdo web cadastrado.');
    }
    setModalFormApostilaAberto(false);
  };

  const alternarMaterialPlano = (tipo, itemId) => {
    if (!planoSelecionadoId) return;
    const propriedade = tipo === 'livro' ? 'livroIds' : 'apostilaIds';
    const selecionado = planos.find(plano => plano.id === planoSelecionadoId)?.[propriedade] ?? [];
    const removendo = selecionado.includes(itemId);
    setPlanos(prev => prev.map(plano => plano.id === planoSelecionadoId
      ? { ...plano, [propriedade]: removendo ? selecionado.filter(id => id !== itemId) : [...selecionado, itemId] }
      : plano));
    dispararAviso(removendo ? 'Material removido do plano.' : 'Material adicionado ao plano.');
  };

  const selecionarAba = (id) => {
    setAbaAtiva(id);
    setBusca('');
  };

  const termoBusca = normalizarTexto(busca.trim());
  const correspondeBusca = (...valores) => !termoBusca || valores.some(valor => normalizarTexto(valor ?? '').includes(termoBusca));
  const planoSelecionado = planos.find(plano => plano.id === planoSelecionadoId);
  const livrosFiltrados = livros.filter(livro => correspondeBusca(livro.titulo, livro.autor));
  const planosFiltrados = planos.filter(plano => correspondeBusca(plano.nome, plano.disciplina));
  const apostilasFiltradas = apostilas.filter(apostila => correspondeBusca(apostila.titulo, apostila.materia, apostila.descricao, apostila.topico, apostila.tipo, apostila.nivel, apostila.autor));
  const tentarCarregarBiblioteca = () => {
    setCarregandoBiblioteca(true);
    setErroCarregamento('');
    setTentativaCarregamento(valor => valor + 1);
  };

  useEffect(() => {
    if (!hasPortalSession()) {
      navigate('/login', { replace: true });
      return undefined;
    }

    const controller = new AbortController();

    loadBiblioteca({ signal: controller.signal })
      .then(({ dados }) => {
        if (dados) {
          setLivros(dados.livros && dados.livros.length > 0 ? dados.livros : MOCK_LIVROS);
          setPlanos((dados.planos && dados.planos.length > 0 ? dados.planos : MOCK_PLANOS).map(plano => ({ ...plano, livroIds: plano.livroIds ?? [], apostilaIds: plano.apostilaIds ?? [] })));
          setVideoaulas(dados.videoaulas ?? []);
          setApostilas(dados.apostilas && dados.apostilas.length > 0 ? dados.apostilas : MOCK_APOSTILAS);
        }
        setBibliotecaCarregada(true);
        setErroCarregamento('');
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setLivros(prev => (prev && prev.length > 0 ? prev : MOCK_LIVROS));
        setPlanos(prev => (prev && prev.length > 0 ? prev : MOCK_PLANOS));
        setApostilas(prev => (prev && prev.length > 0 ? prev : MOCK_APOSTILAS));
        setErroCarregamento('Problemas de Conexão, tente novamente mais tarde');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoBiblioteca(false);
      });

    return () => controller.abort();
  }, [navigate, tentativaCarregamento]);

  useEffect(() => {
    if (!bibliotecaCarregada) return undefined;

    let cancelado = false;
    const versaoAtual = ++versaoSalvamento.current;
    const dados = { livros, planos, videoaulas, apostilas };
    const timeout = window.setTimeout(() => {
      setEstadoSalvamento('salvando');
      filaSalvamento.current = filaSalvamento.current
        .catch(() => undefined)
        .then(() => saveBiblioteca(dados))
        .then(() => {
          if (!cancelado && versaoAtual === versaoSalvamento.current) setEstadoSalvamento('salvo');
        })
        .catch(error => {
          if (error.status === 401) {
            navigate('/login', { replace: true });
            return;
          }
          if (!cancelado && versaoAtual === versaoSalvamento.current) setEstadoSalvamento('erro');
        });
    }, 500);

    return () => {
      cancelado = true;
      window.clearTimeout(timeout);
    };
  }, [bibliotecaCarregada, livros, planos, videoaulas, apostilas, tentativaSalvamento, navigate]);

  useEffect(() => () => buscaYouTubeController.current?.abort(), []);

  if (carregandoBiblioteca) {
    return <div className="container py-5 text-center text-muted" role="status">Carregando sua biblioteca...</div>;
  }

  return (
    <div className="position-relative">
      {/* AVISO DE PROBLEMAS DE CONEXÃO */}
      {erroCarregamento && (
        <div 
          className="alert alert-warning d-flex justify-content-between align-items-center mb-4 shadow-sm" 
          role="alert"
          style={{ borderRadius: '12px', borderLeft: '5px solid #f59e0b', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span className="fw-semibold" style={{ color: '#92400e', fontSize: '14px' }}>
              {erroCarregamento}
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-dark" 
            onClick={tentarCarregarBiblioteca}
            style={{ fontSize: '12px', fontWeight: '600' }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {/* TOAST NOTIFICAÇÃO */}
      {notificacao && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#0f172a', color: '#fff', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 2000, fontWeight: '600', fontSize: '14px', animation: 'fadeIn 0.3s' }}>
          ✓ {notificacao}
        </div>
      )}

      {/* GERENCIADOR */}
      <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <h2 className="fw-bold mb-0" style={{ color: corDestaque, fontSize: '22px' }}>
            Gerenciar Biblioteca
          </h2>

          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
                🔍
              </span>
              <input 
                type="text" 
                className="form-control rounded-pill ps-5 py-2" 
                placeholder={`Pesquisar ${ABAS_BIBLIOTECA.find(aba => aba.id === abaAtiva)?.label.toLowerCase() ?? 'biblioteca'}...`}
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label={`Pesquisar em ${ABAS_BIBLIOTECA.find(aba => aba.id === abaAtiva)?.label ?? 'biblioteca'}`}
                style={{ fontSize: '13px', borderColor: '#e2e8f0', width: 'min(70vw, 280px)', backgroundColor: '#f8fafc' }}
              />
            </div>

            {estadoSalvamento && (
              <span className={`d-none d-sm-inline small ${estadoSalvamento === 'erro' ? 'text-danger' : 'text-muted'}`} role="status">
                {estadoSalvamento === 'salvando' ? 'Salvando...' : estadoSalvamento === 'salvo' ? 'Salvo' : 'Falha ao salvar'}
              </span>
            )}
            {estadoSalvamento === 'erro' && (
              <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setTentativaSalvamento(valor => valor + 1)}>Tentar salvar</button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="d-flex gap-4 border-bottom pb-2 mb-4" style={{ fontSize: '14px' }}>
          {ABAS_BIBLIOTECA.map(aba => (
            <button
              key={aba.id}
              type="button"
              onClick={() => selecionarAba(aba.id)}
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: abaAtiva === aba.id ? '#e6007e' : '#64748b', fontWeight: abaAtiva === aba.id ? '700' : '500' }}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* ================= ABA 1: ACERVO ================= */}
        {abaAtiva === 'acervo' && (
          <>
            <div className="d-flex justify-content-end mb-4">
              <button onClick={() => { setFormData({ id: null, titulo: '', autor: '', status: 'Disponível', aluno: '', imagem: '', nota: '4.5' }); setModalFormLivroAberto(true); }} className="btn rounded-pill px-4 py-2 text-white fw-bold shadow-sm" style={{ backgroundColor: '#e6007e', fontSize: '13px' }}>
                + Cadastrar Livro
              </button>
            </div>
            <div className="row g-4">
              {livrosFiltrados.map((livro) => (
                <CardLivro 
                  key={livro.id} livro={livro} 
                  onEditar={() => { setFormData({ ...livro }); setModalFormLivroAberto(true); }}
                  onExcluir={() => setItemParaExcluir({ id: livro.id, tipo: 'livro', nome: livro.titulo })}
                  onVerDetalhes={() => { setLivroSelecionado(livro); setModalDetalhesAberto(true); }}
                />
              ))}
              {livrosFiltrados.length === 0 && <p className="col-12 text-center text-muted py-4">Nenhum livro encontrado.</p>}
            </div>
          </>
        )}

        {/* ================= ABA 2: PLANOS DE ESTUDOS (Visual Idêntico à Coluna Direita) ================= */}
        {abaAtiva === 'planos' && (
          <div>
            <div className="mb-4">
              <h4 className="fw-bold mb-1" style={{ fontSize: '16px', color: '#0f172a' }}>Meus Planos de Estudos</h4>
              <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Crie pastas para organizar seus conteúdos web e livros por disciplina.</p>
            </div>

            {/* FORMULÁRIO SIMPLES (Mantido) */}
            <form onSubmit={criarPlano} className="p-3 rounded-4 mb-4 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label mb-1" style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>NOME DO PLANO (Ex: Preparação ENEM)</label>
                  <input type="text" className="form-control form-control-sm" placeholder="Nome do plano de estudos" value={novoPlano.nome} onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })} required />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label mb-1" style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>DISCIPLINA</label>
                  <select className="form-select form-select-sm" value={novoPlano.disciplina} onChange={(e) => setNovoPlano({ ...novoPlano, disciplina: e.target.value })}>
                    {MATERIAS_DISPONIVEIS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <button type="submit" className="btn btn-sm w-100 text-white fw-bold py-2" style={{ backgroundColor: '#e6007e', borderRadius: '8px' }}>
                    + Confirmar Criação
                  </button>
                </div>
              </div>
            </form>

            {/* LISTAGEM DOS PLANOS: VISUAL EXATO DO PRINT */}
            <div className="row g-4 mt-2">
              {planosFiltrados.map((plano) => (
                <div className="col-12 col-md-6 col-xl-4" key={plano.id}>
                  <div 
                    className="card p-4 h-100" 
                    style={{ 
                      borderRadius: '16px', 
                      backgroundColor: '#fff',
                      position: 'relative',
                      // Aplica a borda e o brilho rosa se o plano for "ativo"
                      border: plano.ativo ? '2px solid #e6007e' : '1px solid #e2e8f0',
                      boxShadow: plano.ativo ? '0 0 15px rgba(230,0,126,0.15)' : '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Botão excluir discreto no canto */}
                    <button 
                      type="button" 
                      onClick={() => setItemParaExcluir({ id: plano.id, tipo: 'plano', nome: plano.nome })} 
                      className="btn btn-sm p-0 border-0 position-absolute" 
                      style={{ top: '16px', right: '16px', color: '#94a3b8' }} 
                      title="Excluir Plano"
                    >
                      ✕
                    </button>

                    <h6 className="fw-bold mb-3" style={{ color: '#0f172a', fontSize: '16px', paddingRight: '20px' }}>
                      {plano.nome}
                    </h6>
                    
                    {/* Tags Cinzas */}
                    <div className="d-flex gap-2 mb-4">
                      <span className="badge text-dark" style={{ backgroundColor: '#e2e8f0', fontSize: '11px', fontWeight: '500', padding: '6px 10px' }}>ENEM</span>
                      <span className="badge text-dark" style={{ backgroundColor: '#e2e8f0', fontSize: '11px', fontWeight: '500', padding: '6px 10px' }}>{plano.disciplina}</span>
                    </div>

                    {/* Caixa Cinza de Resumo de Conteúdos */}
                    <div className="rounded-3 p-3 mb-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div className="d-flex gap-3 mb-2" style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        <span>{plano.livroIds.length} Livros</span>
                        <span>{plano.apostilaIds.length} conteúdo{plano.apostilaIds.length !== 1 && 's'} web</span>
                      </div>
                      <div className="d-flex gap-2 text-muted" style={{ fontSize: '16px' }}>
                        {/* Ícones Ilustrativos (Livros amarelos e Apostila) */}
                        <span title="Livros" style={{ color: '#d97706' }}>📘📙</span>
                        <span title="Conteúdo web" style={{ color: '#64748b' }}>📄</span>
                      </div>
                    </div>

                    {/* Link Verde */}
                    <div className="mt-auto">
                      <button type="button" onClick={() => setPlanoSelecionadoId(plano.id)} className="btn btn-link p-0 text-decoration-none fw-semibold" style={{ color: '#059669', fontSize: '13px' }}>
                        Ver Plano Completo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {planosFiltrados.length === 0 && <p className="col-12 text-center text-muted py-4">Nenhum plano encontrado.</p>}
            </div>
          </div>
        )}

        {/* ================= ABA 3: VIDEOAULAS ================= */}
        {abaAtiva === 'videoaulas' && (
          <div className="videoaulas">
            <form onSubmit={pesquisarVideoaulas} className="videoaulas-search">
              <div className="videoaulas-search__field">
                <label htmlFor="videoaulas-consulta" className="form-label">Pesquisar no YouTube</label>
                <input
                  id="videoaulas-consulta"
                  type="search"
                  className="form-control"
                  placeholder="Digite o nome da videoaula..."
                  value={videoBusca}
                  onChange={(event) => setVideoBusca(event.target.value)}
                  maxLength={200}
                  aria-describedby="videoaulas-status"
                />
              </div>
              <button type="submit" className="btn btn-primary videoaulas-search__button" disabled={videoBuscaCarregando || Boolean(videoVerificandoId)}>
                {videoBuscaCarregando ? 'Pesquisando...' : 'Pesquisar'}
              </button>
            </form>

            <div id="videoaulas-status" aria-live="polite">
              {videoBuscaErro && <p className="alert alert-warning py-2" role="alert">{videoBuscaErro}</p>}
              {videoBuscaCarregando && <p className="text-muted" role="status">Buscando videoaulas no YouTube...</p>}
              {videoBuscaTentada && !videoBuscaCarregando && !videoBuscaErro && videosEncontrados.length === 0 && (
                <p className="text-muted py-3">Nenhum vídeo encontrado para essa pesquisa.</p>
              )}
            </div>

            {videosEncontrados.length > 0 && (
              <section className="mb-4" aria-label="Resultados do YouTube">
                <h3 className="h6 fw-bold mb-3">Resultados do YouTube</h3>
                <div className="videoaulas-grid">
                  {videosEncontrados.map(video => (
                    <article className={`videoaulas-card${videoSelecionado?.videoId === video.videoId ? ' is-selected' : ''}`} key={video.videoId}>
                      {video.thumbnail ? (
                        <img className="videoaulas-card__thumbnail" src={video.thumbnail} alt={`Thumbnail de ${video.title}`} loading="lazy" />
                      ) : (
                        <div className="videoaulas-card__thumbnail videoaulas-card__thumbnail--empty" aria-hidden="true" />
                      )}
                      <div className="videoaulas-card__body">
                        <h4 className="videoaulas-card__title">{video.title}</h4>
                        <p className="videoaulas-card__info">
                          {video.channelTitle}{video.publishedAt ? ` · ${new Date(video.publishedAt).toLocaleDateString('pt-BR')}` : ''}
                        </p>
                        {video.description && <p className="videoaulas-card__description">{video.description}</p>}
                        <a
                          href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary mt-auto"
                          onClick={(event) => selecionarVideoParaAssistir(event, video)}
                          aria-label={`Assistir ${video.title} no YouTube`}
                        >
                          {videoVerificandoId === video.videoId ? 'Verificando...' : 'Assistir no YouTube'}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="videoaulas-add">
              <div className="videoaulas-add__field">
                <label htmlFor="videoaulas-url-selecionada" className="form-label">URL da videoaula selecionada</label>
                <input
                  id="videoaulas-url-selecionada"
                  type="url"
                  className="form-control"
                  value={urlVideoSelecionada}
                  placeholder="Clique em Assistir para preencher a URL"
                  readOnly
                />
              </div>
              <button
                type="button"
                className="btn btn-primary videoaulas-add__button"
                onClick={adicionarVideoaulaSelecionada}
                disabled={!videoSelecionado || !urlVideoSelecionada || Boolean(videoPlayerErro) || Boolean(videoVerificandoId) || videoaulas.some(video => video.url === urlVideoSelecionada)}
              >
                {videoaulas.some(video => video.url === urlVideoSelecionada) && urlVideoSelecionada ? 'Adicionado' : 'Adicionar'}
              </button>
            </div>
            {videoSelecionado && <p className="videoaulas-selected-title">Selecionado: {videoSelecionado.title}</p>}
            {videoPlayerErro && <p className="alert alert-warning py-2" role="alert">{videoPlayerErro}</p>}

            {!videoBuscaTentada && !videoBuscaErro && videosEncontrados.length === 0 && (
              <p className="text-muted py-3">Pesquise no YouTube para encontrar videoaulas.</p>
            )}
          </div>
        )}

        {/* ================= ABA 4: CONTEUDO WEB ================= */}
        {abaAtiva === 'apostilas' && (
          <>
            <div className="d-flex justify-content-end mb-4">
              <button type="button" onClick={() => { setFormApostila({ id: null, titulo: '', materia: 'Matemática', descricao: '', url: '', topico: '', tipo: 'Apostila', nivel: '', autor: '', corBadge: '#e0f2fe', corTexto: '#0284c7' }); setModalFormApostilaAberto(true); }} className="btn rounded-pill px-4 py-2 text-white fw-bold shadow-sm" style={{ backgroundColor: '#e6007e', fontSize: '13px' }}>
                + Cadastrar conteúdo web
              </button>
            </div>
            <div className="row g-3">
              {apostilasFiltradas.map((apostila) => (
                <div key={apostila.id} className="col-12 col-lg-6">
                  <article className="h-100 p-3 rounded-4 border shadow-sm bg-white d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', backgroundColor: apostila.corBadge, color: apostila.corTexto, borderRadius: '10px', fontSize: '18px' }} aria-hidden="true">📄</div>
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="fw-bold mb-1" style={{ fontSize: '14px' }}>{apostila.titulo}</h6>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {[apostila.materia, apostila.tipo, apostila.nivel].filter(Boolean).map(etiqueta => <span key={etiqueta} className="badge text-dark" style={{ backgroundColor: '#f1f5f9', fontSize: '10px' }}>{etiqueta}</span>)}
                      </div>
                      <p className="text-muted mb-1" style={{ fontSize: '12px' }}>{apostila.descricao || 'Sem descrição cadastrada.'}</p>
                      <small className="text-secondary">{[apostila.topico, apostila.autor].filter(Boolean).join(' · ')}</small>
                      {apostila.url && <a href={apostila.url} target="_blank" rel="noopener noreferrer" className="d-inline-block mt-2">Acessar conteúdo web</a>}
                    </div>
                    <div className="d-flex flex-column gap-2 flex-shrink-0">
                      <button type="button" onClick={() => { setFormApostila({ ...apostila }); setModalFormApostilaAberto(true); }} className="btn btn-sm btn-outline-primary" aria-label={`Editar ${apostila.titulo}`}>Editar</button>
                      <button type="button" onClick={() => setItemParaExcluir({ id: apostila.id, tipo: 'apostila', nome: apostila.titulo })} className="btn btn-sm btn-outline-danger" aria-label={`Excluir ${apostila.titulo}`}>Excluir</button>
                    </div>
                  </article>
                </div>
              ))}
              {apostilasFiltradas.length === 0 && <p className="col-12 text-center text-muted py-4">Nenhum conteúdo web encontrado.</p>}
            </div>
          </>
        )}

      </div>

      {/* ================= MODAL PLANO COMPLETO ================= */}
      {planoSelecionado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, padding: '16px' }} onClick={() => setPlanoSelecionadoId(null)}>
          <div className="bg-white rounded-4 shadow p-4" style={{ width: 'min(680px, 100%)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="plano-completo-titulo">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h3 id="plano-completo-titulo" className="h5 fw-bold mb-1">{planoSelecionado.nome}</h3>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>{planoSelecionado.disciplina} · {planoSelecionado.livroIds.length} livros · {planoSelecionado.apostilaIds.length} conteúdos web</p>
              </div>
              <button type="button" className="btn-close" aria-label="Fechar plano" onClick={() => setPlanoSelecionadoId(null)} />
            </div>

            <h4 className="h6 fw-bold mt-4">Livros do acervo</h4>
            {livros.length === 0 ? <p className="text-muted" style={{ fontSize: '13px' }}>Cadastre livros no acervo para adicioná-los a este plano.</p> : (
              <div className="d-flex flex-column gap-2">
                {livros.map(livro => (
                  <label key={livro.id} className="d-flex align-items-center gap-2 border rounded-3 p-2" style={{ fontSize: '13px' }}>
                    <input className="form-check-input mt-0" type="checkbox" checked={planoSelecionado.livroIds.includes(livro.id)} onChange={() => alternarMaterialPlano('livro', livro.id)} />
                    <span>{livro.titulo} <small className="text-muted">· {livro.autor}</small></span>
                  </label>
                ))}
              </div>
            )}

            <h4 className="h6 fw-bold mt-4">Conteúdos web</h4>
            {apostilas.length === 0 ? <p className="text-muted" style={{ fontSize: '13px' }}>Cadastre conteúdos web para adicioná-los a este plano.</p> : (
              <div className="d-flex flex-column gap-2">
                {apostilas.map(apostila => (
                  <label key={apostila.id} className="d-flex align-items-center gap-2 border rounded-3 p-2" style={{ fontSize: '13px' }}>
                    <input className="form-check-input mt-0" type="checkbox" checked={planoSelecionado.apostilaIds.includes(apostila.id)} onChange={() => alternarMaterialPlano('apostila', apostila.id)} />
                    <span>{apostila.titulo} <small className="text-muted">· {apostila.materia}</small></span>
                  </label>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <button type="button" className="btn btn-sm text-white px-4" style={{ backgroundColor: '#e6007e' }} onClick={() => setPlanoSelecionadoId(null)}>Concluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL GLOBAL DE EXCLUSÃO ================= */}
      {itemParaExcluir && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1070 }} onClick={() => setItemParaExcluir(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '90%', maxWidth: '380px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🗑️</div>
            <h5 className="fw-bold mb-2 text-dark">Confirmar exclusão?</h5>
            <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Deseja mesmo eliminar <b>"{itemParaExcluir.nome}"</b>?</p>
            <div className="d-flex gap-2 justify-content-center">
              <button onClick={() => setItemParaExcluir(null)} className="btn btn-light border px-3">Cancelar</button>
              <button onClick={executarExclusao} className="btn btn-danger px-4 fw-bold">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL FORMULÁRIO APOSTILA ================= */}
      {modalFormApostilaAberto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, padding: '16px' }} onClick={() => setModalFormApostilaAberto(false)}>
          <div className="bg-white rounded-4 shadow p-4" style={{ width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="form-apostila-titulo">
            <h3 id="form-apostila-titulo" className="h5 fw-bold mb-3">{formApostila.id ? 'Editar material' : 'Cadastrar material'}</h3>
            <form onSubmit={salvarApostila}>
              <label className="form-label" htmlFor="apostila-titulo">Título</label>
              <input id="apostila-titulo" type="text" className="form-control form-control-sm mb-3" value={formApostila.titulo} onChange={(event) => setFormApostila(prev => ({ ...prev, titulo: event.target.value }))} required />

              <label className="form-label" htmlFor="apostila-url">Link do conteúdo web</label>
              <input id="apostila-url" type="url" className="form-control form-control-sm mb-3" value={formApostila.url ?? ''} onChange={(event) => setFormApostila(prev => ({ ...prev, url: event.target.value }))} maxLength={2048} placeholder="https://..." required={!formApostila.id} />

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="apostila-materia">Disciplina</label>
                  <select id="apostila-materia" className="form-select form-select-sm mb-3" value={formApostila.materia} onChange={(event) => setFormApostila(prev => ({ ...prev, materia: event.target.value }))}>
                    {MATERIAS_DISPONIVEIS.map(materia => <option key={materia}>{materia}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="apostila-tipo">Tipo de material</label>
                  <select id="apostila-tipo" className="form-select form-select-sm mb-3" value={formApostila.tipo} onChange={(event) => setFormApostila(prev => ({ ...prev, tipo: event.target.value }))}>
                    {['Apostila', 'Resumo', 'Lista de exercícios', 'Manual', 'Texto'].map(tipo => <option key={tipo}>{tipo}</option>)}
                  </select>
                </div>
              </div>

              <label className="form-label" htmlFor="apostila-descricao">Descrição</label>
              <textarea id="apostila-descricao" className="form-control form-control-sm mb-3" rows="3" maxLength={500} value={formApostila.descricao} onChange={(event) => setFormApostila(prev => ({ ...prev, descricao: event.target.value }))} />

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="apostila-topico">Assunto ou tópico</label>
                  <input id="apostila-topico" type="text" className="form-control form-control-sm mb-3" value={formApostila.topico} onChange={(event) => setFormApostila(prev => ({ ...prev, topico: event.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="apostila-nivel">Nível ou ano</label>
                  <input id="apostila-nivel" type="text" className="form-control form-control-sm mb-3" value={formApostila.nivel} onChange={(event) => setFormApostila(prev => ({ ...prev, nivel: event.target.value }))} placeholder="Ex.: 1º ano, ENEM" />
                </div>
              </div>

              <label className="form-label" htmlFor="apostila-autor">Autor ou origem</label>
              <input id="apostila-autor" type="text" className="form-control form-control-sm mb-3" value={formApostila.autor} onChange={(event) => setFormApostila(prev => ({ ...prev, autor: event.target.value }))} />

              <div className="d-flex justify-content-end gap-2">
                <button type="button" onClick={() => setModalFormApostilaAberto(false)} className="btn btn-sm btn-light border px-3">Cancelar</button>
                <button type="submit" className="btn btn-sm text-white px-4 fw-bold" style={{ backgroundColor: '#e6007e' }}>Salvar material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL FORMULÁRIO LIVRO ================= */}
      {modalFormLivroAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }} onClick={() => setModalFormLivroAberto(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '90%', maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h4 className="fw-bold mb-3" style={{ fontSize: '18px' }}>{formData.id ? 'Editar Livro' : 'Cadastrar Livro'}</h4>
            <form onSubmit={salvarLivro}>
              <input type="text" className="form-control form-control-sm mb-2" placeholder="Título" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required />
              <input type="text" className="form-control form-control-sm mb-2" placeholder="Autor" value={formData.autor} onChange={(e) => setFormData({ ...formData, autor: e.target.value })} required />
              <label className="form-label mb-1" htmlFor="capa-livro" style={{ fontSize: '12px' }}>Capa do livro</label>
              <input id="capa-livro" type="file" className="form-control form-control-sm mb-2" accept="image/*" onChange={selecionarCapa} />
              {formData.imagem && (
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img src={formData.imagem} alt="Prévia da capa" style={{ width: '64px', height: '84px', objectFit: 'cover', borderRadius: '6px' }} />
                  <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setFormData(prev => ({ ...prev, imagem: '' }))}>Remover capa</button>
                </div>
              )}
              
              <div className="d-flex justify-content-end gap-2 mt-2">
                <button type="button" onClick={() => setModalFormLivroAberto(false)} className="btn btn-sm btn-light border px-3">Cancelar</button>
                <button type="submit" className="btn btn-sm text-white px-4 fw-bold" style={{ backgroundColor: '#e6007e' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMENTÁRIOS LIVRO */}
      <DetalheLivroModal livro={livroSelecionado} aberto={modalDetalhesAberto} onClose={() => setModalDetalhesAberto(false)} onAddComment={adicionarComentario} />

    </div>
  );
}