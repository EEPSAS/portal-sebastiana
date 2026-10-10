/**
 * useBiblioteca.js - Hook Customizado de Gestão de Dados do Acervo Escolar
 *
 * Papel Didático:
 * Centraliza o estado reativo da biblioteca escolar (Livros, Planos de Estudo,
 * Videoaulas e Conteúdos Web/Apostilas), abstraindo o ciclo de vida assíncrono:
 * 1. Carregamento inicial via API com fallback seguro em dados mock;
 * 2. Autosave debounced (500ms) com fila de promessas para evitar conflitos de concorrência;
 * 3. Operações atômicas de CRUD e notificações temporárias de feedback ao usuário.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  hasPortalSession,
  loadBiblioteca,
  saveBiblioteca,
} from '../../services/biblioteca/bibliotecaService';

const MOCK_LIVROS = [
  {
    id: 1,
    titulo: 'Dom Casmurro',
    autor: 'Machado de Assis',
    status: 'Disponível',
    nota: '4.8',
    imagem:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    comentarios: [
      {
        nome: 'João Santos',
        texto:
          'Uma leitura emocionante que faz pensar sobre a realidade dos personagens.',
        nota: 5,
        data: '14/09/2026',
      },
      {
        nome: 'Beatriz Costa',
        texto: 'Gostei muito da narrativa e recomendo para a turma.',
        nota: 4,
        data: '10/09/2026',
      },
    ],
  },
  {
    id: 2,
    titulo: 'O Cortiço',
    autor: 'Aluísio Azevedo',
    status: 'Emprestado',
    aluno: 'João Silva',
    nota: '4.4',
    imagem:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    comentarios: [],
  },
  {
    id: 3,
    titulo: 'Vidas Secas',
    autor: 'Graciliano Ramos',
    status: 'Disponível',
    nota: '4.6',
    imagem:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
    comentarios: [],
  },
  {
    id: 4,
    titulo: 'Capitães da Areia',
    autor: 'Jorge Amado',
    status: 'Disponível',
    nota: '4.7',
    imagem:
      'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&q=80',
    comentarios: [],
  },
];

const MOCK_PLANOS = [
  {
    id: 1,
    nome: 'Geopolítica para o ENEM',
    disciplina: 'Geografia',
    livroIds: [1, 2],
    apostilaIds: [1],
    ativo: true,
  },
  {
    id: 2,
    nome: 'Inglês Básico: Gramática',
    disciplina: 'Inglês',
    livroIds: [1],
    apostilaIds: [],
    ativo: false,
  },
  {
    id: 3,
    nome: 'Intensivo de Exatas',
    disciplina: 'Matemática',
    livroIds: [],
    apostilaIds: [1, 2, 3],
    ativo: false,
  },
];

const MOCK_APOSTILAS = [
  {
    id: 1,
    titulo: 'Apostila Completa de Funções — 1º Ano',
    materia: 'Matemática',
    descricao: 'Conteúdo de apoio e exercícios de funções.',
    topico: 'Funções',
    tipo: 'Apostila',
    nivel: '1º ano',
    autor: 'Equipe pedagógica',
    corBadge: '#e0f2fe',
    corTexto: '#0284c7',
  },
  {
    id: 2,
    titulo: 'Resumo Ilustrado de Brasil Colônia',
    materia: 'História',
    descricao: 'Resumo dos principais períodos e acontecimentos.',
    topico: 'Brasil Colônia',
    tipo: 'Resumo',
    nivel: 'Ensino médio',
    autor: 'Equipe pedagógica',
    corBadge: '#fef3c7',
    corTexto: '#b45309',
  },
  {
    id: 3,
    titulo: 'Manual de Redação ENEM',
    materia: 'Redação',
    descricao:
      'Orientações para estruturar e revisar textos dissertativos.',
    topico: 'Redação dissertativa',
    tipo: 'Manual',
    nivel: 'ENEM',
    autor: 'Equipe pedagógica',
    corBadge: '#ffe4e6',
    corTexto: '#e11d48',
  },
];

export const useBiblioteca = () => {
  const navigate = useNavigate();

  // Estados principais das 4 entidades do acervo
  const [livros, setLivros] = useState(MOCK_LIVROS);
  const [planos, setPlanos] = useState(MOCK_PLANOS);
  const [videoaulas, setVideoaulas] = useState([]);
  const [apostilas, setApostilas] = useState(MOCK_APOSTILAS);

  // Estados de controle de requisição e persistência
  const [carregandoBiblioteca, setCarregandoBiblioteca] = useState(true);
  const [bibliotecaCarregada, setBibliotecaCarregada] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [estadoSalvamento, setEstadoSalvamento] = useState('');
  const [tentativaCarregamento, setTentativaCarregamento] = useState(0);
  const [tentativaSalvamento, setTentativaSalvamento] = useState(0);

  // Notificação flutuante de feedback (toast)
  const [notificacao, setNotificacao] = useState(null);

  // Controle de concorrência de requisições de salvamento
  const filaSalvamento = useRef(Promise.resolve());
  const versaoSalvamento = useRef(0);

  const dispararAviso = (msg) => {
    setNotificacao(msg);
    setTimeout(() => setNotificacao(null), 3500);
  };

  const tentarCarregarBiblioteca = () => {
    setCarregandoBiblioteca(true);
    setErroCarregamento('');
    setTentativaCarregamento((valor) => valor + 1);
  };

  const tentarSalvarNovamente = () => {
    setTentativaSalvamento((valor) => valor + 1);
  };

  /**
   * Efeito 1: Carregamento inicial da API com fallback
   */
  useEffect(() => {
    if (!hasPortalSession()) {
      navigate('/login', { replace: true });
      return undefined;
    }

    const controller = new AbortController();

    loadBiblioteca({ signal: controller.signal })
      .then(({ dados }) => {
        if (dados) {
          setLivros(
            dados.livros && dados.livros.length > 0 ? dados.livros : MOCK_LIVROS
          );
          setPlanos(
            (dados.planos && dados.planos.length > 0 ? dados.planos : MOCK_PLANOS).map(
              (plano) => ({
                ...plano,
                livroIds: plano.livroIds ?? [],
                apostilaIds: plano.apostilaIds ?? [],
              })
            )
          );
          setVideoaulas(dados.videoaulas ?? []);
          setApostilas(
            dados.apostilas && dados.apostilas.length > 0
              ? dados.apostilas
              : MOCK_APOSTILAS
          );
        }
        setBibliotecaCarregada(true);
        setErroCarregamento('');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setLivros((prev) => (prev && prev.length > 0 ? prev : MOCK_LIVROS));
        setPlanos((prev) => (prev && prev.length > 0 ? prev : MOCK_PLANOS));
        setApostilas((prev) => (prev && prev.length > 0 ? prev : MOCK_APOSTILAS));
        setErroCarregamento('Problemas de Conexão, tente novamente mais tarde');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoBiblioteca(false);
      });

    return () => controller.abort();
  }, [navigate, tentativaCarregamento]);

  /**
   * Efeito 2: Autosave debounced com fila serializada
   */
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
          if (!cancelado && versaoAtual === versaoSalvamento.current) {
            setEstadoSalvamento('salvo');
          }
        })
        .catch((error) => {
          if (error.status === 401) {
            navigate('/login', { replace: true });
            return;
          }
          if (!cancelado && versaoAtual === versaoSalvamento.current) {
            setEstadoSalvamento('erro');
          }
        });
    }, 500);

    return () => {
      cancelado = true;
      window.clearTimeout(timeout);
    };
  }, [
    bibliotecaCarregada,
    livros,
    planos,
    videoaulas,
    apostilas,
    tentativaSalvamento,
    navigate,
  ]);

  // ================= Operações de Livros =================
  const salvarLivro = (dadosLivro) => {
    if (dadosLivro.id) {
      setLivros((prev) =>
        prev.map((l) => (l.id === dadosLivro.id ? { ...l, ...dadosLivro } : l))
      );
      dispararAviso('Livro atualizado!');
    } else {
      setLivros((prev) => [
        { ...dadosLivro, id: Date.now(), comentarios: [] },
        ...prev,
      ]);
      dispararAviso('Livro cadastrado!');
    }
  };

  const removerLivro = (id) => {
    setLivros((prev) => prev.filter((item) => item.id !== id));
    setPlanos((prev) =>
      prev.map((plano) => ({
        ...plano,
        livroIds: (plano.livroIds ?? []).filter((livroId) => livroId !== id),
      }))
    );
    dispararAviso('Livro removido.');
  };

  const adicionarComentarioLivro = (livroId, comentario) => {
    setLivros((prev) =>
      prev.map((livro) =>
        livro.id === livroId
          ? { ...livro, comentarios: [comentario, ...(livro.comentarios ?? [])] }
          : livro
      )
    );
  };

  // ================= Operações de Planos =================
  const criarPlano = ({ nome, disciplina }) => {
    const novo = {
      id: Date.now(),
      nome,
      disciplina,
      livroIds: [],
      apostilaIds: [],
      ativo: false,
    };
    setPlanos((prev) => [novo, ...prev]);
    dispararAviso('Plano de Estudos criado!');
  };

  const removerPlano = (id) => {
    setPlanos((prev) => prev.filter((item) => item.id !== id));
    dispararAviso('Plano de estudos removido.');
  };

  const alternarMaterialPlano = (planoId, tipo, itemId) => {
    const propriedade = tipo === 'livro' ? 'livroIds' : 'apostilaIds';
    const selecionado =
      planos.find((plano) => plano.id === planoId)?.[propriedade] ?? [];
    const removendo = selecionado.includes(itemId);

    setPlanos((prev) =>
      prev.map((plano) =>
        plano.id === planoId
          ? {
              ...plano,
              [propriedade]: removendo
                ? selecionado.filter((id) => id !== itemId)
                : [...selecionado, itemId],
            }
          : plano
      )
    );
    dispararAviso(
      removendo ? 'Material removido do plano.' : 'Material adicionado ao plano.'
    );
  };

  // ================= Operações de Videoaulas =================
  const adicionarVideoaula = (videoaula) => {
    if (videoaulas.some((video) => video.url === videoaula.url)) {
      dispararAviso('Esta videoaula já foi adicionada.');
      return false;
    }
    setVideoaulas((prev) => [videoaula, ...prev]);
    dispararAviso('Videoaula adicionada à biblioteca.');
    return true;
  };

  const removerVideoaula = (id) => {
    setVideoaulas((prev) => prev.filter((item) => item.id !== id));
    dispararAviso('Videoaula removida.');
  };

  // ================= Operações de Conteúdo Web / Apostilas =================
  const salvarApostila = (dadosApostila) => {
    if (dadosApostila.id) {
      setApostilas((prev) =>
        prev.map((apostila) =>
          apostila.id === dadosApostila.id
            ? { ...apostila, ...dadosApostila }
            : apostila
        )
      );
      dispararAviso('Conteúdo web atualizado.');
    } else {
      setApostilas((prev) => [
        { ...dadosApostila, url: dadosApostila.url.trim(), id: Date.now() },
        ...prev,
      ]);
      dispararAviso('Conteúdo web cadastrado.');
    }
  };

  const removerApostila = (id) => {
    setApostilas((prev) => prev.filter((item) => item.id !== id));
    setPlanos((prev) =>
      prev.map((plano) => ({
        ...plano,
        apostilaIds: (plano.apostilaIds ?? []).filter(
          (apostilaId) => apostilaId !== id
        ),
      }))
    );
    dispararAviso('Conteúdo web removido.');
  };

  return {
    livros,
    planos,
    videoaulas,
    apostilas,
    carregandoBiblioteca,
    erroCarregamento,
    estadoSalvamento,
    notificacao,
    tentarCarregarBiblioteca,
    tentarSalvarNovamente,
    dispararAviso,
    salvarLivro,
    removerLivro,
    adicionarComentarioLivro,
    criarPlano,
    removerPlano,
    alternarMaterialPlano,
    adicionarVideoaula,
    removerVideoaula,
    salvarApostila,
    removerApostila,
  };
};

export default useBiblioteca;
