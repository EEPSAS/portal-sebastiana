/**
 * AcervoAba.jsx - Aba de Gestão e Consulta do Acervo de Livros Físicos
 *
 * Papel Didático:
 * Centraliza o catálogo físico da biblioteca escolar:
 * - Listagem com cartões responsivos dos livros e exemplares;
 * - Controle de disponibilidade e solicitação de empréstimo pelo estudante;
 * - Modal controlado de cadastro/edição de títulos conectado à API RESTful;
 * - Modal de solicitação de retirada de exemplares físicos.
 */

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const ESTADO_LIVRO_INICIAL = {
  id: null,
  codigo_livro: '',
  titulo: '',
  autor: '',
  editora: '',
  genero: '',
  data_lancamento: '',
  prateleira_localizacao: '',
  quantidade_total: 1,
  capa: '',
};

const AcervoAba = ({
  livros = [],
  buscaAtiva = false,
  onSalvarLivro,
  onImportarCsv,
  onExcluirLivro,
  onSolicitarEmprestimo,
  onAviso,
  onAdicionarAoPlano,
}) => {
  // Obtém o usuário autenticado (ou perfil simulado pelo Adm) para aplicar o RBAC na interface
  const { user } = useAuth();
  const roleAtual = String(user?.role || '').toLowerCase();

  // Apenas Bibliotecária, Especialista e Administrador possuem acesso ao CRUD e Importação CSV
  // Aluno e Professor possuem acesso estritamente de leitura/consulta do acervo
  const podeGerenciarAcervo = ['bibliotecaria', 'bibliotecario', 'especialista', 'adm', 'admin'].includes(
    roleAtual
  );

  // Estados dos modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalCsvAberto, setModalCsvAberto] = useState(false);
  const [modalEmprestimoAberto, setModalEmprestimoAberto] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [formData, setFormData] = useState(ESTADO_LIVRO_INICIAL);
  const [arquivoCsv, setArquivoCsv] = useState(null);
  const [observacaoEmprestimo, setObservacaoEmprestimo] = useState('');
  const [salvando, setSalvando] = useState(false);

  // ================= Ações do Formulário de Livro =================
  const abrirNovoLivro = () => {
    setFormData(ESTADO_LIVRO_INICIAL);
    setModalFormAberto(true);
  };

  const abrirEdicaoLivro = (livro) => {
    setFormData({
      id: livro.id,
      codigo_livro: livro.codigo_livro || '',
      titulo: livro.titulo || '',
      autor: livro.autor || '',
      editora: livro.editora || '',
      genero: livro.genero || '',
      data_lancamento: livro.data_lancamento || livro.data_publicacao || '',
      prateleira_localizacao: livro.prateleira_localizacao || livro.localizacao || '',
      quantidade_total: livro.quantidade_total || 1,
      capa: livro.capa || livro.capa_url || '',
    });
    setModalFormAberto(true);
  };

  const handleSubmitLivro = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.autor.trim()) {
      onAviso?.('Título e Autor são obrigatórios.');
      return;
    }

    setSalvando(true);
    const sucesso = await onSalvarLivro({
      ...formData,
      quantidade_total: Number(formData.quantidade_total) || 1,
    });
    setSalvando(false);

    if (sucesso) {
      setModalFormAberto(false);
    }
  };

  // ================= Ação de Importação em Massa via CSV =================
  const handleSubmitCsv = async (e) => {
    e.preventDefault();
    if (!arquivoCsv) {
      onAviso?.('Selecione um arquivo CSV válido para importar.');
      return;
    }

    setSalvando(true);
    const sucesso = await onImportarCsv?.(arquivoCsv);
    setSalvando(false);

    if (sucesso) {
      setArquivoCsv(null);
      setModalCsvAberto(false);
    }
  };

  // ================= Ações de Empréstimo =================
  const abrirModalEmprestimo = (livro) => {
    setLivroSelecionado(livro);
    setObservacaoEmprestimo('');
    setModalEmprestimoAberto(true);
  };

  const handleConfirmarEmprestimo = async (e) => {
    e.preventDefault();
    if (!livroSelecionado) return;

    setSalvando(true);
    const sucesso = await onSolicitarEmprestimo(
      livroSelecionado.id,
      observacaoEmprestimo.trim()
    );
    setSalvando(false);

    if (sucesso) {
      setModalEmprestimoAberto(false);
      setLivroSelecionado(null);
    }
  };

  return (
    <section aria-label="Acervo de Livros">
      {/* Barra Superior de Ações */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <span className="text-muted small">
            {buscaAtiva
              ? `${livros.length} título(s) encontrado(s) na pesquisa`
              : `Exibindo os ${livros.length} último(s) livro(s) cadastrado(s) no acervo`}
          </span>
        </div>

        {/* Botões de Gestão (Restritos a Bibliotecária, Especialista e Adm) */}
        {podeGerenciarAcervo && (
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setArquivoCsv(null);
                setModalCsvAberto(true);
              }}
              className="btn btn-outline-primary rounded-pill px-3 py-2 shadow-sm small fw-semibold"
            >
              📥 Importar CSV
            </button>
            <button
              type="button"
              onClick={abrirNovoLivro}
              className="btn rounded-pill px-4 py-2 biblioteca-btn-primario shadow-sm small fw-semibold"
            >
              + Cadastrar Exemplar
            </button>
          </div>
        )}
      </div>

      {/* Grade de Livros Redimensionada para 5 Cards em Uma Linha no Desktop (row-cols-xl-5) */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5 g-3">
        {livros.map((livro) => {
          const disponivel =
            livro.disponivel ??
            (livro.quantidade_disponivel !== undefined
              ? livro.quantidade_disponivel > 0
              : livro.status === 'Disponível');

          const capaUrl = livro.capa || livro.capa_url || livro.imagem;
          const localizacao = livro.prateleira_localizacao || livro.localizacao;

          return (
            <div key={livro.id} className="col">
              <div className="card h-100 border-0 shadow-sm livro-card">
                {/* Capa */}
                <div
                  className="livro-card-cover position-relative"
                  style={{ backgroundColor: '#f1f5f9', minHeight: '140px' }}
                >
                  {capaUrl ? (
                    <img
                      src={capaUrl}
                      alt={livro.titulo}
                      loading="lazy"
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <div className="livro-card-placeholder text-primary fs-1">
                      📖
                    </div>
                  )}

                  {livro.genero && (
                    <span className="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2 rounded-pill small">
                      {livro.genero}
                    </span>
                  )}

                  {livro.codigo_livro && (
                    <span className="badge bg-primary position-absolute bottom-0 end-0 m-2 rounded-pill small">
                      {livro.codigo_livro}
                    </span>
                  )}
                </div>

                {/* Corpo do Cartão Compactado para 5 Colunas */}
                <div className="card-body d-flex flex-column p-3">
                  <h5
                    className="card-title fw-bold mb-1 text-truncate text-dark fs-6"
                    title={livro.titulo}
                  >
                    {livro.titulo}
                  </h5>
                  <p className="card-text text-muted mb-1 text-truncate small">
                    {livro.autor}
                  </p>
                  {livro.editora && (
                    <p className="text-secondary mb-1 text-truncate" style={{ fontSize: '11px' }}>
                      🏢 {livro.editora}
                    </p>
                  )}

                  {localizacao && (
                    <p className="text-secondary mb-2 text-truncate" style={{ fontSize: '11px' }} title={localizacao}>
                      📍 {localizacao}
                    </p>
                  )}

                  <div className="mt-auto">
                    {/* Badge de Disponibilidade */}
                    <div className="mb-2 text-center">
                      {disponivel ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill py-1 px-2 w-100 fw-semibold">
                          Disponível ({livro.quantidade_disponivel ?? 1}/{livro.quantidade_total ?? 1})
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill py-1 px-2 w-100 fw-semibold">
                          Esgotado
                        </span>
                      )}
                    </div>

                    {/* Botão de Solicitar Empréstimo */}
                    <button
                      type="button"
                      disabled={!disponivel}
                      onClick={() => abrirModalEmprestimo(livro)}
                      className={`btn btn-sm w-100 rounded-pill mb-2 fw-semibold ${
                        disponivel
                          ? 'btn-primary'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      <span>{disponivel ? 'Solicitar Empréstimo' : 'Indisponível'}</span>
                    </button>

                    {/* Botão de Adicionar aos Planos de Estudos */}
                    <button
                      type="button"
                      onClick={() =>
                        onAdicionarAoPlano?.({
                          tipo: 'livro',
                          livro_id: livro.id_livro || livro.id,
                          conteudo_id: livro.id,
                          titulo: livro.titulo,
                          descricao: livro.genero ? `Gênero: ${livro.genero} · Autor: ${livro.autor}` : livro.autor,
                          url: null,
                          thumbnail: capaUrl,
                          fonte: livro.editora || 'Biblioteca Escolar',
                          duracao: null,
                        })
                      }
                      className="btn btn-sm w-100 btn-outline-success rounded-pill mb-2 fw-semibold"
                      title="Adicionar exemplar aos Planos de Estudos"
                    >
                      <span>+ Adicionar aos planos</span>
                    </button>

                    {/* Ações Administrativas de Gestão (Exclusivas para Bibliotecária, Especialista e Adm) */}
                    {podeGerenciarAcervo && (
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicaoLivro(livro)}
                          className="btn btn-sm btn-outline-secondary w-50 rounded-pill"
                          title="Editar exemplar"
                        >
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onExcluirLivro({
                              id: livro.id,
                              tipo: 'livro',
                              nome: livro.titulo,
                            })
                          }
                          className="btn btn-sm btn-outline-danger w-50 rounded-pill"
                          title="Excluir exemplar"
                        >
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Estado Vazio Obrigatório */}
        {livros.length === 0 && (
          <div className="col-12 text-center text-muted py-5" role="status">
            <span className="fs-1 d-block mb-2">📚</span>
            <p className="mb-1 fw-semibold fs-6">Nenhum exemplar encontrado no acervo.</p>
            <p className="small text-secondary">
              Tente buscar por outro termo ou cadastre um novo título.
            </p>
          </div>
        )}
      </div>

      {/* ================= Modal: Importação em Massa via CSV ================= */}
      {modalCsvAberto && podeGerenciarAcervo && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalCsvAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog p-4 position-relative"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-csv-titulo"
          >
            <button
              type="button"
              onClick={() => setModalCsvAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar modal CSV"
            />
            <h4 id="modal-csv-titulo" className="fw-bold mb-2 text-dark fs-5">
              Importar Livros em Massa (CSV)
            </h4>
            <p className="text-muted small mb-3">
              Envie um arquivo <strong>.csv</strong> contendo os dados definitivos do acervo escolar.
            </p>

            <div className="alert alert-light border small py-2 mb-3">
              <strong>Colunas esperadas no cabeçalho:</strong>
              <code className="d-block mt-1 text-primary">
                titulo;editora;autor;genero;data_lancamento;codigo_livro
              </code>
            </div>

            <form onSubmit={handleSubmitCsv}>
              <div className="mb-3">
                <label htmlFor="input-csv-livros" className="form-label small fw-semibold">
                  Selecione o arquivo CSV *
                </label>
                <input
                  id="input-csv-livros"
                  type="file"
                  accept=".csv,.txt"
                  className="form-control form-control-sm"
                  required
                  onChange={(e) => setArquivoCsv(e.target.files?.[0] || null)}
                  disabled={salvando}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  onClick={() => setModalCsvAberto(false)}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
                  disabled={salvando || !arquivoCsv}
                >
                  {salvando ? 'Importando...' : 'Confirmar Importação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Modal: Cadastro / Edição de Livro ================= */}
      {modalFormAberto && podeGerenciarAcervo && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalFormAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog p-4 position-relative"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-livro-titulo"
          >
            <button
              type="button"
              onClick={() => setModalFormAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar formulário"
            />
            <h4 id="form-livro-titulo" className="fw-bold mb-3 text-dark fs-5">
              {formData.id ? 'Editar Exemplar' : 'Cadastrar Exemplar no Acervo'}
            </h4>
            <form onSubmit={handleSubmitLivro}>
              <div className="row g-2 mb-2">
                <div className="col-8">
                  <label htmlFor="livro-titulo" className="form-label small fw-semibold mb-1">
                    Título do Livro *
                  </label>
                  <input
                    id="livro-titulo"
                    type="text"
                    className="form-control form-control-sm"
                    required
                    placeholder="Ex: Dom Casmurro"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="livro-codigo" className="form-label small fw-semibold mb-1">
                    Código do Livro
                  </label>
                  <input
                    id="livro-codigo"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: LIV-0001"
                    value={formData.codigo_livro}
                    onChange={(e) => setFormData({ ...formData, codigo_livro: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label htmlFor="livro-autor" className="form-label small fw-semibold mb-1">
                    Autor *
                  </label>
                  <input
                    id="livro-autor"
                    type="text"
                    className="form-control form-control-sm"
                    required
                    placeholder="Ex: Machado de Assis"
                    value={formData.autor}
                    onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label htmlFor="livro-editora" className="form-label small fw-semibold mb-1">
                    Editora
                  </label>
                  <input
                    id="livro-editora"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: Companhia das Letras"
                    value={formData.editora}
                    onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                  />
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-4">
                  <label htmlFor="livro-genero" className="form-label small fw-semibold mb-1">
                    Gênero
                  </label>
                  <input
                    id="livro-genero"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: Romance"
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="livro-data" className="form-label small fw-semibold mb-1">
                    Data Lançamento
                  </label>
                  <input
                    id="livro-data"
                    type="date"
                    className="form-control form-control-sm"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="livro-qtd" className="form-label small fw-semibold mb-1">
                    Qtd. Cópias *
                  </label>
                  <input
                    id="livro-qtd"
                    type="number"
                    min="1"
                    className="form-control form-control-sm"
                    required
                    value={formData.quantidade_total}
                    onChange={(e) => setFormData({ ...formData, quantidade_total: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="livro-localizacao" className="form-label small fw-semibold mb-1">
                  Localização Física (Estante / Prateleira)
                </label>
                <input
                  id="livro-localizacao"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Corredor B, Estante 2, Prateleira 1"
                  value={formData.prateleira_localizacao}
                  onChange={(e) =>
                    setFormData({ ...formData, prateleira_localizacao: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label htmlFor="livro-capa" className="form-label small fw-semibold mb-1">
                  URL da Imagem de Capa
                </label>
                <input
                  id="livro-capa"
                  type="url"
                  className="form-control form-control-sm"
                  placeholder="https://..."
                  value={formData.capa}
                  onChange={(e) => setFormData({ ...formData, capa: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  onClick={() => setModalFormAberto(false)}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
                  disabled={salvando}
                >
                  <span>{salvando ? 'Salvando...' : formData.id ? 'Salvar Alterações' : 'Cadastrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Modal: Solicitar Empréstimo ================= */}
      {modalEmprestimoAberto && livroSelecionado && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalEmprestimoAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog p-4 position-relative"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-emprestimo-titulo"
          >
            <button
              type="button"
              onClick={() => setModalEmprestimoAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar modal"
            />
            <h5 id="modal-emprestimo-titulo" className="fw-bold mb-2 text-dark">
              <span>Solicitar Empréstimo</span>
            </h5>
            <p className="text-muted small mb-3">
              Confirme a solicitação de retirada do livro{' '}
              <strong>"{livroSelecionado.titulo}"</strong> ({livroSelecionado.autor}).
            </p>

            <form onSubmit={handleConfirmarEmprestimo}>
              <div className="mb-3">
                <label htmlFor="emprestimo-obs" className="form-label small fw-semibold mb-1">
                  Observações para a biblioteca (opcional)
                </label>
                <textarea
                  id="emprestimo-obs"
                  rows="3"
                  className="form-control form-control-sm"
                  placeholder="Ex: Trabalho de literatura ou estudo para ENEM..."
                  value={observacaoEmprestimo}
                  onChange={(e) => setObservacaoEmprestimo(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="alert alert-info py-2 small mb-3">
                ℹ️ Após confirmar, compareça à biblioteca escolar em até 48 horas para retirar o exemplar.
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmprestimoAberto(false)}
                  className="btn btn-sm btn-light border rounded-pill px-3"
                  disabled={salvando}
                >
                  <span>Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
                  disabled={salvando}
                >
                  <span>{salvando ? 'Solicitando...' : 'Confirmar Solicitação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AcervoAba;
