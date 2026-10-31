/**
 * Disciplinas.jsx - Módulo Acadêmico de Gestão e Consulta de Disciplinas por Ciclos
 *
 * Papel Didático:
 * Implementa integralmente a Diretriz 3 (28/10/2026):
 * 1. Visão Especialista / Admin:
 *    - Lista todas as disciplinas agrupadas por "Ciclos" (ex: 1º Ano, 2º Ano, 3º Ano);
 *    - Permite criar, editar (nome + comentário de até 256 caracteres) e excluir ciclos
 *      (a exclusão NÃO apaga as disciplinas: elas vão para "Disciplinas Não Vinculadas");
 *    - Permite criar/editar disciplinas selecionando múltiplos ciclos existentes e, pelo botão "+",
 *      abrir o modal de novo ciclo sem sair do cadastro da disciplina;
 *    - Campos obrigatórios: Nome e Qtd. de Aulas Semanais (calcula e exibe automaticamente
 *      a Qtd. Total de Aulas Anuais = Aulas Semanais * 40 semanas letivas);
 *    - Campos opcionais: Ementa, Habilidades BNCC, Objetivo Geral e Objetivo Específico.
 * 2. Visão Aluno / Professor:
 *    - Exibe de forma semântica e organizada as disciplinas do seu ciclo/turma (ou regência),
 *      com acesso à ementa, habilidades BNCC, objetivos e carga horária.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { formatarDisciplinaCiclo } from "../../utils/formatters";
import ModalCiclo from "../../components/Dashboard/disciplinas/ModalCiclo";
import PainelModulo from "../../components/Dashboard/common/PainelModulo";
import {
  listarDisciplinasPorCiclo,
  excluirCiclo,
  criarDisciplina,
  atualizarDisciplina,
  excluirDisciplina,
} from "../../services/disciplinasService";

const DisciplinasPage = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const podeGerenciar = role === "especialista" || role === "adm";

  const [ciclos, setCiclos] = useState([]);
  const [disciplinasSemCiclo, setDisciplinasSemCiclo] = useState([]);
  const [todasDisciplinas, setTodasDisciplinas] = useState([]);
  const [busca, setBusca] = useState("");
  const [recargaKey, setRecargaKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  // Modal de Criação/Edição de Disciplina
  const [modalAberto, setModalAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState(null);
  const [nome, setNome] = useState("");
  const [aulasSemanais, setAulasSemanais] = useState(4);
  const [ciclosSelecionados, setCiclosSelecionados] = useState([]);
  const [ementa, setEmenta] = useState("");
  const [habilidadesBncc, setHabilidadesBncc] = useState("");
  const [objetivoGeral, setObjetivoGeral] = useState("");
  const [objetivoEspecifico, setObjetivoEspecifico] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState("");

  // Modal de Detalhes Pedagógicos (Ementa / BNCC / Objetivos)
  const [disciplinaDetalhe, setDisciplinaDetalhe] = useState(null);

  // Modal de Ciclo (criar/editar). `origem` indica quem abriu: a página ou o modal de disciplina
  const [modalCiclo, setModalCiclo] = useState({ aberto: false, ciclo: null, origem: "pagina" });

  // Ciclo aguardando confirmação de exclusão
  const [cicloParaExcluir, setCicloParaExcluir] = useState(null);
  const [excluindoCiclo, setExcluindoCiclo] = useState(false);

  const exibirFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  };

  useEffect(() => {
    let ativo = true;

    listarDisciplinasPorCiclo()
      .then((res) => {
        if (!ativo) return;
        setCiclos(res?.ciclos || []);
        setDisciplinasSemCiclo(res?.disciplinas_sem_ciclo || []);
        setTodasDisciplinas(res?.todas_disciplinas || []);
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(err.message || "Não foi possível carregar as disciplinas.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [recargaKey]);

  // Cálculo automático baseado em 40 semanas letivas (Item 3.3)
  const totalAulasCalculado = Math.max(0, Number(aulasSemanais || 0)) * 40;

  const handleAbrirNovaDisciplina = (cicloPreSelecionadoId = null) => {
    setDisciplinaEmEdicao(null);
    setNome("");
    setAulasSemanais(4);
    setCiclosSelecionados(cicloPreSelecionadoId ? [Number(cicloPreSelecionadoId)] : []);
    setEmenta("");
    setHabilidadesBncc("");
    setObjetivoGeral("");
    setObjetivoEspecifico("");
    setErroModal("");
    setModalAberto(true);
  };

  const handleAbrirEditarDisciplina = (disc) => {
    setDisciplinaEmEdicao(disc);
    setNome(disc.nome || "");
    setAulasSemanais(disc.aulas_semanais || Math.max(1, Math.round((disc.carga_horaria_anual || 160) / 40)));
    // A API devolve o identificador do ciclo como `id_ciclo` (e não `id`)
    setCiclosSelecionados((disc.ciclos || []).map((c) => Number(c.id_ciclo)));
    setEmenta(disc.ementa || "");
    setHabilidadesBncc(disc.habilidades_bncc || "");
    setObjetivoGeral(disc.objetivo_geral || "");
    setObjetivoEspecifico(disc.objetivo_especifico || "");
    setErroModal("");
    setModalAberto(true);
  };

  const toggleCicloNoModal = (idCiclo) => {
    const idNum = Number(idCiclo);
    setCiclosSelecionados((prev) =>
      prev.includes(idNum) ? prev.filter((id) => id !== idNum) : [...prev, idNum]
    );
  };

  const handleSalvarDisciplina = async (e) => {
    e.preventDefault();
    setErroModal("");

    if (!nome.trim()) {
      setErroModal("O nome da disciplina é obrigatório.");
      return;
    }

    if (!aulasSemanais || Number(aulasSemanais) < 1) {
      setErroModal("Informe uma quantidade válida de aulas semanais (mínimo 1).");
      return;
    }

    if (ciclosSelecionados.length === 0) {
      setErroModal("Selecione ao menos um Ciclo (ou use o botão + para criar um novo).");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        aulas_semanais: Number(aulasSemanais),
        ciclo_ids: ciclosSelecionados,
        ementa: ementa.trim() || null,
        habilidades_bncc: habilidadesBncc.trim() || null,
        objetivo_geral: objetivoGeral.trim() || null,
        objetivo_especifico: objetivoEspecifico.trim() || null,
      };

      if (disciplinaEmEdicao?.id_disciplina) {
        const res = await atualizarDisciplina(disciplinaEmEdicao.id_disciplina, payload);
        exibirFeedback(res?.message || "Disciplina atualizada com sucesso!");
      } else {
        const res = await criarDisciplina(payload);
        exibirFeedback(res?.message || "Disciplina criada e vinculada ao(s) ciclo(s) com sucesso!");
      }

      setModalAberto(false);
      setRecargaKey((k) => k + 1);
    } catch (err) {
      setErroModal(err.message || "Erro ao salvar disciplina.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirModalCiclo = (ciclo = null, origem = "pagina") => {
    setModalCiclo({ aberto: true, ciclo, origem });
  };

  // Chamado pelo ModalCiclo após criar/editar com sucesso
  const handleCicloSalvo = (cicloSalvo, mensagem) => {
    // Se veio do modal de disciplina, o novo ciclo já retorna marcado
    if (modalCiclo.origem === "disciplina" && !modalCiclo.ciclo && cicloSalvo?.id_ciclo) {
      setCiclosSelecionados((prev) => [...prev, Number(cicloSalvo.id_ciclo)]);
    }

    setModalCiclo({ aberto: false, ciclo: null, origem: "pagina" });
    exibirFeedback(mensagem || "Ciclo salvo com sucesso!");
    // Recarrega a listagem para exibir o ciclo novo/alterado em toda a interface
    setRecargaKey((k) => k + 1);
  };

  const handleConfirmarExcluirCiclo = async () => {
    setExcluindoCiclo(true);
    try {
      await excluirCiclo(cicloParaExcluir.id_ciclo);
      exibirFeedback(`Ciclo "${cicloParaExcluir.nome}" excluído. As disciplinas foram mantidas.`);
      setCicloParaExcluir(null);
      setRecargaKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Não foi possível excluir o ciclo.");
    } finally {
      setExcluindoCiclo(false);
    }
  };

  const handleExcluirDisciplina = async (disc) => {
    if (
      !window.confirm(
        `Deseja realmente remover a disciplina "${disc.nome}" do catálogo escolar?`
      )
    ) {
      return;
    }

    try {
      const res = await excluirDisciplina(disc.id_disciplina);
      exibirFeedback(res?.message || "Disciplina removida com sucesso.");
      setRecargaKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Não foi possível remover a disciplina.");
    }
  };

  const termoFiltro = busca.trim().toLowerCase();

  const filtrarLista = (lista = []) =>
    lista.filter(
      (d) =>
        !termoFiltro ||
        String(d.nome || "").toLowerCase().includes(termoFiltro) ||
        String(d.ementa || "").toLowerCase().includes(termoFiltro) ||
        String(d.habilidades_bncc || "").toLowerCase().includes(termoFiltro)
    );

  // Renderizador de Card de Disciplina com rótulo no formato NOME + CICLO
  const renderCardDisciplina = (disc, cicloContextual = null) => {
    const aulasSem = disc.aulas_semanais || Math.max(1, Math.round((disc.carga_horaria_anual || 160) / 40));
    const totalAulas = disc.total_aulas_anuais || disc.carga_horaria_anual || aulasSem * 40;
    const nomeComCiclo = formatarDisciplinaCiclo(disc, cicloContextual);

    return (
      <div className="col-12 col-md-6 col-xl-4" key={disc.id_disciplina}>
        <div
          className="card h-100 border rounded-3 shadow-none bg-white d-flex flex-column justify-content-between p-2"
          style={{ transition: "box-shadow 0.2s ease" }}
        >
          <div>
            <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
              <h3
                className="h6 fw-bold text-dark mb-0 text-truncate"
                style={{ fontSize: "0.92rem" }}
                title={nomeComCiclo}
              >
                {nomeComCiclo}
              </h3>
              <span
                className="badge bg-primary-subtle text-primary rounded-pill text-nowrap"
                style={{ fontSize: "0.68rem", padding: "0.2rem 0.45rem" }}
              >
                {aulasSem} a/sem • {totalAulas} a/ano
              </span>
            </div>

            {/* Badges dos Ciclos aos quais a disciplina pertence */}
            {Array.isArray(disc.ciclos) && disc.ciclos.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mb-1">
                {disc.ciclos.map((c) => (
                  <span
                    key={c.id_ciclo}
                    className="badge bg-secondary-subtle text-dark rounded-pill"
                    style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}
                  >
                    <i className="bi bi-diagram-3 me-1"></i>
                    {c.nome}
                  </span>
                ))}
              </div>
            )}

            {/* Professores vinculados (Ementa e BNCC removidos da visualização direta; mantidos no modo editar) */}
            {Array.isArray(disc.professores) && disc.professores.length > 0 && (
              <div
                className="small text-secondary text-truncate mb-1"
                style={{ fontSize: "0.78rem" }}
                title={disc.professores.map((p) => p.name).join(", ")}
              >
                <i className="bi bi-person-badge me-1 text-primary"></i>
                <strong>Docente(s):</strong>{" "}
                {disc.professores.map((p) => p.name).join(", ")}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center pt-1 border-top mt-1">
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none px-0 fw-semibold text-secondary"
              style={{ fontSize: "0.78rem" }}
              onClick={() => setDisciplinaDetalhe(disc)}
            >
              <i className="bi bi-eye me-1 text-primary"></i>
              Plano Pedagógico
            </button>

            {podeGerenciar && (
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-primary rounded-start-pill py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => handleAbrirEditarDisciplina(disc)}
                  title="Editar disciplina (inclui Ementa e BNCC)"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger rounded-end-pill py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => handleExcluirDisciplina(disc)}
                  title="Excluir disciplina"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const acoesDisciplinas = (
    <div className="disciplinas-nav-acoes d-flex align-items-center gap-2">
      <div className="input-group" style={{ minWidth: "200px", maxWidth: "280px" }}>
        <span className="input-group-text bg-white border-end-0 text-muted">
          <i className="bi bi-search"></i>
        </span>
        <input
          id="busca-disciplinas"
          type="search"
          className="form-control form-control-sm border-start-0 ps-0 shadow-none"
          placeholder="Buscar disciplina ou BNCC..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {podeGerenciar && (
        <>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold text-nowrap"
            onClick={() => handleAbrirModalCiclo()}
            title="Criar novo ciclo escolar (ex: 1º Ano, 2º Ano...)"
          >
            + Criar Ciclo
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 fw-bold text-nowrap"
            onClick={() => handleAbrirNovaDisciplina()}
            title="Cadastrar nova disciplina na matriz curricular"
          >
            <i className="bi bi-plus-lg me-1"></i>
            Nova Disciplina
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="position-relative">
      {feedback && (
        <div
          className="alert alert-success dashboard-toast py-2 px-3 small z-3"
          role="status"
        >
          ✓ {feedback}
        </div>
      )}

      <PainelModulo acoes={acoesDisciplinas}>
        {erro && (
          <div className="alert alert-danger rounded-3 small mb-4" role="alert">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Carregando ciclos e disciplinas...</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {/* Disciplinas sem ciclo (ex: ciclo excluído): exibidas ANTES dos ciclos */}
            {filtrarLista(disciplinasSemCiclo).length > 0 && (
              <section className="p-2 p-md-3 rounded-3 border border-warning bg-light" aria-labelledby="titulo-nao-vinculadas">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <h2 id="titulo-nao-vinculadas" className="h6 fw-bold text-secondary mb-0">
                    <i className="bi bi-journal-bookmark me-2"></i>
                    Disciplinas Não Vinculadas
                  </h2>
                  <span className="badge bg-secondary rounded-pill">
                    {filtrarLista(disciplinasSemCiclo).length}
                  </span>
                </div>
                <div className="row g-2">
                  {filtrarLista(disciplinasSemCiclo).map((disc) => renderCardDisciplina(disc))}
                </div>
              </section>
            )}

            {/* Listagem agrupada por Ciclos */}
            {ciclos.map((ciclo) => {
              const disciplinasFiltradas = filtrarLista(ciclo.disciplinas || []);
              if (termoFiltro && disciplinasFiltradas.length === 0) return null;

              return (
                <section
                  key={ciclo.id_ciclo}
                  className="p-2 p-md-3 rounded-3 border bg-light"
                  aria-labelledby={`titulo-ciclo-${ciclo.id_ciclo}`}
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-pill px-3 py-2 fs-6">
                          <i className="bi bi-layers-fill me-1"></i>
                          {ciclo.nome}
                        </span>
                        <span id={`titulo-ciclo-${ciclo.id_ciclo}`} className="text-muted small fw-semibold">
                          {disciplinasFiltradas.length} disciplina(s) vinculada(s)
                        </span>
                      </div>
                      {/* Comentário do ciclo, exibido abaixo do rótulo */}
                      {ciclo.descricao && (
                        <p className="text-muted small mb-0 mt-2">{ciclo.descricao}</p>
                      )}
                    </div>

                    {podeGerenciar && (
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                          onClick={() => handleAbrirNovaDisciplina(ciclo.id_ciclo)}
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Adicionar Disciplina ao {ciclo.nome}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold"
                          onClick={() => handleAbrirModalCiclo(ciclo)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Editar Ciclo
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                          onClick={() => setCicloParaExcluir(ciclo)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Excluir Ciclo
                        </button>
                      </div>
                    )}
                  </div>

                  {disciplinasFiltradas.length === 0 ? (
                    <div className="text-center py-3 text-muted small">
                      Nenhuma disciplina vinculada a este ciclo até o momento.
                    </div>
                  ) : (
                    <div className="row g-2">
                      {disciplinasFiltradas.map((disc) => renderCardDisciplina(disc, ciclo))}
                    </div>
                  )}
                </section>
              );
            })}

            {ciclos.length === 0 && todasDisciplinas.length === 0 && (
              <div className="text-center py-5 border rounded-4 bg-light">
                <i className="bi bi-journal-bookmark fs-1 text-muted d-block mb-2"></i>
                <h2 className="h5 fw-bold text-dark">Nenhuma disciplina cadastrada</h2>
                <p className="text-muted small mb-0">
                  Utilize o botão &ldquo;Nova Disciplina&rdquo; para criar o primeiro ciclo e cadastrar as matérias escolares.
                </p>
              </div>
            )}
          </div>
        )}
      </PainelModulo>

      {/* Modal de Criação / Edição de Disciplina (Itens 3.1, 3.2, 3.3) */}
      {modalAberto && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-disciplina-titulo"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <div>
                  <h2 id="modal-disciplina-titulo" className="modal-title h5 fw-bold text-dark mb-0">
                    {disciplinaEmEdicao ? "Editar Disciplina Curricular" : "Cadastrar Nova Disciplina"}
                  </h2>
                  <p className="text-muted small mb-0">
                    A carga horária total é calculada automaticamente considerando 40 semanas letivas.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                ></button>
              </div>

              <form onSubmit={handleSalvarDisciplina}>
                <div className="modal-body py-3">
                  {erroModal && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                      {erroModal}
                    </div>
                  )}

                  {/* Linha 1: Nome (Obrigatório) + Aulas Semanais (Obrigatório) + Total Calculado (40 semanas) */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label htmlFor="disc-nome" className="form-label small fw-bold text-dark">
                        Nome da Disciplina (Obrigatório):
                      </label>
                      <input
                        id="disc-nome"
                        type="text"
                        className="form-control"
                        placeholder="Ex: Língua Portuguesa"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={salvando}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label htmlFor="disc-aulas-semanais" className="form-label small fw-bold text-dark">
                        Qtd. Aulas Semanais:
                      </label>
                      <input
                        id="disc-aulas-semanais"
                        type="number"
                        min={1}
                        max={30}
                        className="form-control"
                        value={aulasSemanais}
                        onChange={(e) => setAulasSemanais(e.target.value)}
                        disabled={salvando}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-bold text-primary">
                        Total Anual (40 sem.):
                      </label>
                      <div className="form-control bg-primary-subtle text-primary fw-bold text-center">
                        {totalAulasCalculado} aulas
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Seleção de Ciclos Existentes E/OU Criação de Novo Ciclo */}
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <label className="form-label small fw-bold text-dark d-block mb-2">
                      Ciclos Escolares da Disciplina (Pode pertencer a vários ciclos, ex: 1º, 2º e 3º Ano):
                    </label>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {ciclos.map((c) => {
                        const ativo = ciclosSelecionados.includes(Number(c.id_ciclo));
                        return (
                          <button
                            key={c.id_ciclo}
                            type="button"
                            onClick={() => toggleCicloNoModal(c.id_ciclo)}
                            className={`btn btn-sm rounded-pill px-3 ${
                              ativo ? "btn-primary fw-bold" : "btn-outline-secondary bg-white"
                            }`}
                          >
                            <i
                              className={`bi ${
                                ativo ? "bi-check-circle-fill" : "bi-circle"
                              } me-1`}
                            ></i>
                            {c.nome}
                          </button>
                        );
                      })}

                      {/* Botão "+": abre o modal de novo ciclo sem perder o que já foi digitado */}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{ width: "2rem", height: "2rem" }}
                        onClick={() => handleAbrirModalCiclo(null, "disciplina")}
                        disabled={salvando}
                        title="Criar novo ciclo e vincular a esta disciplina"
                        aria-label="Criar novo ciclo"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>

                    {ciclos.length === 0 && (
                      <p className="text-muted small mb-0 mt-2">
                        Nenhum ciclo cadastrado. Use o botão + para criar o primeiro.
                      </p>
                    )}
                  </div>

                  {/* Linha 3: Campos Pedagógicos Opcionais (Item 3.3) */}
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label htmlFor="disc-ementa" className="form-label small fw-bold text-dark">
                        Ementa (Opcional):
                      </label>
                      <textarea
                        id="disc-ementa"
                        rows={3}
                        className="form-control"
                        placeholder="Resumo dos conteúdos programáticos da disciplina..."
                        value={ementa}
                        onChange={(e) => setEmenta(e.target.value)}
                        disabled={salvando}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="disc-bncc" className="form-label small fw-bold text-dark">
                        Habilidades BNCC (Opcional):
                      </label>
                      <textarea
                        id="disc-bncc"
                        rows={3}
                        className="form-control"
                        placeholder="Ex: EM13LGG101, EM13LGG102..."
                        value={habilidadesBncc}
                        onChange={(e) => setHabilidadesBncc(e.target.value)}
                        disabled={salvando}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="disc-obj-geral" className="form-label small fw-bold text-dark">
                        Objetivo Geral (Opcional):
                      </label>
                      <textarea
                        id="disc-obj-geral"
                        rows={2}
                        className="form-control"
                        placeholder="Objetivo pedagógico geral da disciplina..."
                        value={objetivoGeral}
                        onChange={(e) => setObjetivoGeral(e.target.value)}
                        disabled={salvando}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label htmlFor="disc-obj-especifico" className="form-label small fw-bold text-dark">
                        Objetivo Específico (Opcional):
                      </label>
                      <textarea
                        id="disc-obj-especifico"
                        rows={2}
                        className="form-control"
                        placeholder="Objetivos específicos de aprendizagem..."
                        value={objetivoEspecifico}
                        onChange={(e) => setObjetivoEspecifico(e.target.value)}
                        disabled={salvando}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-3"
                    onClick={() => setModalAberto(false)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold"
                    disabled={salvando}
                  >
                    {salvando ? "Salvando..." : "Salvar Disciplina"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consulta Detalhada do Plano Pedagógico da Disciplina */}
      {disciplinaDetalhe && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <div>
                  <h2 className="modal-title h5 fw-bold text-primary mb-1">
                    {formatarDisciplinaCiclo(disciplinaDetalhe)}
                  </h2>
                  <span className="badge bg-primary-subtle text-primary rounded-pill">
                    {disciplinaDetalhe.aulas_semanais || 4} aulas semanais •{" "}
                    {disciplinaDetalhe.carga_horaria_anual || 160} aulas anuais (40 semanas)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setDisciplinaDetalhe(null)}
                ></button>
              </div>

              <div className="modal-body py-3 small">
                <div className="mb-3">
                  <strong className="d-block text-dark mb-1">Ementa:</strong>
                  <p className="text-muted mb-0">
                    {disciplinaDetalhe.ementa || "Não informada."}
                  </p>
                </div>
                <div className="mb-3">
                  <strong className="d-block text-dark mb-1">Habilidades BNCC:</strong>
                  <p className="text-muted mb-0">
                    {disciplinaDetalhe.habilidades_bncc || "Não informadas."}
                  </p>
                </div>
                <div className="mb-3">
                  <strong className="d-block text-dark mb-1">Objetivo Geral:</strong>
                  <p className="text-muted mb-0">
                    {disciplinaDetalhe.objetivo_geral || "Não informado."}
                  </p>
                </div>
                <div>
                  <strong className="d-block text-dark mb-1">Objetivo Específico:</strong>
                  <p className="text-muted mb-0">
                    {disciplinaDetalhe.objetivo_especifico || "Não informado."}
                  </p>
                </div>
              </div>

              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm rounded-pill px-4"
                  onClick={() => setDisciplinaDetalhe(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar Ciclo. Fica depois do modal de disciplina para empilhar por cima dele */}
      {modalCiclo.aberto && (
        <ModalCiclo
          ciclo={modalCiclo.ciclo}
          onFechar={() => setModalCiclo({ aberto: false, ciclo: null, origem: "pagina" })}
          onSalvo={handleCicloSalvo}
        />
      )}

      {/* Confirmação de exclusão do Ciclo (disciplinas NÃO são excluídas) */}
      {cicloParaExcluir && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-excluir-ciclo-titulo"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h2 id="modal-excluir-ciclo-titulo" className="modal-title h5 fw-bold text-danger mb-0">
                  Excluir Ciclo
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() => setCicloParaExcluir(null)}
                  disabled={excluindoCiclo}
                ></button>
              </div>
              <div className="modal-body small">
                <p className="mb-2">
                  Deseja realmente excluir o ciclo <strong>{cicloParaExcluir.nome}</strong>?
                </p>
                <p className="text-muted mb-0">
                  As {(cicloParaExcluir.disciplinas || []).length} disciplina(s) deste ciclo{" "}
                  <strong>não serão excluídas</strong>: ficarão em &ldquo;Disciplinas Não
                  Vinculadas&rdquo;. As turmas do ciclo permanecem, apenas sem ciclo.
                </p>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3"
                  onClick={() => setCicloParaExcluir(null)}
                  disabled={excluindoCiclo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-bold"
                  onClick={handleConfirmarExcluirCiclo}
                  disabled={excluindoCiclo}
                >
                  {excluindoCiclo ? "Excluindo..." : "Excluir Ciclo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinasPage;
