/**
 * index.jsx - Orquestrador Central da Biblioteca Escolar
 *
 * Papel Didático:
 * Container de alto nível da rota `/dashboard/biblioteca`.
 * Conecta o hook de regras de negócio (`useBiblioteca`) com as 3 abas oficiais do contrato:
 * 1. `AcervoAba`: Acervo bibliográfico físico e controle de empréstimos;
 * 2. `VideoaulasAba`: Curadoria e pesquisa integrada ao YouTube Data API;
 * 3. `ConteudoWebAba`: Pesquisa de livros, apostilas e referências didáticas no Google Books API.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { useBiblioteca } from '../../../hooks/biblioteca/useBiblioteca';
import AcervoAba from './AcervoAba';
import VideoaulasAba from './VideoaulasAba';
import ConteudoWebAba from './ConteudoWebAba';
import PlanosAba from './PlanosAba';
import ModalAdicionarAoPlano from './ModalAdicionarAoPlano';
import './Biblioteca.css';

const ABAS = [
  { id: 'acervo', label: 'Acervo de Livros' },
  { id: 'videoaulas', label: 'Videoaulas' },
  { id: 'conteudo-web', label: 'Conteúdo Web' },
  { id: 'planos', label: 'Planos de Estudos' },
];

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default function Biblioteca() {
  const { user } = useAuth();
  const podeGerenciar = user?.role === 'especialista' || user?.role === 'adm';

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [abaAtiva, setAbaAtiva] = useState(
    ABAS.some((a) => a.id === tabParam) ? tabParam : 'acervo'
  );
  const [busca, setBusca] = useState('');
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [itemParaAdicionarAoPlano, setItemParaAdicionarAoPlano] = useState(null);

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

  // Filtro complementar local blindado contra campos nulos (além da busca no servidor)
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

  const handleSelecionarAba = (idAba) => {
    setAbaAtiva(idAba);
    setBusca('');
    setSearchParams({ tab: idAba });
  };

  return (
    <div className={`position-relative ${podeGerenciar ? 'dashboard-tema-gestao' : ''}`.trim()}>
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
        /* Painel Central Branco */
        <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        {/* Cabeçalho com Busca e Abas */}
        <header className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1 text-primary fs-4 dashboard-header-titulo">Biblioteca Escolar</h2>
              <p className="text-muted small mb-0">
                Consulte o acervo físico, assista a videoaulas e pesquise conteúdos pedagógicos.
              </p>
              {/* Linha divisória de 48px navy */}
              {podeGerenciar && <span className="dashboard-header-divisor" aria-hidden="true" />}
            </div>

            {abaAtiva === 'acervo' && (
              <div className="biblioteca-search-wrapper">
                <span className="biblioteca-search-icon" aria-hidden="true">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control rounded-pill ps-5 py-2 biblioteca-search-input"
                  placeholder="Pesquisar código, título, autor ou gênero..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  aria-label="Pesquisar livros no acervo escolar"
                />
              </div>
            )}
          </div>

          <nav className="d-flex gap-4 border-bottom pb-2" aria-label="Abas da Biblioteca">
            {ABAS.map((aba) => (
              <button
                key={aba.id}
                type="button"
                onClick={() => handleSelecionarAba(aba.id)}
                className={`biblioteca-tab-btn ${
                  abaAtiva === aba.id ? 'is-active' : ''
                }`}
              >
                {aba.label}
              </button>
            ))}
          </nav>
        </header>

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
      </div>
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