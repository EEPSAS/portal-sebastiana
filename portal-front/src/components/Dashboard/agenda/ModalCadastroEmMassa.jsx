/**
 * ModalCadastroEmMassa.jsx - Diálogo Modal de Cadastro em Lote da Agenda (Item 5.6)
 *
 * Papel Didático:
 * Permite aos gestores (Especialista e Adm) cadastrar múltiplos registros de
 * Sábados Letivos e Feriados/Recessos de uma única vez em formato tabular,
 * evitando a repetição do fluxo unitário de abertura de modais.
 */

import { useState } from 'react';

const CATEGORIAS_EM_MASSA = [
  { key: 'sabados', label: 'Sábados Letivos' },
  { key: 'feriados', label: 'Feriados e Recessos' },
];

const criarLinhaVazia = () => ({
  id: Date.now() + Math.random(),
  data: '',
  titulo: '',
  categoria: 'sabados',
  descricao: '',
});

const ModalCadastroEmMassa = ({
  isOpen,
  saving = false,
  error = null,
  onClose,
  onSave,
}) => {
  // Inicializa a tabela por padrão com 3 linhas conforme especificação
  const [linhas, setLinhas] = useState(() => [
    criarLinhaVazia(),
    criarLinhaVazia(),
    criarLinhaVazia(),
  ]);
  const [erroValidacao, setErroValidacao] = useState(null);

  if (!isOpen) return null;

  // Atualiza um campo de uma linha específica e expande a tabela se for a última linha
  const handleChangeCampo = (index, campo, valor) => {
    setErroValidacao(null);
    setLinhas((linhasAtuais) => {
      const novas = [...linhasAtuais];
      novas[index] = { ...novas[index], [campo]: valor };

      // Se a última linha começou a ser preenchida, adiciona automaticamente uma nova linha vazia
      const ultimaLinha = novas[novas.length - 1];
      const temConteudoNaUltima = Boolean(
        ultimaLinha.data || ultimaLinha.titulo.trim() || ultimaLinha.descricao.trim()
      );
      if (temConteudoNaUltima) {
        novas.push(criarLinhaVazia());
      }

      return novas;
    });
  };

  const handleRemoverLinha = (indexParaRemover) => {
    setLinhas((linhasAtuais) => {
      if (linhasAtuais.length <= 1) {
        return [criarLinhaVazia()];
      }
      return linhasAtuais.filter((_, idx) => idx !== indexParaRemover);
    });
  };

  const handleAdicionarLinhaManual = () => {
    setLinhas((linhasAtuais) => [...linhasAtuais, criarLinhaVazia()]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErroValidacao(null);

    // Identifica linhas que possuem algum dado preenchido
    const linhasPreenchidas = [];
    for (let i = 0; i < linhas.length; i++) {
      const row = linhas[i];
      const data = row.data.trim();
      const titulo = row.titulo.trim();
      const categoria = row.categoria;
      const descricao = row.descricao.trim();

      const algumPreenchido = Boolean(data || titulo || descricao);

      // Se estiver totalmente em branco, ignora silenciosamente
      if (!algumPreenchido) {
        continue;
      }

      // Se estiver parcialmente preenchida, valida os campos obrigatórios (* data, titulo, categoria, descricao)
      if (!data || !titulo || !categoria || !descricao) {
        setErroValidacao(
          `A linha ${i + 1} está incompleta. Todos os campos (Data, Título, Categoria e Descrição) são obrigatórios.`
        );
        return;
      }

      linhasPreenchidas.push({
        data,
        titulo,
        categoria,
        descricao,
      });
    }

    if (linhasPreenchidas.length === 0) {
      setErroValidacao('Preencha ao menos uma linha da tabela para efetuar o cadastro.');
      return;
    }

    onSave(linhasPreenchidas);
  };

  return (
    <div
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (!saving && mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
      className="agenda-modal-overlay"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-em-massa-titulo"
        className="agenda-modal-dialog"
        style={{ maxWidth: '900px', width: '95%' }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div>
            <h2 id="modal-em-massa-titulo" className="agenda-modal-title mb-1 fs-5 text-primary">
              <i className="bi bi-table me-2"></i>
              Cadastro em Massa de Datas Escolares
            </h2>
            <p className="text-muted small mb-0">
              Cadastre múltiplos Sábados Letivos e Feriados/Recessos de uma única vez em lote.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-close"
            aria-label="Fechar modal"
            disabled={saving}
          />
        </div>

        {(erroValidacao || error) && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {erroValidacao || error?.message || 'Erro ao processar o cadastro em massa.'}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="table-responsive border rounded-3 mb-3" style={{ maxHeight: '420px' }}>
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr className="small text-secondary">
                  <th scope="col" style={{ width: '40px' }} className="text-center">#</th>
                  <th scope="col" style={{ width: '170px' }}>Data *</th>
                  <th scope="col" style={{ width: '220px' }}>Título *</th>
                  <th scope="col" style={{ width: '190px' }}>Categoria *</th>
                  <th scope="col">Descrição *</th>
                  <th scope="col" style={{ width: '48px' }} className="text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, index) => (
                  <tr key={linha.id || index}>
                    <td className="text-center small text-muted fw-semibold">
                      {index + 1}
                    </td>
                    <td>
                      <input
                        type="date"
                        value={linha.data}
                        onChange={(e) => handleChangeCampo(index, 'data', e.target.value)}
                        className="form-control form-control-sm"
                        aria-label={`Data da linha ${index + 1}`}
                        disabled={saving}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        maxLength={255}
                        placeholder="Ex.: Sábado Temático"
                        value={linha.titulo}
                        onChange={(e) => handleChangeCampo(index, 'titulo', e.target.value)}
                        className="form-control form-control-sm"
                        aria-label={`Título da linha ${index + 1}`}
                        disabled={saving}
                      />
                    </td>
                    <td>
                      <select
                        value={linha.categoria}
                        onChange={(e) => handleChangeCampo(index, 'categoria', e.target.value)}
                        className="form-select form-select-sm"
                        aria-label={`Categoria da linha ${index + 1}`}
                        disabled={saving}
                      >
                        {CATEGORIAS_EM_MASSA.map((cat) => (
                          <option key={cat.key} value={cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Ex.: Reposição letiva"
                        value={linha.descricao}
                        onChange={(e) => handleChangeCampo(index, 'descricao', e.target.value)}
                        className="form-control form-control-sm"
                        aria-label={`Descrição da linha ${index + 1}`}
                        disabled={saving}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoverLinha(index)}
                        className="btn btn-sm btn-outline-danger p-1 lh-1 rounded"
                        title="Remover linha"
                        disabled={saving || linhas.length <= 1}
                      >
                        <i className="bi bi-trash small"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              onClick={handleAdicionarLinhaManual}
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              disabled={saving}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Adicionar Linha
            </button>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-sm btn-outline-secondary rounded-pill px-4"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i>
                    Salvar Datas em Massa
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ModalCadastroEmMassa;
