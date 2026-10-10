/**
 * index.jsx - Orquestrador Central da Biblioteca Escolar
 *
 * Papel Didático:
 * Atua como o container de alto nível da rota `/dashboard/biblioteca`.
 * Conecta o hook de regras de negócio (`useBiblioteca`) com as 4 abas pedagógicas:
 * 1. `AcervoAba`: acervo bibliográfico físico e digital;
 * 2. `PlanosAba`: trilhas de estudo estruturadas por disciplina;
 * 3. `VideoaulasAba`: curadoria e pesquisa integrada ao YouTube;
 * 4. `ConteudoWebAba`: resumos, apostilas e links pedagógicos externos.
 *
 * Arquitetura Equilibrada:
 * Cada aba é um componente coeso e independente, eliminando a fragmentação
 * excessiva de múltiplos subarquivos sem sobrecarregar um único arquivo monolítico.
 */

import { useState } from 'react';
import { useBiblioteca } from '../../../hooks/biblioteca/useBiblioteca';
import AcervoAba from './AcervoAba';
import PlanosAba from './PlanosAba';
import VideoaulasAba from './VideoaulasAba';
import ConteudoWebAba from './ConteudoWebAba';
import './Biblioteca.css';

const ABAS = [
  { id: 'acervo', label: 'Acervo de Livros' },
  { id: 'videoaulas', label: 'Videoaulas' },
  { id: 'apostilas', label: 'Conteúdo web' },
  { id: 'planos', label: 'Planos de Estudos' },
];

const normalizarTexto = (valor = '') =>
  valor
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default function Biblioteca() {
  const {
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
  } = useBiblioteca();

  // Estados de Navegação e Filtros
  const [abaAtiva, setAbaAtiva] = useState('acervo');
  const [busca, setBusca] = useState('');
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  // Filtro unificado de pesquisa
  const termoBusca = normalizarTexto(busca.trim());
  const correspondeBusca = (...valores) =>
    !termoBusca ||
    valores.some((valor) => normalizarTexto(valor ?? '').includes(termoBusca));

  const livrosFiltrados = livros.filter((livro) =>
    correspondeBusca(livro.titulo, livro.autor)
  );
  const planosFiltrados = planos.filter((plano) =>
    correspondeBusca(plano.nome, plano.disciplina)
  );
  const apostilasFiltradas = apostilas.filter((apostila) =>
    correspondeBusca(
      apostila.titulo,
      apostila.materia,
      apostila.descricao,
      apostila.topico,
      apostila.tipo,
      apostila.nivel,
      apostila.autor
    )
  );

  const handleExecutarExclusao = () => {
    if (!itemParaExcluir) return;
    const { id, tipo } = itemParaExcluir;

    if (tipo === 'livro') removerLivro(id);
    else if (tipo === 'plano') removerPlano(id);
    else if (tipo === 'video') removerVideoaula(id);
    else if (tipo === 'apostila') removerApostila(id);

    setItemParaExcluir(null);
  };

  const handleSelecionarAba = (idAba) => {
    setAbaAtiva(idAba);
    setBusca('');
  };

  if (carregandoBiblioteca) {
    return (
      <div className="container py-5 text-center text-muted" role="status">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        Carregando sua biblioteca...
      </div>
    );
  }

  const labelAbaAtiva =
    ABAS.find((aba) => aba.id === abaAtiva)?.label.toLowerCase() ?? 'biblioteca';

  return (
    <div className="position-relative">
      {/* Alerta de Falha de Conexão */}
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
            Tentar novamente
          </button>
        </div>
      )}

      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div className="biblioteca-toast">✓ {notificacao}</div>
      )}

      {/* Painel Central Branco */}
      <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        {/* Cabeçalho com Busca e Abas */}
        <header className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <h2 className="fw-bold mb-0 text-primary fs-4">Gerenciar Biblioteca</h2>

            <div className="d-flex align-items-center gap-3">
              <div className="biblioteca-search-wrapper">
                <span className="biblioteca-search-icon" aria-hidden="true">
                  🔍
                </span>
                <input
                  type="text"
                  className="form-control rounded-pill ps-5 py-2 biblioteca-search-input"
                  placeholder={`Pesquisar ${labelAbaAtiva}...`}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  aria-label={`Pesquisar em ${labelAbaAtiva}`}
                />
              </div>

              {estadoSalvamento && (
                <span
                  className={`d-none d-sm-inline small ${
                    estadoSalvamento === 'erro'
                      ? 'text-danger fw-semibold'
                      : 'text-muted'
                  }`}
                  role="status"
                >
                  {estadoSalvamento === 'salvando'
                    ? 'Salvando...'
                    : estadoSalvamento === 'salvo'
                    ? 'Salvo'
                    : 'Falha ao salvar'}
                </span>
              )}

              {estadoSalvamento === 'erro' && (
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-danger"
                  onClick={tentarSalvarNovamente}
                >
                  Tentar salvar
                </button>
              )}
            </div>
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
            onSalvarLivro={salvarLivro}
            onExcluirLivro={setItemParaExcluir}
            onAdicionarComentario={adicionarComentarioLivro}
            onAviso={dispararAviso}
          />
        )}


        {abaAtiva === 'videoaulas' && (
          <VideoaulasAba
          videoaulas={videoaulas}
          onAdicionarVideoaula={adicionarVideoaula}
          />
        )}

        {abaAtiva === 'apostilas' && (
          <ConteudoWebAba
          apostilas={apostilasFiltradas}
          onSalvarApostila={salvarApostila}
          onExcluirApostila={setItemParaExcluir}
          />
        )}

        {abaAtiva === 'planos' && (
          <PlanosAba
            planos={planosFiltrados}
            livros={livros}
            apostilas={apostilas}
            onCriarPlano={criarPlano}
            onExcluirPlano={setItemParaExcluir}
            onAlternarMaterial={alternarMaterialPlano}
          />
        )}
      </div>

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
              Deseja mesmo eliminar <strong>"{itemParaExcluir.nome}"</strong>?
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
    </div>
  );
}