/**
 * PlanosAba.jsx - Aba de Gestão de Planos de Estudo da Biblioteca
 *
 * Papel Didático:
 * Centraliza as trilhas de estudo do estudante e professor:
 * - Criação ágil de novos planos categorizados por disciplina;
 * - Listagem de cartões de planos com contadores reais por tipo (livros, videoaulas e web);
 * - Navegação direta para a visualização detalhada do plano ('/dashboard/biblioteca/planos/:id');
 * - Exclusão de planos com confirmação visual e feedback.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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

  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    disciplina: 'Matemática',
  });

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

  // Exclusão de um plano
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

  return (
    <section aria-label="Planos de Estudos">
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark fs-6">Meus Planos de Estudos</h4>
        <p className="text-muted mb-0 small">
          Organize seus livros do acervo, videoaulas do YouTube e referências didáticas em trilhas temáticas.
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
        /* Grade de Cartões de Plano */
        <div className="row g-4 mt-1">
          {planos.map((plano) => {
            const totalLivros = plano.livros_count ?? 0;
            const totalVideoaulas = plano.videoaulas_count ?? 0;
            const totalWeb = plano.conteudos_web_count ?? 0;

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

                  <h6 className="fw-bold mb-3 text-dark fs-6 pe-4">
                    {plano.nome}
                  </h6>

                  <div className="d-flex gap-2 mb-4">
                    <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1 rounded">
                      {plano.disciplina}
                    </span>
                    <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded">
                      {plano.total_itens ?? (totalLivros + totalVideoaulas + totalWeb)} itens
                    </span>
                  </div>

                  <div className="rounded-3 p-3 mb-4 bg-light border border-light-subtle">
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

                  <div className="mt-auto">
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

          {planos.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              <span className="fs-1 d-block mb-2">📁</span>
              <p className="mb-1 fw-semibold fs-6">Nenhum plano de estudos cadastrado.</p>
              <p className="small text-secondary">
                Crie um plano acima ou utilize o botão "Adicionar aos planos" ao navegar pelas videoaulas e conteúdos web.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
