/**
 * index.jsx - Orquestrador Central da Biblioteca Escolar / Módulo Conteúdo
 *
 * Papel Didático:
 * Container de alto nível da rota `/dashboard/biblioteca`.
 * Integra-se ao novo `PainelModulo`, unificando a identidade visual,
 * elevando a busca e os botões de ação para o cabeçalho institucional (BoasVindasCard)
 * e coordenando as 4 abas oficiais alinhadas ao menu lateral (Aside).
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { useBiblioteca } from '../../../hooks/biblioteca/useBiblioteca';
import PainelModulo from '../common/PainelModulo';
import AcervoAba from './AcervoAba';
import VideoaulasAba from './VideoaulasAba';
import ConteudoWebAba from './ConteudoWebAba';
import PlanosAba from './PlanosAba';
import ModalAdicionarAoPlano from './ModalAdicionarAoPlano';
import './Biblioteca.css';

const ABAS = [
  { id: 'acervo', label: 'Biblioteca' },
  { id: 'videoaulas', label: 'Vídeo Aula' },
  { id: 'conteudo-web', label: 'Busca Web' },
  { id: 'planos', label: 'Plano de Estudos' },
];

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default function Biblioteca() {
  const { user } = useAuth();
  const role = user?.role || 'aluno';
  const podeGerenciarAcervo = ['bibliotecaria', 'bibliotecario', 'especialista', 'adm', 'admin'].includes(role);

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  // Sincroniza a aba ativa diretamente com o query param (?tab=...) do Aside
  const abaAtiva = ABAS.some((a) => a.id === tabParam) ? tabParam : 'acervo';
  const [busca, setBusca] = useState('');
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [itemParaAdicionarAoPlano, setItemParaAdicionarAoPlano] = useState(null);

  // Ações de cadastro e importação elevadas do AcervoAba
  const [acoesAcervo, setAcoesAcervo] = useState(null);

  const {
    livros,
    videoaulas,
    carregandoBiblioteca,
    erroCarregamento,
    notificacao,
    tentarCarregarBiblioteca,
    dispararAviso,
    salvarLivro,
    importarCsvLivros,
    removerLivro,
    solicitarEmprestimoLivro,
    adicionarVideoaula,
    removerVideoaula,
  } = useBiblioteca(busca);

  // Filtro complementar local blindado contra campos nulos
  const termoBusca = normalizarTexto(busca.trim());
  const listaSeguraLivros = Array.isArray(livros) ? livros : [];
  const livrosFiltrados = listaSeguraLivros.filter((livro) =>
    !termoBusca ||
    normalizarTexto(livro?.titulo).includes(termoBusca) ||
    normalizarTexto(livro?.codigo_livro).includes(termoBusca) ||
    normalizarTexto(livro?.autor).includes(termoBusca) ||
    normalizarTexto(livro?.genero).includes(termoBusca)
  );

  const handleExecutarExclusao = () => {
    if (!itemParaExcluir) return;
    const { id, tipo } = itemParaExcluir;

    if (tipo === 'livro') removerLivro(id);
    else if (tipo === 'video') removerVideoaula(id);

    setItemParaExcluir(null);
  };

  // Ações do cabeçalho institucional (busca e botões elevados ao BoasVindasCard)
  const acoesBiblioteca = (
    <>
      {abaAtiva === 'acervo' && (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="biblioteca-search-wrapper" style={{ minWidth: '220px' }}>
            <span className="biblioteca-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              className="form-control form-control-sm rounded-pill ps-5 biblioteca-search-input"
              placeholder="Pesquisar no acervo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar livros no acervo escolar"
            />
          </div>

          {podeGerenciarAcervo && acoesAcervo && (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={acoesAcervo.abrirImportarCsv}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold text-nowrap"
                title="Importar lista de exemplares em lote via CSV"
              >
                <i className="bi bi-file-earmark-arrow-up me-1"></i>
                Importar CSV
              </button>
              <button
                type="button"
                onClick={acoesAcervo.abrirNovoLivro}
                className="btn btn-sm btn-primary rounded-pill px-3 fw-bold text-nowrap"
                title="Cadastrar novo livro no acervo físico da escola"
              >
                <i className="bi bi-plus-lg me-1"></i>
                Cadastrar Exemplar
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="position-relative">
      {/* Alerta de Falha de Conexão com o Back-end */}
      {erroCarregamento && (
        <div
          className="alert alert-warning d-flex justify-content-between align-items-center mb-4 shadow-sm rounded-3 border-start border-4 border-warning"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">⚠️</span>
            <span className="fw-semibold text-warning-emphasis small">
              {erroCarregamento}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-dark rounded-pill fw-semibold"
            onClick={tentarCarregarBiblioteca}
          >
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div className="biblioteca-toast">
          <span>✓ {notificacao}</span>
        </div>
      )}

      {/* Estado de Carregamento Estável na Árvore DOM */}
      {carregandoBiblioteca ? (
        <div className="container py-5 text-center text-muted" role="status">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="fw-semibold">
            <span>Carregando acervo da biblioteca escolar...</span>
          </p>
        </div>
      ) : (
        /* Envelope de Superfície Branca Unificada */
        <PainelModulo acoes={acoesBiblioteca}>
          {/* Conteúdo Dinâmico da Aba Selecionada */}
          {abaAtiva === 'acervo' && (
            <AcervoAba
              livros={livrosFiltrados}
              buscaAtiva={Boolean(termoBusca)}
              onSalvarLivro={salvarLivro}
              onImportarCsv={importarCsvLivros}
              onExcluirLivro={setItemParaExcluir}
              onSolicitarEmprestimo={solicitarEmprestimoLivro}
              onAviso={dispararAviso}
              onAdicionarAoPlano={setItemParaAdicionarAoPlano}
              onRegistrarAcoes={setAcoesAcervo}
            />
          )}

          {abaAtiva === 'videoaulas' && (
            <VideoaulasAba
              videoaulas={videoaulas}
              onAdicionarVideoaula={adicionarVideoaula}
              onAdicionarAoPlano={setItemParaAdicionarAoPlano}
            />
          )}

          {abaAtiva === 'conteudo-web' && (
            <ConteudoWebAba
              onAviso={dispararAviso}
              onAdicionarAoPlano={setItemParaAdicionarAoPlano}
            />
          )}

          {abaAtiva === 'planos' && (
            <PlanosAba onAviso={dispararAviso} />
          )}
        </PainelModulo>
      )}

      {/* Modal Genérico de Confirmação de Exclusão */}
      {itemParaExcluir && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setItemParaExcluir(null)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog biblioteca-modal-dialog--sm p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-exclusao-titulo"
          >
            <div className="fs-1 mb-2">🗑️</div>
            <h5 id="confirmar-exclusao-titulo" className="fw-bold mb-2 text-dark">
              Confirmar exclusão?
            </h5>
            <p className="text-muted mb-4 small">
              Deseja realmente remover <strong>"{itemParaExcluir.nome}"</strong>?
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="btn btn-sm btn-light border px-3 rounded-pill"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarExclusao}
                className="btn btn-sm btn-danger px-4 fw-bold rounded-pill"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adição de Conteúdos aos Planos de Estudos */}
      {itemParaAdicionarAoPlano && (
        <ModalAdicionarAoPlano
          item={itemParaAdicionarAoPlano}
          aoFechar={() => setItemParaAdicionarAoPlano(null)}
          aoSucesso={(msg) => dispararAviso(msg)}
        />
      )}
    </div>
  );
}
