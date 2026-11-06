/**
 * ModalDisciplina.jsx - Modal Reutilizável de Criação e Edição de Disciplina
 *
 * Papel Didático:
 * Permite cadastrar ou editar os dados completos de uma disciplina:
 * - Nome e quantidade de aulas semanais (com cálculo automático do total anual = 40 semanas letivas);
 * - Vínculo com múltiplos Ciclos Curriculares através de pills interativas;
 * - Botão "+" para cadastrar um novo Ciclo em tempo de execução sem perder o formulário preenchido;
 * - Campos pedagógicos estruturados: Ementa, Habilidades BNCC, Objetivo Geral e Objetivo Específico.
 *
 * Arquitetura de Estado Limpo:
 * Utiliza o padrão canônico do React de remount por 'key', eliminando cascading renders
 * e garantindo que os campos reflitam fielmente os dados da disciplina em edição.
 */

import { useState } from "react";
import { criarDisciplina, atualizarDisciplina } from "../../../services/disciplinasService";

function FormModalDisciplina({
  disciplina = null,
  ciclos = [],
  cicloPadraoId = null,
  onFechar,
  onSalvo,
  onAbrirModalCiclo,
}) {
  const [nome, setNome] = useState(disciplina?.nome || "");
  const [aulasSemanais, setAulasSemanais] = useState(
    disciplina?.aulas_semanais ||
      Math.max(1, Math.round((disciplina?.carga_horaria_anual || 160) / 40))
  );
  const [ciclosSelecionados, setCiclosSelecionados] = useState(() => {
    if (disciplina?.ciclos && disciplina.ciclos.length > 0) {
      return disciplina.ciclos.map((c) => Number(c.id_ciclo));
    }
    return cicloPadraoId ? [Number(cicloPadraoId)] : [];
  });
  const [ementa, setEmenta] = useState(disciplina?.ementa || "");
  const [habilidadesBncc, setHabilidadesBncc] = useState(
    disciplina?.habilidades_bncc || ""
  );
  const [objetivoGeral, setObjetivoGeral] = useState(
    disciplina?.objetivo_geral || ""
  );
  const [objetivoEspecifico, setObjetivoEspecifico] = useState(
    disciplina?.objetivo_especifico || ""
  );
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState("");

  const totalAulasCalculado = Math.max(0, Number(aulasSemanais || 0)) * 40;

  const toggleCiclo = (idCiclo) => {
    const idNum = Number(idCiclo);
    setCiclosSelecionados((prev) =>
      prev.includes(idNum) ? prev.filter((id) => id !== idNum) : [...prev, idNum]
    );
  };

  const handleSubmit = async (e) => {
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

      let res;
      if (disciplina?.id_disciplina) {
        res = await atualizarDisciplina(disciplina.id_disciplina, payload);
        onSalvo?.(
          res?.data || res,
          res?.message || "Disciplina atualizada com sucesso!"
        );
      } else {
        res = await criarDisciplina(payload);
        onSalvo?.(
          res?.data || res,
          res?.message || "Disciplina cadastrada e vinculada ao(s) ciclo(s) com sucesso!"
        );
      }
    } catch (err) {
      setErroModal(err.message || "Erro ao salvar disciplina.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-disciplina-titulo"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h2 id="modal-disciplina-titulo" className="modal-title h5 fw-bold text-dark mb-0">
                {disciplina ? "Editar Disciplina Curricular" : "Cadastrar Nova Disciplina"}
              </h2>
              <p className="text-muted small mb-0">
                A carga horária total é calculada automaticamente considerando 40 semanas letivas.
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onFechar}
              disabled={salvando}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body py-3">
              {erroModal && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                  {erroModal}
                </div>
              )}

              {/* Linha 1: Nome + Aulas Semanais + Total Anual */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="disc-nome-input" className="form-label small fw-bold text-dark">
                    Nome da Disciplina (Obrigatório):
                  </label>
                  <input
                    id="disc-nome-input"
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
                  <label htmlFor="disc-aulas-input" className="form-label small fw-bold text-dark">
                    Qtd. Aulas Semanais:
                  </label>
                  <input
                    id="disc-aulas-input"
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

              {/* Linha 2: Ciclos Escolares da Disciplina */}
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
                        onClick={() => toggleCiclo(c.id_ciclo)}
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

                  {/* Botão "+" para cadastrar novo ciclo */}
                  {onAbrirModalCiclo && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: "2rem", height: "2rem" }}
                      onClick={onAbrirModalCiclo}
                      disabled={salvando}
                      title="Criar novo ciclo e vincular a esta disciplina"
                      aria-label="Criar novo ciclo"
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  )}
                </div>

                {ciclos.length === 0 && (
                  <p className="text-muted small mb-0 mt-2">
                    Nenhum ciclo cadastrado. Use o botão + para criar o primeiro.
                  </p>
                )}
              </div>

              {/* Linha 3: Campos Pedagógicos Opcionais */}
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label htmlFor="disc-ementa-input" className="form-label small fw-bold text-dark">
                    Ementa (Opcional):
                  </label>
                  <textarea
                    id="disc-ementa-input"
                    rows={3}
                    className="form-control"
                    placeholder="Resumo dos conteúdos programáticos da disciplina..."
                    value={ementa}
                    onChange={(e) => setEmenta(e.target.value)}
                    disabled={salvando}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="disc-bncc-input" className="form-label small fw-bold text-dark">
                    Habilidades BNCC (Opcional):
                  </label>
                  <textarea
                    id="disc-bncc-input"
                    rows={3}
                    className="form-control"
                    placeholder="Ex: EM13LGG101, EM13LGG102..."
                    value={habilidadesBncc}
                    onChange={(e) => setHabilidadesBncc(e.target.value)}
                    disabled={salvando}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="disc-obj-geral-input" className="form-label small fw-bold text-dark">
                    Objetivo Geral (Opcional):
                  </label>
                  <textarea
                    id="disc-obj-geral-input"
                    rows={2}
                    className="form-control"
                    placeholder="Objetivo pedagógico geral da disciplina..."
                    value={objetivoGeral}
                    onChange={(e) => setObjetivoGeral(e.target.value)}
                    disabled={salvando}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="disc-obj-especifico-input" className="form-label small fw-bold text-dark">
                    Objetivo Específico (Opcional):
                  </label>
                  <textarea
                    id="disc-obj-especifico-input"
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
                onClick={onFechar}
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
  );
}

export default function ModalDisciplina({ aberto, disciplina, cicloPadraoId, ...props }) {
  if (!aberto) return null;

  const keyUnica = disciplina?.id_disciplina
    ? `edicao-${disciplina.id_disciplina}`
    : `novo-${cicloPadraoId || "geral"}`;

  return (
    <FormModalDisciplina
      key={keyUnica}
      disciplina={disciplina}
      cicloPadraoId={cicloPadraoId}
      {...props}
    />
  );
}
