/**
 * ModalCiclo.jsx - Modal único para CRIAR e EDITAR um Ciclo Escolar
 *
 * Papel Didático:
 * Reaproveitamos o mesmo formulário em 3 lugares (botão "+ Criar Ciclo", botão "Editar Ciclo"
 * e botão "+" dentro do cadastro de Disciplina). Quem decide se é criação ou edição é a prop `ciclo`.
 *
 * Props:
 * - ciclo: objeto do ciclo ao editar, ou null ao criar;
 * - onFechar(): fecha o modal sem salvar;
 * - onSalvo(cicloSalvo): chamado após salvar com sucesso, devolvendo o ciclo retornado pela API.
 */

import { useState } from "react";
import { criarCiclo, atualizarCiclo } from "../../../services/disciplinasService";

// Limite do comentário (deve ser igual ao `max:256` do StoreCicloRequest no backend)
const LIMITE_DESCRICAO = 256;

const ModalCiclo = ({ ciclo = null, onFechar, onSalvo }) => {
  const editando = Boolean(ciclo);

  // Estados do formulário: iniciam com os dados do ciclo (edição) ou vazios (criação)
  const [nome, setNome] = useState(ciclo?.nome ?? "");
  const [descricao, setDescricao] = useState(ciclo?.descricao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome do ciclo é obrigatório.");
      return;
    }

    setSalvando(true);
    try {
      // Campos devem bater com o StoreCicloRequest: nome e descricao (opcional)
      const payload = { nome: nome.trim(), descricao: descricao.trim() || null };

      const res = editando
        ? await atualizarCiclo(ciclo.id_ciclo, payload)
        : await criarCiclo(payload);

      onSalvo(res?.data, res?.message);
    } catch (err) {
      setErro(err.message || "Erro ao salvar o ciclo.");
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ciclo-titulo"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <h2 id="modal-ciclo-titulo" className="modal-title h5 fw-bold text-dark mb-0">
              {editando ? "Editar Ciclo" : "Cadastrar Novo Ciclo"}
            </h2>
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
              {erro && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                  {erro}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="ciclo-nome" className="form-label small fw-bold text-dark">
                  Nome do Ciclo (Obrigatório):
                </label>
                <input
                  id="ciclo-nome"
                  type="text"
                  className="form-control"
                  placeholder="Ex: 1º Ano - Ensino Médio"
                  maxLength={100}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={salvando}
                  required
                />
              </div>

              <div>
                <label htmlFor="ciclo-descricao" className="form-label small fw-bold text-dark">
                  Comentário (Opcional):
                </label>
                <textarea
                  id="ciclo-descricao"
                  rows={3}
                  className="form-control"
                  placeholder="Breve descrição exibida abaixo do nome do ciclo..."
                  maxLength={LIMITE_DESCRICAO}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={salvando}
                />
                <div className="text-end text-muted small mt-1">
                  {descricao.length}/{LIMITE_DESCRICAO}
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
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Ciclo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCiclo;
