/**
 * PlanosAba.jsx - Aba de Gestão de Planos de Estudo da Biblioteca
 *
 * Papel Didático:
 * Centraliza as trilhas de estudo do estudante e do professor:
 * - Criação ágil de novos planos categorizados por disciplina;
 * - Listagem de cartões de planos próprios com contadores reais por tipo (livros, videoaulas e web);
 * - Para o Aluno: Visualização exclusiva dos próprios planos e seção dedicada somente-leitura
 *   com os planos compartilhados pelos professores para a sua turma (sem opção de compartilhar com outros alunos);
 * - Para o Professor (e Adm): Botão e modal para compartilhar planos de estudo criados por ele
 *   com suas turmas vinculadas (1º, 2º ou 3º ano) através de um campo de busca interativo;
 * - Navegação direta para a visualização detalhada do plano ('/dashboard/biblioteca/planos/:id').
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { planosService } from '../../../services/biblioteca/planosService';

const MATERIAS_DISPONIVEIS = [
  'Matemática',
  'Português',
  'Redação',
  'Física',
  'Química',
  'Biologia',
  'História',
  'Geografia',
  'Filosofia',
  'Sociologia',
  'Inglês',
  'Espanhol',
];

export default function PlanosAba({ onAviso }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleAtual = String(user?.role || '').toLowerCase();

  // Somente o professor (ou adm em simulação/gestão) pode compartilhar planos com as turmas
  const podeCompartilharComTurmas = ['professor', 'adm'].includes(roleAtual);

  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    disciplina: 'Matemática',
  });

  // Estados do modal de compartilhamento exclusivo para Professores
  const [planoCompartilhando, setPlanoCompartilhando] = useState(null);
  const [turmasVinculadas, setTurmasVinculadas] = useState([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [buscaTurma, setBuscaTurma] = useState('');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [salvandoCompartilhamento, setSalvandoCompartilhamento] = useState(false);
  const [erroCompartilhamento, setErroCompartilhamento] = useState('');

  const recarregarPlanos = async () => {
    try {
      setCarregando(true);
      setErro('');
      const resposta = await planosService.listar();
      const lista = Array.isArray(resposta) ? resposta : (resposta?.data || []);
      setPlanos(lista);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar seus planos de estudos.');
    } finally {
      setCarregando(false);
    }
  };

  // Carrega os planos do usuário ao montar o componente
  useEffect(() => {
    let montado = true;

    planosService
      .listar()
      .then((resposta) => {
        if (!montado) return;
        const lista = Array.isArray(resposta) ? resposta : (resposta?.data || []);
        setPlanos(lista);
      })
      .catch((err) => {
        if (!montado) return;
        setErro(err.message || 'Erro ao carregar seus planos de estudos.');
      })
      .finally(() => {
        if (!montado) return;
        setCarregando(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  // Criação rápida de um novo plano
  const handleSubmitCriar = async (e) => {
    e.preventDefault();
    if (!novoPlano.nome.trim()) return;

    try {
      setCriando(true);
      setErro('');
      await planosService.criar({
        nome: novoPlano.nome.trim(),
        disciplina: novoPlano.disciplina,
      });

      onAviso?.('Plano de estudos criado com sucesso!');
      setNovoPlano({ nome: '', disciplina: 'Matemática' });
      await recarregarPlanos();
    } catch (err) {
      setErro(err.message || 'Erro ao criar plano de estudos.');
    } finally {
      setCriando(false);
    }
  };

  // Exclusão de um plano próprio
  const handleExcluirPlano = async (plano) => {
    if (!window.confirm(`Deseja realmente excluir o plano "${plano.nome}"? Esta ação removerá os vínculos dos conteúdos deste plano.`)) {
      return;
    }

    try {
      await planosService.excluir(plano.id);
      onAviso?.('Plano de estudos excluído com sucesso.');
      setPlanos((prev) => prev.filter((p) => p.id !== plano.id));
    } catch (err) {
      alert(err.message || 'Erro ao excluir plano de estudos.');
    }
  };

  // Abre o modal de compartilhamento com turmas e busca as turmas vinculadas ao professor
  const abrirModalCompartilhar = async (plano) => {
    setPlanoCompartilhando(plano);
    setBuscaTurma('');
    setErroCompartilhamento('');
    // Pré-seleciona as turmas que já estavam associadas ao plano
    const idsAtuais = Array.isArray(plano.turma_ids)
      ? plano.turma_ids
      : (plano.turmas || []).map((t) => t.id_turma);
    setTurmasSelecionadas(idsAtuais);

    try {
      setCarregandoTurmas(true);
      const resposta = await planosService.listarTurmasLecionadas();
      const lista = Array.isArray(resposta) ? resposta : (resposta?.data || []);
      setTurmasVinculadas(lista);
    } catch (err) {
      setErroCompartilhamento(err.message || 'Não foi possível carregar as turmas vinculadas.');
    } finally {
      setCarregandoTurmas(false);
    }
  };

  const fecharModalCompartilhar = () => {
    setPlanoCompartilhando(null);
    setBuscaTurma('');
    setErroCompartilhamento('');
  };

  // Alterna a seleção de uma turma (1º, 2º ou 3º ano) na lista de compartilhamento
  const alternarSelecaoTurma = (idTurma) => {
    setTurmasSelecionadas((prev) =>
      prev.includes(idTurma)
        ? prev.filter((id) => id !== idTurma)
        : [...prev, idTurma]
    );
  };

  // Salva o compartilhamento do plano com as turmas selecionadas pelo professor
  const handleSalvarCompartilhamento = async (e) => {
    e.preventDefault();
    if (!planoCompartilhando) return;

    try {
      setSalvandoCompartilhamento(true);
      setErroCompartilhamento('');
      const resposta = await planosService.compartilhar(
        planoCompartilhando.id,
        turmasSelecionadas
      );

      const planoAtualizado = resposta?.data || resposta;
      setPlanos((prev) =>
        prev.map((p) => (p.id === planoCompartilhando.id ? { ...p, ...planoAtualizado } : p))
      );

      onAviso?.(
        resposta?.message ||
          (turmasSelecionadas.length > 0
            ? 'Plano de estudos compartilhado com as turmas selecionadas!'
            : 'Compartilhamento com turmas removido.')
      );
      fecharModalCompartilhar();
    } catch (err) {
      setErroCompartilhamento(err.message || 'Erro ao compartilhar plano com as turmas.');
    } finally {
      setSalvandoCompartilhamento(false);
    }
  };

  // Filtra em tempo real as turmas vinculadas ao professor com base no campo de busca (1º, 2º ou 3º ano)
  const turmasFiltradas = turmasVinculadas.filter((turma) => {
    const termo = buscaTurma.trim().toLowerCase();
    if (!termo) return true;
    const nome = turma.nome_identificador || turma.nome_turma || '';
    const textoTurma = `${nome} ${turma.turno || ''} ${turma.ano_letivo || ''}`.toLowerCase();
    return textoTurma.includes(termo);
  });

  // Separa os planos criados pelo próprio usuário dos planos compartilhados pelos professores
  const meusPlanos = planos.filter((p) => !p.compartilhado_por_professor);
  const planosCompartilhadosTurma = planos.filter((p) => Boolean(p.compartilhado_por_professor));

  return (
    <section aria-label="Planos de Estudos">
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark fs-6">Meus Planos de Estudos</h4>
        <p className="text-muted mb-0 small">
          {podeCompartilharComTurmas
            ? 'Crie trilhas de estudo temáticas e compartilhe com suas turmas vinculadas (1º, 2º ou 3º ano).'
            : 'Organize seus livros do acervo, videoaulas do YouTube e conteúdos pesquisados na web em trilhas pessoais.'}
        </p>
      </div>

      {/* Formulário Rápido de Criação */}
      <form
        onSubmit={handleSubmitCriar}
        className="p-3 rounded-4 mb-4 border bg-light"
      >
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <label
              htmlFor="nome-plano"
              className="form-label mb-1 text-secondary fw-bold"
              style={{ fontSize: '11px' }}
            >
              NOME DO PLANO (Ex: Preparação ENEM)
            </label>
            <input
              id="nome-plano"
              type="text"
              className="form-control form-control-sm"
              placeholder="Nome do plano de estudos"
              value={novoPlano.nome}
              onChange={(e) =>
                setNovoPlano({ ...novoPlano, nome: e.target.value })
              }
              required
              disabled={criando}
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="disciplina-plano"
              className="form-label mb-1 text-secondary fw-bold"
              style={{ fontSize: '11px' }}
            >
              DISCIPLINA
            </label>
            <select
              id="disciplina-plano"
              className="form-select form-select-sm"
              value={novoPlano.disciplina}
              onChange={(e) =>
                setNovoPlano({ ...novoPlano, disciplina: e.target.value })
              }
              disabled={criando}
            >
              {MATERIAS_DISPONIVEIS.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <button
              type="submit"
              className="btn btn-sm w-100 biblioteca-btn-primario py-2 rounded-3"
              disabled={criando}
            >
              {criando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Criando...
                </>
              ) : (
                '+ Confirmar Criação'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Alerta de Erro */}
      {erro && (
        <div className="alert alert-warning py-2 small mb-4 d-flex align-items-center gap-2" role="alert">
          <span>⚠️</span>
          <span>{erro}</span>
        </div>
      )}

      {/* Estado de Carregamento */}
      {carregando ? (
        <div className="py-5 text-center text-muted" role="status">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="fw-semibold small">Carregando seus planos de estudos...</p>
        </div>
      ) : (
        <>
          {/* Grade de Cartões dos Planos Próprios */}
          <div className="row g-4 mt-1">
            {meusPlanos.map((plano) => {
              const totalLivros = plano.livros_count ?? 0;
              const totalVideoaulas = plano.videoaulas_count ?? 0;
              const totalWeb = plano.conteudos_web_count ?? 0;
              const turmasDoPlano = plano.turmas || [];

              return (
                <div key={plano.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card p-4 h-100 plano-estudo-card">
                    <button
                      type="button"
                      onClick={() => handleExcluirPlano(plano)}
                      className="position-absolute plano-estudo-card-delete-btn p-1"
                      title="Excluir Plano"
                      aria-label={`Excluir plano ${plano.nome}`}
                    >
                      ✕
                    </button>

                    <h6 className="fw-bold mb-2 text-dark fs-6 pe-4">
                      {plano.nome}
                    </h6>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1 rounded">
                        {plano.disciplina}
                      </span>
                      <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded">
                        {plano.total_itens ?? (totalLivros + totalVideoaulas + totalWeb)} itens
                      </span>
                    </div>

                    {/* Exibe para o professor as turmas nas quais este plano já está compartilhado */}
                    {podeCompartilharComTurmas && turmasDoPlano.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1 fw-semibold" style={{ fontSize: '11px' }}>
                          COMPARTILHADO COM:
                        </small>
                        <div className="d-flex flex-wrap gap-1">
                          {turmasDoPlano.map((turma) => (
                            <span
                              key={turma.id_turma}
                              className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1"
                              style={{ fontSize: '11px' }}
                            >
                              👥 {turma.nome_identificador || turma.nome_turma}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-3 p-3 mb-3 bg-light border border-light-subtle">
                      <div className="d-flex flex-wrap gap-2 mb-2 fw-semibold text-dark small">
                        <span>
                          {totalLivros} Livro{totalLivros !== 1 ? 's' : ''}
                        </span>
                        <span>·</span>
                        <span>
                          {totalVideoaulas} Videoaula{totalVideoaulas !== 1 ? 's' : ''}
                        </span>
                        <span>·</span>
                        <span>
                          {totalWeb} Web
                        </span>
                      </div>
                      <div className="d-flex gap-2" aria-hidden="true">
                        <span title="Livros">📘</span>
                        <span title="Videoaulas">📺</span>
                        <span title="Conteúdo web">📄</span>
                      </div>
                    </div>

                    <div className="mt-auto d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/biblioteca/planos/${plano.id}`)}
                        className="btn btn-link p-0 text-decoration-none fw-semibold text-success small"
                      >
                        Ver Plano Completo →
                      </button>

                      {/* Botão exclusivo do Professor para compartilhar o plano com turma do 1º, 2º ou 3º ano */}
                      {podeCompartilharComTurmas && (
                        <button
                          type="button"
                          onClick={() => abrirModalCompartilhar(plano)}
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                          style={{ fontSize: '12px' }}
                        >
                          👥 Compartilhar com Turma
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {meusPlanos.length === 0 && (
              <div className="col-12 text-center text-muted py-4 border rounded-4 bg-light">
                <span className="fs-2 d-block mb-2">📁</span>
                <p className="mb-1 fw-semibold fs-6">Você ainda não criou nenhum plano de estudos.</p>
                <p className="small text-secondary mb-0">
                  Crie um plano acima ou utilize o botão "+ Adicionar aos planos" ao navegar pelo Acervo, Videoaulas e Conteúdo Web.
                </p>
              </div>
            )}
          </div>

          {/* Seção exclusiva para Alunos com Planos Compartilhados pelos Professores da sua Turma */}
          {planosCompartilhadosTurma.length > 0 && (
            <div className="mt-5 pt-4 border-top">
              <div className="mb-3">
                <h5 className="fw-bold mb-1 text-dark fs-6 d-flex align-items-center gap-2">
                  <span>🎓</span> Planos de Estudo Compartilhados pelos Professores (Minha Turma)
                </h5>
                <p className="text-muted mb-0 small">
                  Trilhas pedagógicas recomendadas pelos seus professores para a sua turma.
                </p>
              </div>

              <div className="row g-4">
                {planosCompartilhadosTurma.map((plano) => {
                  const totalLivros = plano.livros_count ?? 0;
                  const totalVideoaulas = plano.videoaulas_count ?? 0;
                  const totalWeb = plano.conteudos_web_count ?? 0;

                  return (
                    <div key={plano.id} className="col-12 col-md-6 col-xl-4">
                      <div className="card p-4 h-100 plano-estudo-card border-primary-subtle">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <h6 className="fw-bold mb-0 text-dark fs-6">
                            {plano.nome}
                          </h6>
                          <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-2 py-1" style={{ fontSize: '11px' }}>
                            Prof. {plano.autor_nome || 'Docente'}
                          </span>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1 rounded">
                            {plano.disciplina}
                          </span>
                          <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded">
                            {plano.total_itens ?? (totalLivros + totalVideoaulas + totalWeb)} itens
                          </span>
                        </div>

                        <div className="rounded-3 p-3 mb-3 bg-light border border-light-subtle">
                          <div className="d-flex flex-wrap gap-2 mb-2 fw-semibold text-dark small">
                            <span>
                              {totalLivros} Livro{totalLivros !== 1 ? 's' : ''}
                            </span>
                            <span>·</span>
                            <span>
                              {totalVideoaulas} Videoaula{totalVideoaulas !== 1 ? 's' : ''}
                            </span>
                            <span>·</span>
                            <span>
                              {totalWeb} Web
                            </span>
                          </div>
                          <div className="d-flex gap-2" aria-hidden="true">
                            <span title="Livros">📘</span>
                            <span title="Videoaulas">📺</span>
                            <span title="Conteúdo web">📄</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-top">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/biblioteca/planos/${plano.id}`)}
                            className="btn btn-link p-0 text-decoration-none fw-semibold text-success small"
                          >
                            Ver Plano Completo →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Compartilhamento de Plano com Turmas Vinculadas ao Professor */}
      {planoCompartilhando && podeCompartilharComTurmas && (
        <div
          className="biblioteca-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-compartilhar-plano-titulo"
        >
          <div className="bg-white rounded-4 shadow-lg p-4 w-100" style={{ maxWidth: '520px' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 id="modal-compartilhar-plano-titulo" className="fw-bold mb-1 text-dark">
                  Compartilhar Plano com Turma
                </h5>
                <p className="text-muted small mb-0">
                  Plano: <strong className="text-dark">{planoCompartilhando.nome}</strong> ({planoCompartilhando.disciplina})
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar modal"
                onClick={fecharModalCompartilhar}
                disabled={salvandoCompartilhamento}
              />
            </div>

            {/* Campo de busca para filtrar as turmas em que o professor está vinculado (1º, 2º ou 3º ano) */}
            <div className="mb-3">
              <label
                htmlFor="input-busca-turma-professor"
                className="form-label small fw-bold text-secondary mb-1"
              >
                PESQUISAR TURMAS VINCULADAS (1º, 2º OU 3º ANO)
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light">🔍</span>
                <input
                  id="input-busca-turma-professor"
                  type="search"
                  className="form-control"
                  placeholder="Digite o ano ou nome da turma (ex: 1º Ano, 2º Ano, 3º Ano)..."
                  value={buscaTurma}
                  onChange={(e) => setBuscaTurma(e.target.value)}
                  disabled={carregandoTurmas || salvandoCompartilhamento}
                />
              </div>
              {/* Atalhos rápidos por série para facilitar a filtragem pelo professor */}
              <div className="d-flex flex-wrap gap-1 mt-2">
                {['', '1º', '2º', '3º'].map((atalho) => (
                  <button
                    key={atalho || 'todas'}
                    type="button"
                    onClick={() => setBuscaTurma(atalho)}
                    className={`btn btn-sm rounded-pill px-2 py-0 ${
                      buscaTurma === atalho ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    {atalho ? `${atalho} Ano` : 'Todas vinculadas'}
                  </button>
                ))}
              </div>
            </div>

            {erroCompartilhamento && (
              <div className="alert alert-warning py-2 small mb-3" role="alert">
                ⚠️ {erroCompartilhamento}
              </div>
            )}

            <form onSubmit={handleSalvarCompartilhamento}>
              <div
                className="border rounded-3 p-2 mb-3 bg-light"
                style={{ maxHeight: '240px', overflowY: 'auto' }}
              >
                {carregandoTurmas ? (
                  <div className="py-4 text-center text-muted small">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Carregando turmas vinculadas ao professor...
                  </div>
                ) : turmasFiltradas.length === 0 ? (
                  <div className="py-3 text-center text-muted small">
                    Nenhuma turma vinculada encontrada para o filtro informado.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {turmasFiltradas.map((turma) => {
                      const selecionada = turmasSelecionadas.includes(turma.id_turma);
                      return (
                        <label
                          key={turma.id_turma}
                          className={`d-flex align-items-center justify-content-between p-2 rounded-3 border bg-white ${
                            selecionada ? 'border-primary bg-primary-subtle' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={selecionada}
                              onChange={() => alternarSelecaoTurma(turma.id_turma)}
                              disabled={salvandoCompartilhamento}
                            />
                            <div>
                              <span className="fw-semibold text-dark small d-block">
                                {turma.nome_identificador || turma.nome_turma}
                              </span>
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                Turno {turma.turno} · Ano Letivo {turma.ano_letivo}
                              </span>
                            </div>
                          </div>
                          {selecionada && (
                            <span className="badge bg-primary rounded-pill" style={{ fontSize: '10px' }}>
                              Selecionada
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {turmasSelecionadas.length} turma(s) selecionada(s)
                </small>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-3 px-3"
                    onClick={fecharModalCompartilhar}
                    disabled={salvandoCompartilhamento}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm biblioteca-btn-primario rounded-3 px-3"
                    disabled={salvandoCompartilhamento || carregandoTurmas}
                  >
                    {salvandoCompartilhamento ? 'Salvando...' : 'Confirmar Compartilhamento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
