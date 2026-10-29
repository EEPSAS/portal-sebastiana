/**
 * ModalAdicionarAoPlano.jsx - Modal de Seleção e Adição de Conteúdo aos Planos de Estudos
 *
 * Papel Didático:
 * Permite ao estudante ou professor associar qualquer material da biblioteca
 * (livros físicos/digitais, videoaulas do YouTube ou conteúdos pesquisados na web)
 * a uma trilha de estudos criada por ele:
 * - Filtra apenas os planos de autoria própria do usuário logado;
 * - Permite criação inline de um novo plano caso não exista nenhum;
 * - Suporta edição rápida de título e URL para conteúdos web pesquisados no Google;
 * - Previne adições em duplicidade com feedback visual imediato.
 */

import { useState, useEffect } from 'react';
import { planosService } from '../../../services/biblioteca/planosService';
import { listarDisciplinas } from '../../../services/disciplinasService';
import { formatarDisciplinaCiclo } from '../../../utils/formatters';

// Sugestões predefinidas para o campo de upgrade 'conteúdo' (permite digitação livre também)
const SUGESTOES_CONTEUDO_PADRAO = [
  'Informática',
  'Inglês',
  'Matemática',
  'Redação',
  'Robótica',
  'Física',
  'Química',
  'Biologia',
  'História',
  'Geografia',
  'Filosofia',
  'Sociologia',
  'Espanhol',
  'Educação Física',
  'Arte',
];

export default function ModalAdicionarAoPlano({ item, aoFechar, aoSucesso }) {
  const [planos, setPlanos] = useState([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(true);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState([]);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(true);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [modoCriarNovo, setModoCriarNovo] = useState(false);
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    disciplina_id: '',
    disciplina: '',
    conteudo: '',
  });

  // Estados editáveis para conteúdos web pesquisados
  const [dadosItem, setDadosItem] = useState({
    titulo: item?.titulo || '',
    url: item?.url || '',
    descricao: item?.descricao || '',
    fonte: item?.fonte || 'Pesquisa Google Web',
  });

  // Carrega os planos próprios do usuário e as disciplinas do sistema na abertura do modal
  useEffect(() => {
    let montado = true;

    // 1. Carrega Planos Próprios do Usuário
    planosService
      .listar()
      .then((lista) => {
        if (!montado) return;
        const todosPlanos = Array.isArray(lista) ? lista : (lista?.data || []);
        // Permite adicionar itens apenas aos planos criados pelo próprio usuário
        const planosProprios = todosPlanos.filter((p) => !p.compartilhado_por_professor);
        setPlanos(planosProprios);

        if (planosProprios.length > 0) {
          setPlanoSelecionadoId(String(planosProprios[0].id));
        } else {
          // Se o usuário ainda não tiver planos próprios, ativa o formulário inline de criação
          setModoCriarNovo(true);
        }
      })
      .catch((err) => {
        if (!montado) return;
        setErro(err.message || 'Erro ao carregar seus planos de estudo.');
      })
      .finally(() => {
        if (!montado) return;
        setCarregandoPlanos(false);
      });

    // 2. Carrega Disciplinas vinculadas ao perfil de acesso do usuário logado
    listarDisciplinas({ vinculadas: 1 })
      .then((lista) => {
        if (!montado) return;
        const arrayDisciplinas = Array.isArray(lista) ? lista : (lista?.data || []);
        setDisciplinasDisponiveis(arrayDisciplinas);
        if (arrayDisciplinas.length > 0) {
          setNovoPlano((prev) => ({
            ...prev,
            disciplina_id: String(arrayDisciplinas[0].id_disciplina),
            disciplina: arrayDisciplinas[0].nome,
          }));
        }
      })
      .catch((err) => {
        console.error('Erro ao listar disciplinas vinculadas no modal:', err);
      })
      .finally(() => {
        if (!montado) return;
        setCarregandoDisciplinas(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');

    const tituloFinal = (item.editavel ? dadosItem.titulo : item.titulo)?.trim();
    const urlFinal = (item.editavel ? dadosItem.url : item.url)?.trim() || null;
    const descricaoFinal = (item.editavel ? dadosItem.descricao : item.descricao)?.trim() || null;
    const fonteFinal = (item.editavel ? dadosItem.fonte : item.fonte)?.trim() || null;

    if (!tituloFinal) {
      setErro('Informe o título do conteúdo antes de salvar no plano.');
      return;
    }

    setSalvando(true);

    try {
      let planoId = planoSelecionadoId;

      // 1. Se estiver no modo de criação inline, cria o plano primeiro
      if (modoCriarNovo) {
        if (!novoPlano.nome.trim()) {
          setErro('Informe o nome do novo plano de estudos.');
          setSalvando(false);
          return;
        }

        const discSelecionada = disciplinasDisponiveis.find(
          (d) => String(d.id_disciplina) === String(novoPlano.disciplina_id)
        );

        const planoCriado = await planosService.criar({
          nome: novoPlano.nome.trim(),
          disciplina_id: novoPlano.disciplina_id ? Number(novoPlano.disciplina_id) : undefined,
          disciplina: discSelecionada ? discSelecionada.nome : novoPlano.disciplina || undefined,
          conteudo: novoPlano.conteudo?.trim() || null,
        });
        planoId = planoCriado.id;
      }

      if (!planoId) {
        setErro('Selecione ou crie um plano de estudos.');
        setSalvando(false);
        return;
      }

      // 2. Adiciona o item ao plano (incluindo livro_id, duracao e url capturados)
      await planosService.adicionarItem(planoId, {
        tipo: item.tipo,
        livro_id: item.livro_id ? Number(item.livro_id) : null,
        conteudo_id: item.conteudo_id ? String(item.conteudo_id) : (urlFinal || tituloFinal),
        titulo: tituloFinal,
        descricao: descricaoFinal,
        url: urlFinal,
        thumbnail: item.thumbnail || null,
        fonte: fonteFinal,
        duracao: item.duracao || null,
      });

      aoSucesso?.('Conteúdo adicionado ao plano de estudos com sucesso!');
      aoFechar();
    } catch (err) {
      setErro(err.message || 'Não foi possível adicionar o conteúdo ao plano.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="biblioteca-modal-overlay"
      onClick={aoFechar}
      role="presentation"
    >
      <div
        className="biblioteca-modal-dialog p-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-plano-titulo"
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 id="modal-plano-titulo" className="fw-bold mb-0 text-dark fs-6">
            Adicionar aos Planos de Estudos
          </h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={aoFechar}
            disabled={salvando}
          />
        </div>

        {/* Resumo do Conteúdo Selecionado ou Campos Editáveis para Pesquisa Web */}
        {!item.editavel ? (
          <div className="p-3 bg-light rounded-3 mb-3 border">
            <div className="d-flex gap-3 align-items-center">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="rounded object-fit-cover flex-shrink-0"
                  style={{ width: '56px', height: '56px' }}
                />
              ) : (
                <div
                  className="bg-primary-subtle text-primary rounded d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '56px', height: '56px', fontSize: '20px' }}
                >
                  {item.tipo === 'videoaula' ? '📺' : item.tipo === 'livro' ? '📘' : '📄'}
                </div>
              )}
              <div className="overflow-hidden flex-grow-1">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span className="badge bg-secondary-subtle text-secondary-emphasis small">
                    {item.tipo === 'videoaula' ? 'Videoaula' : item.tipo === 'livro' ? 'Livro' : 'Conteúdo Web'}
                  </span>
                  {item.tipo === 'videoaula' && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                      ⏱️ Duração: {item.duracao || 'Consultando...'}
                    </span>
                  )}
                </div>
                <h6 className="fw-semibold text-dark mb-0 small text-truncate" title={item.titulo}>
                  {item.titulo}
                </h6>
                {item.fonte && (
                  <small className="text-muted d-block text-truncate">
                    {item.fonte}
                  </small>
                )}
              </div>
            </div>

            {item.tipo === 'videoaula' && (
              <div className="mt-2 pt-2 border-top small">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-secondary fw-semibold">⏱️ Duração capturada:</span>
                  <span className="fw-bold text-dark">{item.duracao || 'Não informada'}</span>
                </div>
                {item.url && (
                  <div className="text-truncate">
                    <span className="text-secondary fw-semibold me-1">🔗 URL do vídeo:</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none"
                      title={item.url}
                    >
                      {item.url}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-light rounded-3 mb-3 border d-flex flex-column gap-2">
            <div>
              <label htmlFor="item-web-titulo" className="form-label small fw-bold text-secondary mb-1">
                TÍTULO DO CONTEÚDO PESQUISADO *
              </label>
              <input
                id="item-web-titulo"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex: Resumo de Revolução Industrial - Brasil Escola"
                value={dadosItem.titulo}
                onChange={(e) => setDadosItem({ ...dadosItem, titulo: e.target.value })}
                disabled={salvando}
                required
              />
            </div>
            <div>
              <label htmlFor="item-web-url" className="form-label small fw-bold text-secondary mb-1">
                LINK / URL DO MATERIAL (OPCIONAL)
              </label>
              <input
                id="item-web-url"
                type="url"
                className="form-control form-control-sm"
                placeholder="https://..."
                value={dadosItem.url}
                onChange={(e) => setDadosItem({ ...dadosItem, url: e.target.value })}
                disabled={salvando}
              />
            </div>
            <div>
              <label htmlFor="item-web-desc" className="form-label small fw-bold text-secondary mb-1">
                ANOTAÇÃO OU RESUMO (OPCIONAL)
              </label>
              <input
                id="item-web-desc"
                type="text"
                className="form-control form-control-sm"
                placeholder="Breve descrição do artigo ou referência..."
                value={dadosItem.descricao}
                onChange={(e) => setDadosItem({ ...dadosItem, descricao: e.target.value })}
                disabled={salvando}
              />
            </div>
          </div>
        )}

        {/* Mensagem de Erro / Alerta */}
        {erro && (
          <div className="alert alert-warning py-2 small mb-3 d-flex align-items-center gap-2" role="alert">
            <span>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {carregandoPlanos ? (
          <div className="py-4 text-center text-muted" role="status">
            <div className="spinner-border spinner-border-sm text-primary mb-2" />
            <p className="small mb-0">Carregando seus planos de estudos...</p>
          </div>
        ) : (
          <form onSubmit={handleSalvar}>
            {/* Cabeçalho com Lista de Seleção e Botão para Criar Novo Plano */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label htmlFor="select-plano" className="form-label small fw-bold text-secondary mb-0">
                {modoCriarNovo ? 'CRIAR NOVO PLANO DE ESTUDOS' : 'SELECIONE O PLANO DE ESTUDOS'}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold"
                onClick={() => {
                  setModoCriarNovo(!modoCriarNovo);
                  setErro('');
                }}
                disabled={salvando}
              >
                {modoCriarNovo ? '← Escolher plano existente' : '+ Criar novo plano'}
              </button>
            </div>

            {!modoCriarNovo ? (
              <div className="mb-4">
                {planos.length > 0 ? (
                  <select
                    id="select-plano"
                    className="form-select form-select-sm"
                    value={planoSelecionadoId}
                    onChange={(e) => setPlanoSelecionadoId(e.target.value)}
                    disabled={salvando}
                    required
                  >
                    {planos.map((plano) => (
                      <option key={plano.id} value={plano.id}>
                        {plano.nome} ({plano.disciplina}) · {plano.total_itens ?? 0} itens
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="alert alert-light border small mb-0">
                    Você ainda não possui planos cadastrados. Clique em <strong>"+ Criar novo plano"</strong> acima para criar o primeiro!
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 d-flex flex-column gap-2">
                <div>
                  <label htmlFor="novo-plano-nome" className="form-label small fw-bold text-secondary mb-1">
                    NOME DO PLANO
                  </label>
                  <input
                    id="novo-plano-nome"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: Revisão para o ENEM"
                    value={novoPlano.nome}
                    onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                    required
                    disabled={salvando}
                  />
                </div>

                <div>
                  <label htmlFor="novo-plano-disciplina" className="form-label small fw-bold text-secondary mb-1">
                    DISCIPLINA DO SISTEMA
                  </label>
                  <select
                    id="novo-plano-disciplina"
                    className="form-select form-select-sm"
                    value={novoPlano.disciplina_id}
                    onChange={(e) => {
                      const discId = e.target.value;
                      const discObj = disciplinasDisponiveis.find((d) => String(d.id_disciplina) === String(discId));
                      setNovoPlano((prev) => ({
                        ...prev,
                        disciplina_id: discId,
                        disciplina: discObj ? discObj.nome : prev.disciplina,
                      }));
                    }}
                    disabled={salvando || carregandoDisciplinas}
                  >
                    {disciplinasDisponiveis.length === 0 ? (
                      <option value="">
                        {carregandoDisciplinas ? 'Carregando disciplinas...' : 'Nenhuma disciplina vinculada'}
                      </option>
                    ) : (
                      disciplinasDisponiveis.map((d) => (
                        <option key={d.id_disciplina} value={d.id_disciplina}>
                          {formatarDisciplinaCiclo(d)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="novo-plano-conteudo" className="form-label small fw-bold text-secondary mb-1">
                    CONTEÚDO / ÁREA TEMÁTICA (UPGRADE)
                  </label>
                  <input
                    id="novo-plano-conteudo"
                    type="text"
                    list="sugestoes-conteudo-inline"
                    className="form-control form-control-sm"
                    placeholder="Selecione ou digite (Ex: Informática, Redação...)"
                    value={novoPlano.conteudo}
                    onChange={(e) => setNovoPlano({ ...novoPlano, conteudo: e.target.value })}
                    maxLength={150}
                    disabled={salvando}
                  />
                  <datalist id="sugestoes-conteudo-inline">
                    {SUGESTOES_CONTEUDO_PADRAO.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                onClick={aoFechar}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                disabled={salvando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-success rounded-pill px-4 fw-semibold"
                disabled={salvando || (!modoCriarNovo && planos.length === 0)}
              >
                {salvando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  'Confirmar Adição'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
